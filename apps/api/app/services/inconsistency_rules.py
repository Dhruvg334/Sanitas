"""Deterministic inconsistency candidate detection (Stage P5).

Identifies document-level factual contradictions without medical inference.
Rules create candidates with evidence references; they do not silently resolve them.
"""

from collections import defaultdict
from app.schemas.extraction import (
    ClinicalExtraction,
    EvidenceRef,
    PotentialInconsistency,
)


def find_inconsistency_candidates(extraction: ClinicalExtraction) -> list[PotentialInconsistency]:
    candidates: list[PotentialInconsistency] = []
    idx = 1

    # Rule 1: Allergy contradiction - "no_known_allergies" vs specific documented allergy
    nkda_allergies = [a for a in extraction.allergies if a.allergy_status == "no_known_allergies"]
    present_allergies = [a for a in extraction.allergies if a.allergy_status == "present"]

    if nkda_allergies and present_allergies:
        for nkda in nkda_allergies:
            for present in present_allergies:
                evidence_refs: list[EvidenceRef] = []
                evidence_refs.extend(nkda.evidence)
                evidence_refs.extend(present.evidence)
                # Deduplicate evidence references
                unique_refs: list[EvidenceRef] = []
                seen_quotes = set()
                for ref in evidence_refs:
                    key = (ref.segment_id, ref.page_number, ref.quote)
                    if key not in seen_quotes:
                        seen_quotes.add(key)
                        unique_refs.append(ref)

                if len(unique_refs) >= 2:
                    candidates.append(
                        PotentialInconsistency(
                            finding_id=f"incon-{idx}",
                            description=(
                                f"Document explicitly notes no known allergies ({nkda.substance}) "
                                f"while also documenting a specific allergy to {present.substance}."
                            ),
                            importance="high",
                            related_entity_ids=[nkda.entity_id, present.entity_id],
                            evidence=unique_refs[:4],
                        )
                    )
                    idx += 1

    # Rule 2: Medication conflict - same medication listed as active and discontinued
    meds_by_name: dict[str, list] = defaultdict(list)
    for med in extraction.medications:
        normalized_name = med.name.strip().lower()
        meds_by_name[normalized_name].append(med)

    for med_name, meds in meds_by_name.items():
        active_meds = [m for m in meds if m.medication_status == "active"]
        discontinued_meds = [m for m in meds if m.medication_status == "discontinued"]

        if active_meds and discontinued_meds:
            for act in active_meds:
                for disc in discontinued_meds:
                    evidence_refs: list[EvidenceRef] = []
                    evidence_refs.extend(act.evidence)
                    evidence_refs.extend(disc.evidence)
                    unique_refs: list[EvidenceRef] = []
                    seen_quotes = set()
                    for ref in evidence_refs:
                        key = (ref.segment_id, ref.page_number, ref.quote)
                        if key not in seen_quotes:
                            seen_quotes.add(key)
                            unique_refs.append(ref)

                    if len(unique_refs) >= 2:
                        candidates.append(
                            PotentialInconsistency(
                                finding_id=f"incon-{idx}",
                                description=(
                                    f"Medication '{act.name}' is simultaneously documented as active "
                                    f"and discontinued without clear temporal resolution."
                                ),
                                importance="moderate",
                                related_entity_ids=[act.entity_id, disc.entity_id],
                                evidence=unique_refs[:4],
                            )
                        )
                        idx += 1

    # Rule 3: Vital signs timestamp conflict - same vital type at same timestamp with different values
    vitals_by_time_and_type: dict[tuple[str, str], list] = defaultdict(list)
    for vital in extraction.vitals:
        if vital.observed_at:
            key = (vital.vital_type.strip().lower(), vital.observed_at.strip().lower())
            vitals_by_time_and_type[key].append(vital)

    for (vtype, obs_time), vitals in vitals_by_time_and_type.items():
        if len(vitals) >= 2:
            values = {v.value.strip() for v in vitals}
            if len(values) > 1:
                unique_refs = []
                for v in vitals:
                    unique_refs.extend(v.evidence)
                if len(unique_refs) >= 2:
                    candidates.append(
                        PotentialInconsistency(
                            finding_id=f"incon-{idx}",
                            description=(
                                f"Conflicting {vtype.upper()} measurements ({', '.join(values)}) "
                                f"recorded at the same timestamp ({obs_time})."
                            ),
                            importance="moderate",
                            related_entity_ids=[v.entity_id for v in vitals],
                            evidence=unique_refs[:4],
                        )
                    )
                    idx += 1

    return candidates
