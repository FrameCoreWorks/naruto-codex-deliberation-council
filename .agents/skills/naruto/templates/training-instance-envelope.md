# Training Instance Envelope Template

```yaml
training_instance_envelope:
  schema: naruto_training_instance_envelope.v1
  actor_identity_id: naruto_uzumaki
  instance_id: ""
  assigned_method_profile_id: ""
  task_scope: complete
  source_packet_sha256: ""
  method_matrix_sha256: ""
  training_guidance_packet_sha256: ""
  envelope_sha256: ""
```

All envelopes derive from the same manifest and common packet hashes. Across
the four envelopes only `instance_id`, `assigned_method_profile_id`, and the
resulting `envelope_sha256` may differ. The method assignment is routing
metadata fixed before fan-out, not private coaching. The SHA-256 projection
omits only `envelope_sha256`.
