# Protocol Checkpoint

```yaml
protocol_checkpoint:
  schema: protocol_checkpoint.v1
  run_id: ""
  task_id: ""
  sequence: 1
  phase: source_packet | training_control | commit_barrier | reveal | revision | reconcile | safety_report | synthesis | qa
  previous_checkpoint_sha256: null
  manifest_snapshot: {}
  checkpoint_sha256: ""
```

Create and preserve one immutable checkpoint artifact after every phase. The
`manifest_snapshot` is a deep copy of the inner `protocol_run_manifest` at that
moment with the entire `checkpoint_hashes` object and `manifest_sha256` removed.
For sequence 1, `previous_checkpoint_sha256` is `null`; every later checkpoint
must reference the digest of the immediately preceding checkpoint artifact.

Compute `checkpoint_sha256` by omitting only that self-digest field from the
checkpoint artifact. Store the result in the matching manifest
`checkpoint_hashes` entry. Later manifest changes never mutate or replace a
preserved checkpoint artifact.
