# Reveal Transfer Packet

```yaml
reveal_transfer_packet:
  schema: reveal_transfer_packet.v1
  source_packet_sha256: ""
  commit_set_sha256: ""
  valid_candidate_ids: []
  concise_candidates:
    - candidate_id: ""
      solution_summary: ""
      claims: []
      evidence_refs: []
      risks: []
  claim_ledger:
    - claim_id: ""
      supporters: []
      challengers: []
      evidence_for: []
      evidence_against: []
      authority_note: ""
  agreements: []
  conflicts: []
  critical_minority_objections: []
  missing_evidence: []
  revision_questions: []
  raw_reasoning_included: false
```

Send byte-identical content to every valid candidate. Do not rank candidates
or identify a preferred answer.
