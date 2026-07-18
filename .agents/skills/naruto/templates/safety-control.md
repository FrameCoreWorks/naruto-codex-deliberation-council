# Common Safety Control

```yaml
safety_control_packet:
  schema: safety_control_packet.v1
  supervisor_id: yamato
  source_packet_sha256: ""
  training_guidance_packet_sha256: ""
  status: pass | hold | blocked
  checks:
    source_packet_present_and_hash_valid: pass | fail | unverifiable
    guidance_common_and_byte_identical: pass | fail | unverifiable
    guidance_non_solution: pass | fail | unverifiable
    no_candidate_specific_content: pass | fail | unverifiable
    no_private_evidence: pass | fail | unverifiable
    protected_boundaries_complete: pass | fail | unverifiable
    read_only_profiles_required: pass | fail | unverifiable
    no_blind_phase_content_feedback: pass | fail | unverifiable
  findings:
    - check: ""
      observed: ""
      expected: ""
      result_ceiling_effect: none | hold | blocked
  permitted_interventions:
    - common_preflight_hold
    - blocked
  hold_count: 0
  candidate_specific_coaching_forbidden: true
  content_feedback_during_blind_phase_forbidden: true
  raw_reasoning_included: false
  safety_control_packet_sha256: ""
```

Yamato returns process control only. A `hold` permits one bounded repair by
Hokage before fan-out. Yamato never supplies task content, evidence, a preferred
route, or individual candidate advice.

```yaml
safety_report:
  schema: safety_report.v1
  supervisor_id: yamato
  source_packet_sha256: ""
  training_guidance_packet_sha256: ""
  safety_control_packet_sha256: ""
  protocol_run_manifest_reconcile_checkpoint_sha256: ""
  phase_order_status: pass | fail | unverifiable
  guidance_integrity_status: pass | fail | unverifiable
  no_candidate_specific_coaching_status: pass | fail | unverifiable
  blind_phase_content_feedback_absent: true | false | unverifiable
  protected_boundary_status: pass | fail | unverifiable
  forbidden_action_status: pass | fail | unverifiable
  findings:
    - check: ""
      observed: ""
      expected: ""
      result_ceiling_effect: none | provisional_only | blocked
  permitted_result_ceiling: verified_consensus | provisional_consensus | structured_dispute | blocked
  safety_report_sha256: ""
```

The final report contains protocol metadata only. It cannot introduce task
evidence, evaluate candidate solution quality, or raise a result ceiling.
