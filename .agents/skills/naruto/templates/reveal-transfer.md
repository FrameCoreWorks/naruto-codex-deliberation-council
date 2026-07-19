# Reveal Transfer Packet

```yaml
reveal_transfer_packet:
  schema: reveal_transfer_packet.v1
  source_packet_sha256: ""
  method_matrix_sha256: ""
  training_guidance_packet_sha256: ""
  safety_control_packet_sha256: ""
  commit_set_sha256: ""
  valid_candidate_ids: []
  concise_candidates:
    - candidate_id: ""
      solution_summary: ""
      claims: []
      evidence_refs: []
      risks: []
  claim_ledger:
    - claim_id: ""
      supporters: []
      challengers: []
      evidence_for: []
      evidence_against: []
      source_independence_keys: []
      shared_source_only: true | false
      evidence_class_ceiling: canonical_workspace | deterministic_observation | primary_current | source_packet_fact | shared_artifact_interpretation | unsupported | contradicted
      authority_note: ""
  agreements: []
  conflicts: []
  critical_minority_objections: []
  collective_blind_spots: []
  anti_groupthink_checks:
    unsupported_majority_claims: []
    shared_source_consensus_claims: []
    position_changes_without_new_evidence: []
    quick_surrender_flags: []
    fake_dissent_flags: []
    authority_submission_flags: []
    factually_incorrect_opposition_flags: []
    critical_minority_resolution_questions: []
    result_ceiling_effect: none | provisional_only | structured_dispute | blocked
  blind_semantic_redundancy_audit:
    status: sufficient | insufficient | unverifiable
    comparison_basis: claim_meaning_and_evidence_lineage
    known_claim_refs: []
    known_evidence_refs: []
    known_evidence_lineage_refs: []
    pair_assessments:
      - candidate_ids: []
        relation: materially_distinct | partially_overlapping | substantially_redundant | unverifiable
        overlapping_claim_refs: []
        unique_claim_refs: []
        evidence_lineage_delta: []
    unique_verified_contributions:
      - candidate_id: ""
        claim_refs: []
        evidence_refs: []
    all_core_claims_materially_equivalent: true | false | unverifiable
    all_evidence_lineages_equivalent: true | false | unverifiable
    result_ceiling_effect: none | provisional_only
    exact_resolution_need: ""
  missing_evidence: []
  acceptance_findings:
    - criterion_id: ""
      status: pass | fail | partial | unverifiable
      evidence_refs: []
      severity: critical | major | minor | cosmetic | unverifiable
      root_cause: ""
      loopback_target: same_thread_revision | hokage_synthesis | normal_route | user
  revision_questions: []
  raw_reasoning_included: false
```

Send byte-identical content to every valid training instance. Do not rank methods
or identify a preferred answer. Every non-pass criterion needs evidence or an
unverifiable reason, severity, root cause, and a bounded loopback target.
Agreement supported only by one shared source counts as one evidence lineage,
not independent corroboration. The semantic comparison is a bounded claim-level
moderator judgment, not a deterministic metric or benchmark. Do not infer
diversity from method IDs, invent similarity percentages, or reward performative
dissent. Record every unique unordered pair of valid candidates exactly once
and use only claim and evidence references present in the packet. With four
valid candidates this means six pair assessments; with three it means three.
`insufficient` and
`unverifiable` cap the run at
`provisional_consensus`.
Claim references, evidence references, and evidence-lineage references are
separate namespaces. Overlap and unique-claim lists must be disjoint. A
`substantially_redundant` pair has no unique claim or lineage delta;
`materially_distinct` has no overlapping claim and at least one unique claim;
`partially_overlapping` has an overlapping claim and at least one unique-claim
or lineage delta. `sufficient` requires verified differences in both dimensions
plus a candidate-specific unique verified contribution. Every contribution
must cite that candidate's unique claim and a known evidence reference.
