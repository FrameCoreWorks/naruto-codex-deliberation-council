# Consensus Report

```yaml
consensus_report:
  schema: consensus_report.v1
  task_id: ""
  source_packet_sha256: ""
  protocol_run_manifest_sha256: ""
  moderator_report_sha256: ""
  result_status: verified_consensus | provisional_consensus | structured_dispute | blocked
  valid_candidate_count: 0
  evidence_basis: []
  agreements: []
  accepted_claims: []
  rejected_claims:
    - claim: ""
      reason: ""
  disputed_claims:
    - claim: ""
      positions: []
      exact_resolution_need: ""
  critical_minority_objections: []
  oskar_synthesis: ""
  synthesis_provenance:
    source_revision_hashes: []
    accepted_claim_trace:
      - final_claim_id: ""
        source_claim_ids: []
        evidence_refs: []
        oskar_introduced: false
    rejected_claim_trace: []
    oskar_introduced_claims:
      - claim_id: ""
        claim: ""
        impact: critical | major | minor
        evidence_refs: []
        verification_status: verified | demoted | rejected | unverifiable
    coverage_check:
      critical_objections_accounted_for: true | false
      unexamined_risk_categories: []
      exact_resolution_need_for_open_items: []
  selected_normal_route: ""
  protected_boundaries_preserved: true
  olga_qa:
    required: true
    status: pass | fail | not_run
    review_packet_scope: final_artifact_criteria_evidence_only
    candidate_role_identities_excluded: true
    findings:
      - criterion_id: ""
        observed: ""
        expected: ""
        evidence_refs: []
        reproducible_next_check: ""
  loop_summary:
    loop_id: ""
    checklist_version: ""
    iteration_count: 0
    max_iterations: 1
    repair_history:
      - criterion_id: ""
        intervention: ""
        verification_result: pass | fail | partial | unverifiable
    failed_criteria_remaining: []
    regression_check:
      previous_passes_preserved: true | false | unverifiable
      new_regressions: []
    material_improvement: true | false | unverifiable
    hard_stop_reason: ""
  stop_decision: stop_sufficient | patch_one_gap | ask_user | blocked
  next_action: ""
```

User-facing delivery should summarize the decision, decisive evidence,
remaining uncertainty, Loop Protocol stop decision, and next normal route
without exposing raw transcripts.
