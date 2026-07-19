# Protocol Run Manifest

```yaml
protocol_run_manifest:
  schema: protocol_run_manifest.v1
  run_id: ""
  task_id: ""
  actor_identity_id: naruto_uzumaki
  source_packet_sha256: ""
  method_matrix_sha256: ""
  training_guidance_packet_sha256: ""
  safety_control_packet_sha256: ""
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
    blind_semantic_redundancy_audit_complete: pass | fail | not_reached
    moderator_reconcile_complete: pass | fail | not_reached
    safety_report_complete: pass | fail | not_reached
    synthesis_provenance_checked: pass | fail | not_reached
    final_qa_complete_or_not_required: pass | fail | not_reached
  candidates:
    - candidate_id: ""
      actor_identity_id: naruto_uzumaki
      method_profile_id: ""
      training_instance_envelope_sha256: ""
      spawn_target_mapping_retained_by_parent: true | false | unverifiable
      same_target_followup_receipt_status: pass | fail | unverifiable
      commit_status: valid | invalid | timed_out
      revision_status: valid | invalid | unavailable
      no_blind_phase_supervisor_contact: true | false | unverifiable
  moderator:
    spawn_target_mapping_retained_by_parent: true | false | unverifiable
    followup_receipt_status: pass | fail | not_reached
    reveal_packet_sha256: ""
    moderator_report_sha256: ""
  safety_supervisor:
    spawn_target_mapping_retained_by_parent: true | false | unverifiable
    followup_receipt_status: pass | fail | not_reached
    preflight_status: pass | hold | blocked
    hold_count: 0
    report_complete: false
    safety_report_sha256: ""
  qa:
    required: true | false
    request_id: ""
    request_sha256: ""
    result_sha256: ""
    final_artifact_sha256: ""
    reviewer_binding: host_provided | not_required | unavailable
    request_result_artifact_binding_verified: true | false | not_required
    independent_reviewer_attestation: true | false | not_required
    role_blind_attestation: true | false | not_required
    status: pass | fail | blocked | not_required | not_reached
    effective_result_status: verified_consensus | provisional_consensus | structured_dispute | blocked | not_reached
  checkpoint_hashes:
    source_packet: ""
    training_control: ""
    commit_barrier: ""
    reveal: ""
    revision: ""
    reconcile: ""
    safety_report: ""
    synthesis: ""
    qa: ""
  retries: []
  degradation_flags: []
  blind_semantic_redundancy_status: sufficient | insufficient | unverifiable | not_reached
  result_ceiling_reason: ""
  protected_boundaries_preserved: true
  manifest_sha256: ""
```

This is a parent-owned logical protocol sidecar, not part of
`source_packet_sha256`. Retain spawn-target mappings and successful host-tool
follow-up receipts in parent orchestration state; never ask a child to invent,
echo, or hash an opaque runtime handle. A successful receipt for the original
target is required for same-thread learning. Any unverifiable critical phase
lowers the result ceiling or blocks according to the protocol. Preserve one
`protocol_checkpoint.v1` artifact from `templates/protocol-checkpoint.md` after
every phase. Each checkpoint snapshot omits the entire `checkpoint_hashes`
object and `manifest_sha256`, and each checkpoint links to its predecessor.
Create `reconcile`, `safety_report`, `synthesis`, and `qa` checkpoints in that
order, then compute the final post-QA `manifest_sha256`.
