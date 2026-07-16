# Candidate Solution

```yaml
candidate_solution:
  schema: candidate_solution.v1
  candidate_id: ""
  method_profile_id: ""
  source_packet_sha256: ""
  complete_solution: ""
  decision_or_recommendation: ""
  assumptions:
    - assumption: ""
      impact: ""
      validation_needed: ""
  claims:
    - claim_id: CL1
      claim: ""
      evidence_refs: []
      confidence: low | medium | high
  verification_plan:
    - criterion_id: C1
      test_or_check: ""
      expected_observable: ""
  risks:
    - risk: ""
      severity: critical | major | minor
      mitigation: ""
  uncertainty_and_gaps: []
  protected_boundary_check:
    status: pass | fail
    notes: []
  no_raw_cot_attestation: true
  candidate_output_sha256: ""
```

Return a complete solution. Do not return a roleplay transcript, private
scratchpad, critique-only note, or assigned subtask.
