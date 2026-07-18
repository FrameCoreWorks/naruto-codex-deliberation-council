# Protocol Run Manifest

```yaml
protocol_run_manifest:
  schema: protocol_run_manifest.v1
  run_id: ""
  task_id: ""
  source_packet_sha256: ""
  training_guidance_packet_sha256: ""
  safety_control_packet_sha256: ""
  phase_integrity:
    source_packet_hashed: pass | fail | not_reached
    common_guidance_hashed: pass | fail | not_reached
    yamato_preflight_passed: pass | fail | not_reached
    guidance_byte_identity_verified: pass | fail | not_reached
    blind_supervisor_contact_absent: pass | fail | not_reached
    blind_commits_recorded: pass | partial | fail | not_reached
    commit_barrier_closed: pass | fail | not_reached
    reveal_byte_identical: pass | fail | not_reached
    same_thread_revisions_verified: pass | partial | fail | not_reached
    moderator_reconcile_complete: pass | fail | not_reached
    safety_report_complete: pass | fail | not_reached
    synthesis_provenance_checked: pass | fail | not_reached
    olga_qa_complete_or_not_required: pass | fail | not_reached
  candidates:
    - candidate_id: ""
      original_thread_handle_sha256: ""
      revision_thread_handle_sha256: ""
      same_thread_verified: true | false | unverifiable
      commit_status: valid | invalid | timed_out
      revision_status: valid | invalid | unavailable
      no_blind_phase_supervisor_contact: true | false | unverifiable
  moderator:
    thread_handle_sha256: ""
    reveal_packet_sha256: ""
    moderator_report_sha256: ""
  safety_supervisor:
    thread_handle_sha256: ""
    preflight_status: pass | hold | blocked
    hold_count: 0
    report_complete: false
    safety_report_sha256: ""
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
  result_ceiling_reason: ""
  protected_boundaries_preserved: true
  manifest_sha256: ""
```

This is a local protocol sidecar, not part of `source_packet_sha256`. Use only
opaque SHA-256 runtime-handle proofs, never raw thread IDs, timestamps, secrets,
private reasoning, or provider data. Equal original and revision handle hashes
are required for same-thread learning. Any unverifiable critical phase lowers
the result ceiling or blocks according to the protocol. Preserve one
`protocol_checkpoint.v1` artifact from `templates/protocol-checkpoint.md` after
every phase. Each checkpoint snapshot omits the entire `checkpoint_hashes`
object and `manifest_sha256`, and each checkpoint links to its predecessor.
Create `reconcile`, `safety_report`, `synthesis`, and `qa` checkpoints in that
order, then compute the final post-QA `manifest_sha256`.
