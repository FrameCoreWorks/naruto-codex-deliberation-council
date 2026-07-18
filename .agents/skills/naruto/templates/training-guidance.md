# Common Training Guidance

```yaml
training_guidance_packet:
  schema: training_guidance_packet.v1
  source_packet_sha256: ""
  objective_frame: ""
  full_solution_requirement: ""
  acceptance_focus:
    - criterion_id: C1
      observable: ""
  evidence_discipline: []
  falsification_targets: []
  protected_boundary_reminders: []
  stop_conditions: []
  candidate_specific_content: false
  solution_recommendation_included: false
  preferred_route_included: false
  private_evidence_included: false
  raw_reasoning_included: false
  training_guidance_packet_sha256: ""
```

Kakashi derives this packet only from the final common source packet. It is a
shared training frame, not an answer key. Canonicalize it before hashing and
send byte-identical bytes to Yamato and all four candidates.
