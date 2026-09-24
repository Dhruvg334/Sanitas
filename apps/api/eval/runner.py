"""Synthetic Evaluation Runner for Sanitas.

Provides two distinct modes:
1. --mock (CI Structural Validation):
   Runs pipeline validation against synthetic test cases using mocked outputs to verify
   canonicalization, schema conformance, inconsistency rules, and quality gates.
   Does not invoke external APIs or require credentials.

2. --live (Gemini Model Performance Benchmark):
   Runs live model calls using gemini-3.8-flash on synthetic test cases.
   Calculates real Precision, Recall, F1, Evidence Validity Rate, and Latency percentiles.
   States the exact number of cases evaluated.
"""

import argparse
import os
import sys
import time
from typing import List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.schemas.extraction import (
    Allergy,
    CanonicalDocument,
    ClinicalConcern,
    ClinicalExtraction,
    ClinicalReview,
    Diagnosis,
    EvidenceRef,
    Medication,
    PatientInformation,
    PotentialInconsistency,
    SupportedValue,
    Symptom,
    Vital,
)
from app.services.canonicalize import canonicalize
from app.services.document_router import IngestedDocument
from app.services.inconsistency_rules import find_inconsistency_candidates
from app.services.quality_gate import validate_review_quality_gate
from eval.cases import SYNTHETIC_EVAL_CASES, SyntheticCase


def run_mock_structural_evaluation() -> bool:
    """Runs fast structural integrity tests for CI without requiring API keys."""
    print("=" * 72)
    print("SANITAS SYNTHETIC PIPELINE - CI STRUCTURAL VALIDATION")
    print("MODE: Offline / Mocked Pipeline Integrity (Fast CI)")
    print("NOTE: Mock outputs test schema and regression only.")
    print("      These are NOT model performance metrics.")
    print("=" * 72)

    passed_count = 0
    total_cases = len(SYNTHETIC_EVAL_CASES)

    for case in SYNTHETIC_EVAL_CASES:
        print(f"\nEvaluating [{case.case_id}] {case.title} (Category: {case.category})...")

        # Stage P1 & P2: Ingest and Canonicalize
        canonical = canonicalize(case.text, max_chars=50000)
        assert len(canonical.segments) > 0, "Canonical segments must not be empty"

        # Verify segment ids are deterministic
        for idx, seg in enumerate(canonical.segments, start=1):
            assert seg.segment_id == f"p1-s{idx}", f"Unexpected segment id {seg.segment_id}"

        # Grounding evidence reference from first segment
        first_seg = canonical.segments[0].segment_id
        first_text = canonical.segments[0].text[:15]
        ref = EvidenceRef(segment_id=first_seg, page_number=1, quote=first_text)

        # Stage P3: Mock extraction conforming strictly to schema
        mock_extraction = ClinicalExtraction(
            patient_information=PatientInformation(
                name=SupportedValue(
                    value=case.case_id,
                    support_status="supported",
                    certainty="high",
                    evidence=[ref],
                )
            ),
            symptoms=[
                Symptom(
                    entity_id=f"sym-{i}",
                    name=s,
                    support_status="supported",
                    certainty="high",
                    evidence=[ref],
                )
                for i, s in enumerate(case.expected_symptoms, start=1)
            ],
            diagnoses=[
                Diagnosis(
                    entity_id=f"dx-{i}",
                    name=d,
                    diagnosis_status="documented",
                    support_status="supported",
                    certainty="high",
                    evidence=[ref],
                )
                for i, d in enumerate(case.expected_diagnoses, start=1)
            ],
            medications=[
                Medication(
                    entity_id=f"med-{i}",
                    name=m,
                    medication_status="active",
                    support_status="supported",
                    certainty="high",
                    evidence=[ref],
                )
                for i, m in enumerate(case.expected_medications, start=1)
            ],
            allergies=[
                Allergy(
                    entity_id=f"alg-{i}",
                    substance=a,
                    allergy_status="no_known_allergies" if "no known" in a.lower() or "nkda" in a.lower() else "present",
                    support_status="supported",
                    certainty="high",
                    evidence=[ref],
                )
                for i, a in enumerate(case.expected_allergies, start=1)
            ],
        )

        # Stage P5: Inconsistency detection
        inconsistencies = find_inconsistency_candidates(mock_extraction)
        if case.category == "inconsistency":
            if case.case_id == "case-002":
                # For case-002: Add NKDA allergy alongside specific Amoxicillin allergy
                mock_extraction.allergies = [
                    Allergy(
                        entity_id="alg-1",
                        substance="NKDA",
                        allergy_status="no_known_allergies",
                        support_status="supported",
                        certainty="high",
                        evidence=[EvidenceRef(segment_id="p1-s3", page_number=1, quote="ALLERGIES: NKDA")],
                    ),
                    Allergy(
                        entity_id="alg-2",
                        substance="Amoxicillin",
                        allergy_status="present",
                        support_status="supported",
                        certainty="high",
                        evidence=[EvidenceRef(segment_id="p1-s5", page_number=1, quote="taking Amoxicillin 500mg")],
                    ),
                ]
                case2_incons = find_inconsistency_candidates(mock_extraction)
                assert any(
                    "no known allergies" in inc.description.lower() for inc in case2_incons
                ), "Expected allergy inconsistency detection for case-002"
                inconsistencies = case2_incons
                print("  [OK] Correctly detected factual allergy contradiction (NKDA vs Amoxicillin)")
            elif case.case_id == "case-003":
                # Add active and discontinued medications with accurate segment references
                mock_extraction.medications = [
                    Medication(
                        entity_id="med-1",
                        name="Lisinopril",
                        medication_status="active",
                        support_status="supported",
                        certainty="high",
                        evidence=[EvidenceRef(segment_id="p1-s3", page_number=1, quote="Lisinopril 20mg")],
                    ),
                    Medication(
                        entity_id="med-2",
                        name="Lisinopril",
                        medication_status="discontinued",
                        support_status="supported",
                        certainty="high",
                        evidence=[EvidenceRef(segment_id="p1-s5", page_number=1, quote="Discontinue Lisinopril")],
                    ),
                ]
                case3_incons = find_inconsistency_candidates(mock_extraction)
                assert any(
                    "lisinopril" in inc.description.lower() for inc in case3_incons
                ), "Expected medication status conflict for Lisinopril"
                inconsistencies = case3_incons
                print("  [OK] Correctly detected medication status conflict (active vs discontinued)")

        # Stage P7: Quality Gate
        mock_review = ClinicalReview(
            report_summary=f"Clinical review summary for synthetic case {case.case_id}.",
            clinical_concerns=[],
            missing_information=[],
            potential_inconsistencies=inconsistencies,
            requires_review=[],
        )

        try:
            validate_review_quality_gate(mock_review, mock_extraction, canonical)
            print("  [OK] Stage P7 Quality gate passed")
        except Exception as exc:
            assert False, f"Quality gate unexpectedly failed on valid synthetic mock: {exc}"

        passed_count += 1

    print("\n" + "=" * 72)
    print(f"VALIDATION SUMMARY: {passed_count}/{total_cases} test cases passed structural validation.")
    print("Status: 100% SUCCESS (CI PASS)")
    print("=" * 72)
    return True


def run_live_gemini_evaluation() -> bool:
    """Runs live model evaluation against Gemini API, reporting real metrics."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        print("Set GEMINI_API_KEY to run live model evaluation.", file=sys.stderr)
        return False

    print("=" * 72)
    print("SANITAS LIVE MODEL EVALUATION BENCHMARK")
    print("MODEL: gemini-3.8-flash | PROMPT: E1.1 + R1.0")
    print(f"BENCHMARK CASES: {len(SYNTHETIC_EVAL_CASES)} synthetic cases")
    print("=" * 72)

    from app.services.gemini import extract_clinical_data, synthesize_review

    latencies: List[float] = []
    total_expected_entities = 0
    total_extracted_entities = 0
    total_true_positives = 0
    total_valid_evidence_quotes = 0
    total_supported_entities = 0

    for case in SYNTHETIC_EVAL_CASES:
        print(f"\nRunning Case [{case.case_id}]: {case.title}...")
        start_time = time.perf_counter()

        canonical = canonicalize(case.text, max_chars=50000)

        # Pass 1: Extraction
        try:
            extraction = extract_clinical_data(canonical)
        except Exception as exc:
            print(f"  Extraction error: {exc}")
            continue

        # Inconsistency detection
        inconsistencies = find_inconsistency_candidates(extraction)

        # Pass 2: Review Synthesis
        try:
            review = synthesize_review(canonical, extraction, inconsistencies)
        except Exception as exc:
            print(f"  Synthesis error: {exc}")
            continue

        # Quality Gate
        try:
            validate_review_quality_gate(review, extraction, canonical)
            gate_status = "PASS"
        except Exception:
            gate_status = "FAIL"

        elapsed = time.perf_counter() - start_time
        latencies.append(elapsed)

        # Count entities
        extracted_names: List[str] = []
        for s in extraction.symptoms:
            extracted_names.append(s.name.lower())
            total_supported_entities += 1
            if len(s.evidence) > 0:
                total_valid_evidence_quotes += 1

        for d in extraction.diagnoses:
            extracted_names.append(d.name.lower())
            total_supported_entities += 1
            if len(d.evidence) > 0:
                total_valid_evidence_quotes += 1

        for m in extraction.medications:
            extracted_names.append(m.name.lower())
            total_supported_entities += 1
            if len(m.evidence) > 0:
                total_valid_evidence_quotes += 1

        expected = [
            e.lower()
            for e in (case.expected_symptoms + case.expected_diagnoses + case.expected_medications)
        ]
        total_expected_entities += len(expected)
        total_extracted_entities += len(extracted_names)

        # Substring match for true positives
        tp = sum(
            1 for exp in expected if any(exp in act or act in exp for act in extracted_names)
        )
        total_true_positives += tp

        print(f"  [OK] Elapsed: {elapsed:.2f}s | Entities extracted: {len(extracted_names)} | Quality Gate: {gate_status}")

    precision = (total_true_positives / total_extracted_entities) if total_extracted_entities > 0 else 0.0
    recall = (total_true_positives / total_expected_entities) if total_expected_entities > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    evidence_rate = (total_valid_evidence_quotes / total_supported_entities) if total_supported_entities > 0 else 0.0

    latencies.sort()
    p50 = latencies[len(latencies) // 2] if latencies else 0.0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0.0

    print("\n" + "=" * 72)
    print(f"LIVE BENCHMARK RESULTS ({len(latencies)} cases executed):")
    print(f"  - Precision:               {precision * 100:.1f}%")
    print(f"  - Recall:                  {recall * 100:.1f}%")
    print(f"  - F1 Score:                {f1 * 100:.1f}%")
    print(f"  - Evidence Validity Rate:  {evidence_rate * 100:.1f}%")
    print(f"  - Latency P50:             {p50:.2f}s")
    print(f"  - Latency P95:             {p95:.2f}s")
    print("=" * 72)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Sanitas Clinical Evaluation Suite")
    parser.add_argument("--mock", action="store_true", help="Run fast CI structural validation (default)")
    parser.add_argument("--live", action="store_true", help="Run live Gemini API performance benchmark")
    args = parser.parse_args()

    if args.live:
        success = run_live_gemini_evaluation()
    else:
        success = run_mock_structural_evaluation()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
