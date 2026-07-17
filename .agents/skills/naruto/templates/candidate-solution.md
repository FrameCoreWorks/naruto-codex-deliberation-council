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
      evidence_class: canonical_workspace | deterministic_observation | primary_current | source_packet_fact | shared_artifact_interpretation | unsupported | contradicted
      source_independence_keys: []
      falsification_check: ""
      confidence: low | medium | high
  pre_reveal_self_audit:
    strongest_claim_id: ""
    least_defensible_claim_id: ""
    assumption_most_likely_to_fail: ""
    falsification_check: ""
    possible_blind_spot: ""
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
scratchpad, critique-only note, or assigned subtask. The self-audit is a concise
claim-and-evidence check, never a chain-of-thought transcript.
