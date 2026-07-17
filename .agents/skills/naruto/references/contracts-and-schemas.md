# Naruto Contracts And Schemas

## Contents

1. Canonicalization
2. Loop control projection
3. Source packet
4. Candidate envelope and solution
5. Commit record
6. Reveal transfer
7. Revised solution
8. Protocol run manifest
9. Moderator report
10. Consensus report

## Canonicalization

Hash protocol artifacts as canonical JSON:

1. Encode as UTF-8.
2. Sort object keys recursively.
3. Preserve array order.
4. Normalize text line endings to LF before constructing JSON.
5. Exclude volatile timestamps, raw thread IDs, nicknames, and runtime status.
6. Use lowercase hexadecimal SHA-256.

The common source packet excludes candidate method profiles. Each candidate
envelope records both the common packet hash and its method profile ID.
Runtime provenance uses only SHA-256 hashes of opaque runtime handles. Never
store the raw handles in a protocol artifact.

## Loop Control Projection

Naruto reuses the canonical workspace `loop_control_fit`; it does not define a
parallel loop framework. The source packet binds the loop objective, checklist,
iteration budget, and stop condition. The consensus report records the outcome.

`max_iterations: 1` means one evaluator-optimizer repair through the existing
reveal and same-thread revision. A pre-reveal technical retry for malformed
transport is not an optimizer iteration. A second Naruto panel is never an
automatic loopback.

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
      independence_key:
      authority:
      location_or_citation:
      freshness:
      allowed_claims: []
  known_facts: []
  uncertainties: []
  constraints: []
  exclusions: []
  protected_boundaries: []
  loop_control:
    gate: loop_control_fit
    loop_id:
    objective:
    checklist_version:
    iteration_count: 0
    max_iterations: 1
    optimizer_iteration: same_thread_revision
    automatic_second_panel_run: false
    stop_condition:
  acceptance_criteria:
    - criterion_id:
      requirement:
      evidence_required:
      pass_condition:
  evidence_rules:
    authority_order: []
    evidence_classes:
      - canonical_workspace
      - deterministic_observation
      - primary_current
      - source_packet_fact
      - shared_artifact_interpretation
      - unsupported
      - contradicted
    shared_source_counts_once: true
    unsupported_claim_policy: expose
    critical_minority_policy: preserve_and_resolve
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
      evidence_class: canonical_workspace | deterministic_observation | primary_current | source_packet_fact | shared_artifact_interpretation | unsupported | contradicted
      source_independence_keys: []
      falsification_check:
      confidence: low | medium | high
  pre_reveal_self_audit:
    strongest_claim_id:
    least_defensible_claim_id:
    assumption_most_likely_to_fail:
    falsification_check:
    possible_blind_spot:
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
is invalid. The self-audit records concise conclusions and checks only. It must
not contain private reasoning or a hidden scratchpad.

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
      source_independence_keys: []
      shared_source_only: true | false
      evidence_class_ceiling: canonical_workspace | deterministic_observation | primary_current | source_packet_fact | shared_artifact_interpretation | unsupported | contradicted
      authority_note:
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
    - criterion_id:
      status: pass | fail | partial | unverifiable
      evidence_refs: []
      severity: critical | major | minor | cosmetic | unverifiable
      root_cause:
      loopback_target: same_thread_revision | oskar_synthesis | normal_route | user
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
  experience_transfer:
    same_thread_attestation: true
    original_thread_handle_sha256:
    revision_thread_handle_sha256:
    reveal_packet_sha256:
    claim_revision_map:
      - claim_id:
        prior_position:
        revised_position:
        change_kind: adopted | rejected | refined | unchanged
        basis: new_evidence | corrected_assumption | peer_claim_or_evidence | requirement_clarification | no_material_change
        peer_claim_ids: []
        evidence_delta: []
        concise_reason:
    peer_claims_adopted: []
    peer_claims_rejected: []
    unchanged_critical_claims_reviewed: []
  loop_repair:
    failed_criterion_ids_addressed: []
    evidence_delta: []
    regression_risks: []
  complete_revised_solution:
  remaining_disputes: []
  protected_boundary_check:
    status: pass | fail
    notes: []
  no_raw_cot_attestation: true
  revision_output_sha256:
```

The original and revision runtime-handle hashes must be equal. Missing,
unavailable, or unequal proofs mean the same-thread learning requirement was
not established and the run is blocked. Experience transfer records changed
claims and evidence deltas, not private reasoning.

## Protocol Run Manifest

```yaml
protocol_run_manifest:
  schema: protocol_run_manifest.v1
  run_id:
  task_id:
  source_packet_sha256:
  phase_integrity:
    source_packet_hashed: pass | fail | not_reached
    blind_commits_recorded: pass | partial | fail | not_reached
    commit_barrier_closed: pass | fail | not_reached
    reveal_byte_identical: pass | fail | not_reached
    same_thread_revisions_verified: pass | partial | fail | not_reached
    moderator_reconcile_complete: pass | fail | not_reached
    synthesis_provenance_checked: pass | fail | not_reached
    olga_qa_complete_or_not_required: pass | fail | not_reached
  candidates:
    - candidate_id:
      original_thread_handle_sha256:
      revision_thread_handle_sha256:
      same_thread_verified: true | false | unverifiable
      commit_status: valid | invalid | timed_out
      revision_status: valid | invalid | unavailable
  moderator:
    thread_handle_sha256:
    reveal_packet_sha256:
  checkpoint_hashes:
    source_packet:
    commit_barrier:
    reveal:
    revision:
    reconcile:
    synthesis:
    qa:
  retries: []
  degradation_flags: []
  result_ceiling_reason:
  protected_boundaries_preserved: true
  manifest_sha256:
```

This sidecar is excluded from `source_packet_sha256` so runtime state cannot
change the common task. It proves phase order and identity without exposing raw
thread identifiers, timestamps, secrets, or provider data. Every checkpoint
hashes the canonical manifest snapshot after its named phase. The final
`manifest_sha256` is calculated only after required QA.

## Moderator Report

```yaml
moderator_report:
  schema: moderator_report.v1
  moderator_id: kakashi_hatake
  source_packet_sha256:
  protocol_run_manifest_reconcile_checkpoint_sha256:
  barrier_status: pass | fail
  reveal_byte_identity_status: pass | fail
  same_thread_revision_status: pass | fail
  experience_transfer_status: pass | partial | fail
  candidate_validity: []
  agreements: []
  resolved_conflicts: []
  unresolved_conflicts: []
  critical_minority_objections: []
  evidence_authority_findings: []
  evidence_independence_findings: []
  anti_groupthink_findings: []
  missing_evidence: []
  acceptance_matrix_results:
    - criterion_id:
      status: pass | fail | partial | unverifiable
      evidence_refs: []
      severity: critical | major | minor | cosmetic | unverifiable
      root_cause:
  regression_check:
    previous_passes_preserved: true | false | unverifiable
    new_regressions: []
  material_improvement: true | false | unverifiable
  permitted_result_ceiling: verified_consensus | provisional_consensus | structured_dispute | blocked
  result_ceiling_reason:
  no_winner_selected: true
```

## Consensus Report

```yaml
consensus_report:
  schema: consensus_report.v1
  task_id:
  source_packet_sha256:
  protocol_run_manifest_sha256:
  moderator_report_sha256:
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
  synthesis_provenance:
    source_revision_hashes: []
    accepted_claim_trace:
      - final_claim_id:
        source_claim_ids: []
        evidence_refs: []
        oskar_introduced: false
    rejected_claim_trace: []
    oskar_introduced_claims:
      - claim_id:
        claim:
        impact: critical | major | minor
        evidence_refs: []
        verification_status: verified | demoted | rejected | unverifiable
    coverage_check:
      critical_objections_accounted_for: true | false
      unexamined_risk_categories: []
      exact_resolution_need_for_open_items: []
  selected_normal_route:
  protected_boundaries_preserved: true
  olga_qa:
    required: true | false
    status: pass | fail | not_run
    review_packet_scope: final_artifact_criteria_evidence_only
    candidate_role_identities_excluded: true
    findings:
      - criterion_id:
        observed:
        expected:
        evidence_refs: []
        reproducible_next_check:
  loop_summary:
    loop_id:
    checklist_version:
    iteration_count: 0 | 1
    max_iterations: 1
    repair_history:
      - criterion_id:
        intervention:
        verification_result: pass | fail | partial | unverifiable
    failed_criteria_remaining: []
    regression_check:
      previous_passes_preserved: true | false | unverifiable
      new_regressions: []
    material_improvement: true | false | unverifiable
    hard_stop_reason:
  stop_decision: stop_sufficient | patch_one_gap | ask_user | blocked
  next_action:
```

Do not add fields for raw reasoning traces, private scratchpads, hidden debate,
or a numerical personality score.

Critical or major claims introduced by Oskar must be independently verified,
demoted, or rejected. An unsupported Oskar-introduced claim cannot support
`verified_consensus`. Olga receives the final artifact, acceptance criteria,
and evidence only; candidate identities, role prestige, completion order, and
vote counts are excluded from the QA packet.
