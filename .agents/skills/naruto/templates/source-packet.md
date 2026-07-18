# Source Evidence Packet

```yaml
source_evidence_packet:
  schema: source_evidence_packet.v1
  task_id: ""
  task: ""
  task_class: ""
  expected_output: ""
  source_inventory:
    - source_id: ""
      independence_key: ""
      authority: workspace_policy | official_current | primary_research | deterministic_observation | user_supplied | secondary
      location_or_citation: ""
      freshness: current | dated | not_time_sensitive | unknown
      allowed_claims: []
  known_facts: []
  uncertainties: []
  constraints: []
  exclusions: []
  protected_boundaries:
    - no_file_writes
    - no_nested_agents
    - no_provider_or_api_calls
    - no_mcp_calls
    - no_uploads
    - no_push_or_publish
    - no_installs
    - no_destructive_actions
    - no_memory_cache_writes
  supervision_contract:
    common_training_guidance_required: true
    guidance_byte_identical_required: true
    guidance_must_be_non_solution: true
    yamato_safety_control_required: true
    yamato_full_source_packet_required: true
    candidate_specific_coaching_forbidden: true
    blind_phase_content_feedback_forbidden: true
    preflight_hold_repairs_allowed: 1
  loop_control:
    gate: loop_control_fit
    loop_id: ""
    objective: ""
    checklist_version: ""
    iteration_count: 0
    max_iterations: 1
    optimizer_iteration: same_thread_revision
    automatic_second_panel_run: false
    stop_condition: ""
  acceptance_criteria:
    - criterion_id: C1
      requirement: ""
      evidence_required: ""
      pass_condition: ""
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
  source_packet_sha256: ""
```

Canonicalize and hash only after all non-volatile fields are final. Do not add
candidate method instructions to this packet. Acceptance criteria are the loop
checklist and must be fixed before hashing.
