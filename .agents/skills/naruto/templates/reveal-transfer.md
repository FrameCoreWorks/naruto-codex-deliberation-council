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
not independent corroboration. Do not reward performative dissent.
