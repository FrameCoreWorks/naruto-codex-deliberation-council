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
  acceptance_criteria:
    - criterion_id: C1
      requirement: ""
      evidence_required: ""
      pass_condition: ""
  evidence_rules:
    authority_order: []
    unsupported_claim_policy: expose
    critical_minority_policy: preserve_and_resolve
  output_schema: candidate_solution.v1
  source_packet_sha256: ""
```

Canonicalize and hash only after all non-volatile fields are final. Do not add
candidate method instructions to this packet.
