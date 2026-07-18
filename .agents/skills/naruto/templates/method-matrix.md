# Method Matrix Template

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
  method_matrix_sha256: ""
```

Build this matrix from the canonical agent manifest before fan-out. Every
training instance, Kakashi, and Yamato receives byte-identical matrix bytes.
The SHA-256 projection omits only `method_matrix_sha256`.
