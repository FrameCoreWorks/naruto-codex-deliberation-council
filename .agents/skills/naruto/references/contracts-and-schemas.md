# Naruto Contracts And Schemas

## Contents

1. Canonicalization
2. Source packet
3. Candidate envelope and solution
4. Commit record
5. Reveal transfer
6. Revised solution
7. Moderator report
8. Consensus report

## Canonicalization

Hash protocol artifacts as canonical JSON:

1. Encode as UTF-8.
2. Sort object keys recursively.
3. Preserve array order.
4. Normalize text line endings to LF before constructing JSON.
5. Exclude volatile timestamps, thread IDs, nicknames, and runtime status.
6. Use lowercase hexadecimal SHA-256.

The common source packet excludes candidate method profiles. Each candidate
envelope records both the common packet hash and its method profile ID.

## Source Packet

```yaml
source_evidence_packet:
  schema: source_evidence_packet.v1
  task_id:
  task:
  task_class:
  expected_output:
  source_inventory:
    - source_id:
      authority:
      location_or_citation:
      freshness:
      allowed_claims: []
  known_facts: []
  uncertainties: []
  constraints: []
  exclusions: []
  protected_boundaries: []
  acceptance_criteria:
    - criterion_id:
      requirement:
      evidence_required:
      pass_condition:
  evidence_rules:
    authority_order: []
    unsupported_claim_policy: expose
  output_schema: candidate_solution.v1
  source_packet_sha256:
```

## Candidate Envelope And Solution

The envelope may differ only in candidate identity and method profile:

```yaml
candidate_envelope:
  schema: candidate_envelope.v1
  candidate_id:
  method_profile_id:
  source_packet_sha256:
  blind_phase: true
  peer_visibility: none
```

Required candidate output:

```yaml
candidate_solution:
  schema: candidate_solution.v1
  candidate_id:
  method_profile_id:
  source_packet_sha256:
  complete_solution:
  decision_or_recommendation:
  assumptions:
    - assumption:
      impact:
      validation_needed:
  claims:
    - claim_id:
      claim:
      evidence_refs: []
      confidence: low | medium | high
  verification_plan:
    - criterion_id:
      test_or_check:
      expected_observable:
  risks:
    - risk:
      severity: critical | major | minor
      mitigation:
  uncertainty_and_gaps: []
  protected_boundary_check:
    status: pass | fail
    notes: []
  no_raw_cot_attestation: true
  candidate_output_sha256:
```

`complete_solution` must be independently usable. A candidate output containing
only critique, research notes, a subtask, questions for peers, or a partial plan
is invalid.

## Commit Record

```yaml
candidate_output_commit:
  schema: candidate_output_commit.v1
  candidate_id:
  source_packet_sha256:
  candidate_output_sha256:
  complete_solution_present: true
  schema_valid: true
  protected_boundaries_pass: true
  raw_reasoning_absent: true
  commit_status: valid | invalid | timed_out
  invalid_reason:
```

## Reveal Transfer

```yaml
reveal_transfer_packet:
  schema: reveal_transfer_packet.v1
  source_packet_sha256:
  commit_set_sha256:
  valid_candidate_ids: []
  concise_candidates:
    - candidate_id:
      solution_summary:
      claims: []
      evidence_refs: []
      risks: []
  claim_ledger:
    - claim_id:
      supporters: []
      challengers: []
      evidence_for: []
      evidence_against: []
      authority_note:
  agreements: []
  conflicts: []
  critical_minority_objections: []
  missing_evidence: []
  revision_questions: []
  raw_reasoning_included: false
```

## Revised Solution

```yaml
revised_candidate_solution:
  schema: revised_candidate_solution.v1
  candidate_id:
  original_candidate_output_sha256:
  source_packet_sha256:
  reveal_packet_sha256:
  adopted_findings:
    - finding:
      source_candidate_ids: []
      effect_on_solution:
  rejected_findings:
    - finding:
      evidence_based_reason:
  changed_claims: []
  unchanged_claims: []
  complete_revised_solution:
  remaining_disputes: []
  protected_boundary_check:
    status: pass | fail
    notes: []
  no_raw_cot_attestation: true
  revision_output_sha256:
```

## Moderator Report

```yaml
moderator_report:
  schema: moderator_report.v1
  moderator_id: kakashi_hatake
  source_packet_sha256:
  barrier_status: pass | fail
  same_thread_revision_status: pass | fail
  candidate_validity: []
  agreements: []
  resolved_conflicts: []
  unresolved_conflicts: []
  critical_minority_objections: []
  evidence_authority_findings: []
  missing_evidence: []
  permitted_result_ceiling: verified_consensus | provisional_consensus | structured_dispute | blocked
  no_winner_selected: true
```

## Consensus Report

```yaml
consensus_report:
  schema: consensus_report.v1
  task_id:
  source_packet_sha256:
  result_status: verified_consensus | provisional_consensus | structured_dispute | blocked
  valid_candidate_count:
  evidence_basis: []
  accepted_claims: []
  rejected_claims:
    - claim:
      reason:
  disputed_claims:
    - claim:
      positions: []
      exact_resolution_need:
  critical_minority_objections: []
  oskar_synthesis:
  selected_normal_route:
  protected_boundaries_preserved: true
  olga_qa:
    required: true | false
    status: pass | fail | not_run
    findings: []
  stop_decision: stop_sufficient | patch_one_gap | ask_user | blocked
  next_action:
```

Do not add fields for raw reasoning traces, private scratchpads, hidden debate,
or a numerical personality score.
