"""Synthetic Evaluation Runner for Sanitas.

Provides two distinct modes:
1. --mock (CI Structural Validation):
   Runs pipeline validation against 28 synthetic test cases across all 4 modalities
   (Plain text, Digital PDF, Image, Scanned PDF) using mocked outputs to verify
   canonicalization, schema conformance, inconsistency rules, and quality gates.
   Does not invoke external APIs or require credentials.

2. --live (Gemini Model Performance Benchmark):
   Runs live model calls using gemini-3.8-flash on synthetic test cases across all modalities.
   Calculates real Precision, Recall, F1, Evidence Validity Rate, and Latency percentiles by modality.
   States the exact number of cases evaluated.
"""

import argparse
import asyncio
import os
import sys
import time
from collections import defaultdict
from typing import Dict, List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.core.config import get_settings
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
from app.services.canonicalize import canonicalize, canonicalize_digital_pdf
from app.services.evidence import validate_evidence
from app.services.gemini import GeminiAIService
from app.services.inconsistency_rules import find_inconsistency_candidates
from app.services.quality_gate import validate_review_quality_gate
from eval.cases import SYNTHETIC_EVAL_CASES, SyntheticCase


def run_mock_structural_evaluation() -> bool:
    """Runs fast structural integrity tests for CI without requiring API keys."""
    print("=" * 76)
    print("SANITAS SYNTHETIC PIPELINE - CI STRUCTURAL VALIDATION (28 CASES)")
    print("MODE: Offline / Mocked Pipeline Integrity (Fast CI)")
    print("NOTE: Mock outputs test schema, routing, and quality gates only.")
    print("      These are NOT model performance metrics.")
    print("=" * 76)

    passed_count = 0
    total_cases = len(SYNTHETIC_EVAL_CASES)
    modality_counts: Dict[str, int] = defaultdict(int)

    for case in SYNTHETIC_EVAL_CASES:
        print(f"\nEvaluating [{case.case_id}] {case.title} (Modality: {case.modality}, Category: {case.category})...")

        # Stage P1 & P2: Ingest, Route, and Canonicalize according to modality
        raw_bytes = case.get_bytes()
        if case.modality == "plain_text":
            canonical = canonicalize(case.text, max_chars=50000)
        elif case.modality == "digital_pdf":
            canonical = canonicalize_digital_pdf(raw_bytes)
        else:
            # For image and scanned_pdf in offline mock mode:
            # Simulated visual transcription yields canonical segments matching text
            canonical = canonicalize(case.text, max_chars=50000)

        assert len(canonical.segments) > 0, f"Canonical segments must not be empty for {case.case_id}"

        # Anchored evidence references
        first_seg = canonical.segments[0]
        ref1 = EvidenceRef(
            segment_id=first_seg.segment_id,
            page_number=first_seg.page_number,
            quote=first_seg.text[:min(15, len(first_seg.text))],
        )

        last_seg = canonical.segments[-1]
        ref2 = EvidenceRef(
            segment_id=last_seg.segment_id,
            page_number=last_seg.page_number,
            quote=last_seg.text[:min(15, len(last_seg.text))],
        )

        # Stage P3: Mock extraction conforming strictly to schema
        mock_extraction = ClinicalExtraction(
            patient_information=PatientInformation(
                name=SupportedValue(
                    value=case.case_id,
                    support_status="supported",
                    certainty="high",
                    evidence=[ref1],
                )
            ),
            symptoms=[
                Symptom(
                    entity_id=f"sym-{i}",
                    name=s,
                    support_status="supported",
                    certainty="high",
                    evidence=[ref1],
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
                    evidence=[ref1],
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
                    evidence=[ref1],
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
                    evidence=[ref1],
                )
                for i, a in enumerate(case.expected_allergies, start=1)
            ],
        )

        # Stage P5: Inconsistency detection injection if inconsistency case
        if case.category == "inconsistency":
            if case.case_id in ("case-002", "case-010", "case-017"):
                # Inject contradiction with ref2 so it has 2 distinct evidence refs
                mock_extraction.allergies.append(
                    Allergy(
                        entity_id="alg-99",
                        substance="NKDA",
                        allergy_status="no_known_allergies",
                        support_status="supported",
                        certainty="high",
                        evidence=[ref2],
                    )
                )
            elif case.case_id in ("case-003", "case-024"):
                # Inject medication conflict with ref2
                target_med = case.expected_medications[0] if case.expected_medications else "TargetMed"
                mock_extraction.medications.append(
                    Medication(
                        entity_id="med-99",
                        name=target_med,
                        medication_status="discontinued",
                        support_status="supported",
                        certainty="high",
                        evidence=[ref2],
                    )
                )

        # Stage P4: Deterministic Evidence Validation
        validate_evidence(mock_extraction, canonical)

        # Stage P5: Inconsistency candidate detection
        inconsistencies = find_inconsistency_candidates(mock_extraction)
        if case.category == "inconsistency":
            assert len(inconsistencies) > 0, f"Expected inconsistency for {case.case_id}"
            print("  [OK] Correctly detected inconsistency rule candidate")

        # Stage P6 & P7: Quality Gate Validation
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
        modality_counts[case.modality] += 1

    print("\n" + "=" * 76)
    print(f"VALIDATION SUMMARY: {passed_count}/{total_cases} test cases passed structural validation.")
    print("MODALITY BREAKDOWN:")
    for mod, count in modality_counts.items():
        print(f"  - {mod:15s}: {count}/7 cases passed")
    print("Status: 100% SUCCESS (CI PASS)")
    print("=" * 76)
    return True


async def run_live_gemini_evaluation_async() -> bool:
    """Runs live model evaluation against Gemini API, reporting real metrics."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("=" * 76, file=sys.stderr)
        print("ERROR: GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        print("Set GEMINI_API_KEY to run live model evaluation against Gemini.", file=sys.stderr)
        print("Example: $env:GEMINI_API_KEY = '<your_key>'", file=sys.stderr)
        print("=" * 76, file=sys.stderr)
        return False

    settings = get_settings()
    settings.gemini_api_key = api_key
    ai_service = GeminiAIService(settings=settings)

    print("=" * 76)
    print("SANITAS LIVE MODEL EVALUATION BENCHMARK")
    print(f"MODEL: {settings.gemini_model} | PROMPTS: E1.1 + R1.0 + T1.0")
    print(f"TOTAL BENCHMARK CASES: {len(SYNTHETIC_EVAL_CASES)} synthetic cases")
    print("=" * 76)

    latencies_by_modality: Dict[str, List[float]] = defaultdict(list)
    all_latencies: List[float] = []
    total_expected_entities = 0
    total_extracted_entities = 0
    total_true_positives = 0
    total_valid_evidence_quotes = 0
    total_supported_entities = 0
    quality_gate_passes = 0

    for case in SYNTHETIC_EVAL_CASES:
        print(f"\nRunning Live Case [{case.case_id}] {case.title} (Modality: {case.modality})...")
        t_start = time.perf_counter()

        raw_bytes = case.get_bytes()
        try:
            # Canonicalization / Visual Transcription
            if case.modality == "plain_text":
                canonical = canonicalize(case.text, max_chars=settings.max_text_chars)
            elif case.modality == "digital_pdf":
                canonical = canonicalize_digital_pdf(raw_bytes)
            else:
                canonical = await ai_service.transcribe_visual(raw_bytes, case.mime_type)

            # Pass 1: Extraction
            extraction = await ai_service.extract(canonical)

            # Stage P4: Deterministic Validation
            validate_evidence(extraction, canonical)

            # Stage P5: Inconsistencies
            candidates = find_inconsistency_candidates(extraction)

            # Pass 2: Review Synthesis
            review = await ai_service.synthesize_review(
                extraction, candidates, canonical.document_quality
            )

            # Stage P7: Quality Gate
            validate_review_quality_gate(review, extraction, canonical)
            quality_gate_passes += 1
            gate_status = "PASS"
        except Exception as exc:
            print(f"  [FAIL] Error during pipeline execution: {exc}")
            continue

        elapsed = time.perf_counter() - t_start
        latencies_by_modality[case.modality].append(elapsed)
        all_latencies.append(elapsed)

        # Measure extraction entity counts
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

        print(
            f"  [OK] Elapsed: {elapsed:.2f}s | Extracted: {len(extracted_names)} entities "
            f"| Quality Gate: {gate_status}"
        )

    # Compute Aggregate Metrics
    precision = (total_true_positives / total_extracted_entities) if total_extracted_entities > 0 else 0.0
    recall = (total_true_positives / total_expected_entities) if total_expected_entities > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    evidence_rate = (total_valid_evidence_quotes / total_supported_entities) if total_supported_entities > 0 else 0.0
    gate_rate = (quality_gate_passes / len(SYNTHETIC_EVAL_CASES)) if SYNTHETIC_EVAL_CASES else 0.0

    all_latencies.sort()
    p50_overall = all_latencies[len(all_latencies) // 2] if all_latencies else 0.0
    p95_overall = all_latencies[int(len(all_latencies) * 0.95)] if all_latencies else 0.0

    print("\n" + "=" * 76)
    print(f"LIVE BENCHMARK RESULTS ({len(all_latencies)}/{len(SYNTHETIC_EVAL_CASES)} cases completed):")
    print(f"  - Precision:                   {precision * 100:.1f}%")
    print(f"  - Recall:                      {recall * 100:.1f}%")
    print(f"  - F1 Score:                    {f1 * 100:.1f}%")
    print(f"  - Evidence Grounding Rate:     {evidence_rate * 100:.1f}%")
    print(f"  - Quality Gate Pass Rate:      {gate_rate * 100:.1f}%")
    print(f"  - Latency P50 (Overall):       {p50_overall:.2f}s")
    print(f"  - Latency P95 (Overall):       {p95_overall:.2f}s")
    print("LATENCY BY ROUTE:")
    for mod, lats in latencies_by_modality.items():
        lats.sort()
        p50 = lats[len(lats) // 2] if lats else 0.0
        p95 = lats[int(len(lats) * 0.95)] if lats else 0.0
        print(f"  - {mod:15s}: P50={p50:.2f}s, P95={p95:.2f}s (n={len(lats)})")
    print("=" * 76)
    return len(all_latencies) > 0


def run_live_gemini_evaluation() -> bool:
    return asyncio.run(run_live_gemini_evaluation_async())


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
