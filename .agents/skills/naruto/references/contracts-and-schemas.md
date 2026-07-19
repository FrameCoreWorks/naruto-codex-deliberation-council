# Naruto Contracts And Schemas

## Contents

1. Canonicalization
2. Loop control projection
3. Source packet
4. Method matrix
5. Training guidance
6. Safety control
7. Training-instance envelope and candidate solution
8. Commit record
9. Reveal transfer
10. Revised solution
11. Protocol run manifest
12. Moderator report
13. Consensus report
14. Safety report

## Canonicalization

Hash protocol artifacts as canonical JSON:

1. Encode as UTF-8.
2. Sort object keys recursively.
3. Preserve array order.
4. Normalize text line endings to LF before constructing JSON.
5. Exclude volatile timestamps, raw thread IDs, nicknames, and runtime status.
6. Use lowercase hexadecimal SHA-256.

### Artifact Digest Projection

Hash the inner artifact object identified by its `schema`, not the Markdown or
YAML wrapper. For an artifact that stores its own digest, deep-copy the object,
delete exactly the self-digest field listed below, canonicalize the remaining
object, and hash those bytes. Deleting the field is required; replacing it with
an empty string is a different projection.

| Schema | Self-digest field omitted from its own projection |
|---|---|
| `source_evidence_packet.v1` | `source_packet_sha256` |
| `method_matrix.v1` | `method_matrix_sha256` |
| `naruto_training_instance_envelope.v1` | `envelope_sha256` |
| `training_guidance_packet.v1` | `training_guidance_packet_sha256` |
| `safety_control_packet.v1` | `safety_control_packet_sha256` |
| `candidate_solution.v1` | `candidate_output_sha256` |
| `revised_candidate_solution.v1` | `revision_output_sha256` |
| `protocol_checkpoint.v1` | `checkpoint_sha256` |
| `protocol_run_manifest.v1` | `manifest_sha256` |
| `safety_report.v1` | `safety_report_sha256` |

Every other SHA-256 field is a dependency reference and remains in the
projection. Schemas without a self-digest field, including commit, reveal,
moderator, and consensus artifacts, hash all their fields. Verification repeats
the same projection and compares the result with the stored self digest.

### Manifest Checkpoints And Acyclic Order

Checkpoint order is fixed:

```text
source_packet -> training_control -> commit_barrier -> reveal -> revision
              -> reconcile -> safety_report -> synthesis -> qa
```

After every phase, create and preserve `protocol_checkpoint.v1` from
`templates/protocol-checkpoint.md`. Its `manifest_snapshot` is a deep copy of
the inner manifest at that moment with the entire `checkpoint_hashes` object and
`manifest_sha256` removed. The checkpoint records its phase, sequence, and the
digest of the immediately preceding checkpoint; sequence 1 uses `null`. Compute
the checkpoint digest with only `checkpoint_sha256` omitted, then store it both
in the preserved checkpoint artifact and the matching manifest
`checkpoint_hashes` entry. Verification uses the preserved artifact, never a
reconstruction from later mutable manifest state.

Build final artifacts in this order:

1. Hash the source packet, method matrix, common guidance, four routing
   envelopes, and preflight safety control in that order using their schema
   projections.
2. Commit candidate solutions from the four training instances, reveal once,
   revise in the same threads, and finalize
   Kakashi's moderator report digest.
3. Add that digest to the manifest, then create and preserve the `reconcile`
   checkpoint.
4. Build `safety_report.v1`, bind it to the preserved reconcile checkpoint,
   omit its own digest field, and compute `safety_report_sha256`.
5. Add that digest to the manifest, mark the safety report complete, then create
   and preserve the `safety_report` checkpoint.
6. Record Hokage synthesis and create the `synthesis` checkpoint.
7. After the independent final QA reviewer returns, finalize every semantic and QA field in the consensus
   draft while leaving `protocol_run_manifest_sha256` empty. Freeze that draft,
   record QA in the manifest, and create the `qa` checkpoint.
8. Compute final `manifest_sha256` with only its own field omitted.
9. Fill only `protocol_run_manifest_sha256` in the frozen consensus draft. The
   moderator and safety report digests are already fixed. The manifest and
   safety report never reference the consensus report, so the dependency graph
   remains acyclic.

The common source packet excludes private method instructions. A separate,
byte-identical `method_matrix.v1` exposes all four fixed assignments to every
participant. Each routing envelope binds one training instance to exactly one
matrix assignment and the common packet hashes.
Runtime provenance comes from the parent-owned spawn-target mapping and the
host follow-up tool's successful delivery receipt for that exact target. A
child-authored acknowledgement is not provenance. Never ask a child to invent,
echo, or hash an opaque runtime handle.

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
  supervision_contract:
    common_training_guidance_required: true
    guidance_byte_identical_required: true
    common_method_matrix_required: true
    method_matrix_byte_identical_required: true
    guidance_must_be_non_solution: true
    yamato_safety_control_required: true
    yamato_full_source_packet_required: true
    instance_specific_coaching_forbidden: true
    blind_phase_content_feedback_forbidden: true
    preflight_hold_repairs_allowed: 1
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

## Method Matrix

```yaml
method_matrix:
  schema: method_matrix.v1
  actor_identity_id: naruto_uzumaki
  instance_kind: shadow_clone
  task_scope: complete
  assignments:
    - instance_id: naruto_clone_integrator
      method_profile_id: naruto_integrative_method.v1
      method_label: integrative_practical
    - instance_id: naruto_clone_challenger
      method_profile_id: naruto_adversarial_method.v1
      method_label: adversarial_risk_first
    - instance_id: naruto_clone_strategist
      method_profile_id: naruto_systems_method.v1
      method_label: systems_strategy
    - instance_id: naruto_clone_verifier
      method_profile_id: naruto_empirical_method.v1
      method_label: empirical_verification
  method_assignment_fixed_before_fanout: true
  unique_instance_ids_verified: true
  unique_method_profile_ids_verified: true
  subtask_partition_forbidden: true
  method_matrix_sha256:
```

Build the matrix from the canonical agent manifest before fan-out. Its bytes
are identical for Hokage, Kakashi, Yamato, and all four training instances.
Each instance sees all assignments, while its routing envelope selects exactly
one fixed method. The matrix defines method diversity, not private coaching.

## Training Guidance

```yaml
training_guidance_packet:
  schema: training_guidance_packet.v1
  source_packet_sha256:
  objective_frame:
  full_solution_requirement:
  acceptance_focus:
    - criterion_id:
      observable:
  evidence_discipline: []
  falsification_targets: []
  protected_boundary_reminders: []
  stop_conditions: []
  instance_specific_content: false
  solution_recommendation_included: false
  preferred_route_included: false
  private_evidence_included: false
  raw_reasoning_included: false
  training_guidance_packet_sha256:
```

The packet is derived only from the final source packet. Its canonical bytes
must be identical for Yamato and all four training instances. The method matrix
is a separate common artifact and cannot be altered by guidance.

## Safety Control

```yaml
safety_control_packet:
  schema: safety_control_packet.v1
  source_packet_sha256:
  method_matrix_sha256:
  training_guidance_packet_sha256:
  supervisor_id: yamato
  status: pass | hold | blocked
  checks:
    source_packet_present_and_hash_valid: pass | fail | unverifiable
    method_matrix_present_and_hash_valid: pass | fail | unverifiable
    shared_actor_identity_valid: pass | fail | unverifiable
    unique_instance_ids_valid: pass | fail | unverifiable
    unique_fixed_method_ids_valid: pass | fail | unverifiable
    envelope_difference_allowlist_valid: pass | fail | unverifiable
    guidance_common_and_byte_identical: pass | fail | unverifiable
    guidance_non_solution: pass | fail | unverifiable
    no_instance_specific_content: pass | fail | unverifiable
    no_private_evidence: pass | fail | unverifiable
    protected_boundaries_complete: pass | fail | unverifiable
    read_only_profiles_required: pass | fail | unverifiable
    no_blind_phase_content_feedback: pass | fail | unverifiable
  findings:
    - check:
      observed:
      expected:
      result_ceiling_effect: none | hold | blocked
  hold_count: 0 | 1
  instance_specific_coaching_forbidden: true
  content_feedback_during_blind_phase_forbidden: true
  raw_reasoning_included: false
  safety_control_packet_sha256:
```

Only `pass` permits training-instance fan-out. A `hold` allows one bounded
repair to the common packet, method matrix, envelopes, or common guidance; it
never permits tailored instance contact.

## Training-Instance Envelope And Candidate Solution

All four envelopes share one actor identity and common hashes. They may differ
only in `instance_id`, `assigned_method_profile_id`, and the resulting digest:

```yaml
training_instance_envelope:
  schema: naruto_training_instance_envelope.v1
  actor_identity_id: naruto_uzumaki
  instance_id:
  assigned_method_profile_id:
  task_scope: complete
  source_packet_sha256:
  method_matrix_sha256:
  training_guidance_packet_sha256:
  envelope_sha256:
```

Required candidate output:

```yaml
candidate_solution:
  schema: candidate_solution.v1
  actor_identity_id: naruto_uzumaki
  candidate_id:
  method_profile_id:
  source_packet_sha256:
  method_matrix_sha256:
  training_instance_envelope_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
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
  no_blind_phase_supervisor_contact_attestation: true
  no_raw_cot_attestation: true
  candidate_output_sha256:
```

`candidate_id` identifies a candidate solution slot and must equal the dedicated
training-instance runtime ID; it does not represent a different character.
`complete_solution` must be independently usable. An output containing only
critique, research notes, a subtask, questions for peers, or a partial plan is
invalid. The self-audit records concise conclusions and checks only. It must not
contain private reasoning or a hidden scratchpad.

## Commit Record

```yaml
candidate_output_commit:
  schema: candidate_output_commit.v1
  actor_identity_id: naruto_uzumaki
  candidate_id:
  method_profile_id:
  source_packet_sha256:
  method_matrix_sha256:
  training_instance_envelope_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
  candidate_output_sha256:
  complete_solution_present: true
  schema_valid: true
  protected_boundaries_pass: true
  no_blind_phase_supervisor_contact: true
  raw_reasoning_absent: true
  commit_status: valid | invalid | timed_out
  invalid_reason:
```

## Reveal Transfer

```yaml
reveal_transfer_packet:
  schema: reveal_transfer_packet.v1
  source_packet_sha256:
  method_matrix_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
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
      loopback_target: same_thread_revision | hokage_synthesis | normal_route | user
  revision_questions: []
  raw_reasoning_included: false
```

## Revised Solution

```yaml
revised_candidate_solution:
  schema: revised_candidate_solution.v1
  actor_identity_id: naruto_uzumaki
  candidate_id:
  method_profile_id:
  original_candidate_output_sha256:
  source_packet_sha256:
  method_matrix_sha256:
  training_instance_envelope_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
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
    same_thread_revision_attestation: true
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

The actor identity, instance ID, method profile, matrix digest, and envelope
digest must remain unchanged. Hokage separately retains the spawn-target
mapping and a successful host-tool receipt for delivery of the reveal follow-up
to that same target. Missing, unsuccessful, child-authored, or mismatched-target
receipts mean the same-thread learning requirement was not established and the
run is blocked. Experience transfer records changed claims and evidence deltas,
not private reasoning.

## Protocol Run Manifest

```yaml
protocol_run_manifest:
  schema: protocol_run_manifest.v1
  run_id:
  task_id:
  actor_identity_id: naruto_uzumaki
  source_packet_sha256:
  method_matrix_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
  phase_integrity:
    source_packet_hashed: pass | fail | not_reached
    shared_actor_identity_verified: pass | fail | not_reached
    method_matrix_hashed: pass | fail | not_reached
    unique_instance_and_method_ids_verified: pass | fail | not_reached
    method_assignments_frozen: pass | fail | not_reached
    common_guidance_hashed: pass | fail | not_reached
    yamato_preflight_passed: pass | fail | not_reached
    guidance_byte_identity_verified: pass | fail | not_reached
    blind_supervisor_contact_absent: pass | fail | not_reached
    blind_commits_recorded: pass | partial | fail | not_reached
    commit_barrier_closed: pass | fail | not_reached
    reveal_byte_identical: pass | fail | not_reached
    same_target_followup_receipts_verified: pass | partial | fail | not_reached
    moderator_reconcile_complete: pass | fail | not_reached
    safety_report_complete: pass | fail | not_reached
    synthesis_provenance_checked: pass | fail | not_reached
    final_qa_complete_or_not_required: pass | fail | not_reached
  candidates:
    - candidate_id:
      actor_identity_id: naruto_uzumaki
      method_profile_id:
      training_instance_envelope_sha256:
      spawn_target_mapping_retained_by_parent: true | false | unverifiable
      same_target_followup_receipt_status: pass | fail | unverifiable
      commit_status: valid | invalid | timed_out
      revision_status: valid | invalid | unavailable
      no_blind_phase_supervisor_contact: true | false | unverifiable
  moderator:
    spawn_target_mapping_retained_by_parent: true | false | unverifiable
    followup_receipt_status: pass | fail | not_reached
    reveal_packet_sha256:
    moderator_report_sha256:
  safety_supervisor:
    spawn_target_mapping_retained_by_parent: true | false | unverifiable
    followup_receipt_status: pass | fail | not_reached
    preflight_status: pass | hold | blocked
    hold_count: 0 | 1
    report_complete: true | false
    safety_report_sha256:
  checkpoint_hashes:
    source_packet:
    training_control:
    commit_barrier:
    reveal:
    revision:
    reconcile:
    safety_report:
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
thread identifiers, timestamps, secrets, or provider data. Compute every
checkpoint and final digest with the projections and acyclic order defined in
`Manifest Checkpoints And Acyclic Order`; `manifest_sha256` is calculated only
after required QA.

Each `checkpoint_hashes` value is the digest of a separately preserved
`protocol_checkpoint.v1` artifact. A hash without its matching immutable
checkpoint artifact is unverifiable.

## Moderator Report

```yaml
moderator_report:
  schema: moderator_report.v1
  moderator_id: kakashi_hatake
  source_packet_sha256:
  method_matrix_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
  barrier_status: pass | fail
  shared_identity_and_method_assignment_status: pass | fail
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
  safety_report_sha256:
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
  hokage_synthesis:
  synthesis_provenance:
    source_revision_hashes: []
    accepted_claim_trace:
      - final_claim_id:
        source_claim_ids: []
        evidence_refs: []
        hokage_introduced: false
    rejected_claim_trace: []
    hokage_introduced_claims:
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
  final_qa:
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

Before final QA, `protocol_run_manifest_sha256` remains empty. After the final QA reviewer returns,
freeze all semantic, provenance, result, QA, and stop fields, create the QA
checkpoint and final manifest digest, then fill only that one manifest-hash
field. Any other post-QA change invalidates the QA result.

## Safety Report

`safety_report.v1` binds the final guidance-integrity, phase-order,
forbidden-action, protected-boundary, and no-contact checks to the same run:

```yaml
safety_report:
  schema: safety_report.v1
  supervisor_id: yamato
  source_packet_sha256:
  method_matrix_sha256:
  training_guidance_packet_sha256:
  safety_control_packet_sha256:
  protocol_run_manifest_reconcile_checkpoint_sha256:
  phase_order_status: pass | fail | unverifiable
  guidance_integrity_status: pass | fail | unverifiable
  shared_identity_and_method_assignment_status: pass | fail | unverifiable
  no_instance_specific_coaching_status: pass | fail | unverifiable
  blind_phase_content_feedback_absent: true | false | unverifiable
  protected_boundary_status: pass | fail | unverifiable
  forbidden_action_status: pass | fail | unverifiable
  findings: []
  permitted_result_ceiling: verified_consensus | provisional_consensus | structured_dispute | blocked
  safety_report_sha256:
```

The report contains no candidate-solution advice and can only preserve or lower
the result ceiling.

Do not add fields for raw reasoning traces, private scratchpads, hidden debate,
or a numerical personality score.

Critical or major claims introduced by Hokage must be independently verified,
demoted, or rejected. An unsupported Hokage-introduced claim cannot support
`verified_consensus`. The role-blind final QA reviewer receives the final artifact, acceptance criteria,
and evidence only; candidate identities, role prestige, completion order, and
vote counts are excluded from the QA packet.
