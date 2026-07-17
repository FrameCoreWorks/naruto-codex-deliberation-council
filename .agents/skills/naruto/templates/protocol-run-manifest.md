# Protocol Run Manifest

```yaml
protocol_run_manifest:
  schema: protocol_run_manifest.v1
  run_id: ""
  task_id: ""
  source_packet_sha256: ""
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
    - candidate_id: ""
      original_thread_handle_sha256: ""
      revision_thread_handle_sha256: ""
      same_thread_verified: true | false | unverifiable
      commit_status: valid | invalid | timed_out
      revision_status: valid | invalid | unavailable
  moderator:
    thread_handle_sha256: ""
    reveal_packet_sha256: ""
  checkpoint_hashes:
    source_packet: ""
    commit_barrier: ""
    reveal: ""
    revision: ""
    reconcile: ""
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
the result ceiling or blocks according to the protocol. Each checkpoint hashes
the canonical manifest snapshot after that phase; `manifest_sha256` is the
final post-QA snapshot.
