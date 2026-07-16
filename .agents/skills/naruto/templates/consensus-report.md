# Consensus Report

```yaml
consensus_report:
  schema: consensus_report.v1
  task_id: ""
  source_packet_sha256: ""
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
  selected_normal_route: ""
  protected_boundaries_preserved: true
  olga_qa:
    required: true
    status: pass | fail | not_run
    findings: []
  stop_decision: stop_sufficient | patch_one_gap | ask_user | blocked
  next_action: ""
```

User-facing delivery should summarize the decision, decisive evidence,
remaining uncertainty, and next normal route without exposing raw transcripts.
