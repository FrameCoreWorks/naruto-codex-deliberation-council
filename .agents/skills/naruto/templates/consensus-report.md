# Consensus Report

```yaml
consensus_report:
  schema: consensus_report.v1
  task_id: ""
  source_packet_sha256: ""
  protocol_run_manifest_sha256: ""
  moderator_report_sha256: ""
  safety_report_sha256: ""
  result_status: verified_consensus | provisional_consensus | structured_dispute | blocked
  valid_candidate_count: 0
  evidence_basis: []
  agreements: []
  accepted_claims: []
  rejected_claims:
    - claim: ""
      reason: ""
  disputed_claims:
    - claim: ""
      positions: []
      exact_resolution_need: ""
  critical_minority_objections: []
  deliberation_quality:
    blind_semantic_redundancy_status: sufficient | insufficient | unverifiable
    unique_verified_contribution_refs: []
    post_revision_convergence_status: evidence_backed | mixed | unsupported | unverifiable
  hokage_synthesis: ""
  synthesis_provenance:
    source_revision_hashes: []
    accepted_claim_trace:
      - final_claim_id: ""
        source_claim_ids: []
        evidence_refs: []
        hokage_introduced: false
    rejected_claim_trace: []
    hokage_introduced_claims:
      - claim_id: ""
        claim: ""
        impact: critical | major | minor
        evidence_refs: []
        verification_status: verified | demoted | rejected | unverifiable
    coverage_check:
      critical_objections_accounted_for: true | false
      unexamined_risk_categories: []
      exact_resolution_need_for_open_items: []
  selected_normal_route: ""
  protected_boundaries_preserved: true
  final_qa:
    required: true | false
    status: pass | fail | blocked | not_required | not_run
    effective_result_status: verified_consensus | provisional_consensus | structured_dispute | blocked
    request_id: ""
    request_sha256: ""
    result_sha256: ""
    final_artifact_sha256: ""
    reviewer_binding: host_provided | not_required | unavailable
    request_result_artifact_binding_verified: true | false | not_required
    independent_reviewer_attestation: true | false | not_required
    role_blind_attestation: true | false | not_required
    review_packet_scope: final_artifact_criteria_evidence_only | not_required
    candidate_role_identities_excluded: true
    findings:
      - criterion_id: ""
        observed: ""
        expected: ""
        evidence_refs: []
        reproducible_next_check: ""
  loop_summary:
    loop_id: ""
    checklist_version: ""
    iteration_count: 0
    max_iterations: 1
    repair_history:
      - criterion_id: ""
        intervention: ""
        verification_result: pass | fail | partial | unverifiable
    failed_criteria_remaining: []
    regression_check:
      previous_passes_preserved: true | false | unverifiable
      new_regressions: []
    material_improvement: true | false | unverifiable
    hard_stop_reason: ""
  stop_decision: stop_sufficient | patch_one_gap | ask_user | blocked
  next_action: ""
```

User-facing delivery should summarize the decision, decisive evidence,
remaining uncertainty, Loop Protocol stop decision, and next normal route
without exposing raw transcripts. Before sending QA, freeze all semantic,
provenance, result, and stop fields and hash the canonical review
projection with `protocol_run_manifest_sha256` and the entire `final_qa` block
omitted. After a bound QA result returns, fill the `final_qa` block, record QA in
the manifest, compute the QA checkpoint and final manifest digest, then fill the
manifest-hash field. Any change outside those two omitted fields requires QA
again.

## Host-provided Final QA Interoperability Example

This is a non-bundled message contract, not a seventh runtime profile. Use it
only after the six Naruto child threads close and only when host preflight has
confirmed an independent reviewer. It does not prove that a host provides the
role.

```yaml
final_qa_review_request:
  schema: final_qa_review_request.v1
  request_id: ""
  task_id: ""
  consequential_reason: ""
  final_artifact_ref: consensus_report.qa_review_projection
  final_artifact_sha256: ""
  acceptance_criteria: []
  evidence_refs: []
  candidate_role_identities_excluded: true
  role_prestige_excluded: true
  completion_order_excluded: true
  vote_counts_excluded: true
  raw_reasoning_included: false
  request_sha256: ""

final_qa_review_result:
  schema: final_qa_review_result.v1
  request_id: ""
  task_id: ""
  request_sha256: ""
  final_artifact_sha256: ""
  reviewer_binding: host_provided
  independent_reviewer_attestation: true
  role_blind_attestation: true
  status: pass | fail | blocked
  findings:
    - criterion_id: ""
      observed: ""
      expected: ""
      evidence_refs: []
      reproducible_next_check: ""
  raw_reasoning_included: false
  result_sha256: ""
```

Missing independence, role blindness, or a reproducible finding shape is not a
pass. Recompute both self-digests and require exact equality of `request_id`,
`task_id`, `request_sha256`, and `final_artifact_sha256` before accepting the
result. The request `task_id` must also equal the reviewed consensus
`task_id`. The artifact digest uses the frozen projection defined above, avoiding
a circular dependency on post-QA metadata. A mismatch or replay from another
QA request is `blocked`. Copy the exact result status into both
`consensus_report.final_qa.status` and `protocol_run_manifest.qa.status`; a
status mismatch invalidates the stored binding. A
consequential result remains blocked when the reviewer is unavailable.
`result_status` is the frozen deliberation result reviewed by QA. The
post-review `final_qa.effective_result_status` is the deliverable outcome: it
equals `result_status` only for `pass` or `not_required`, and is `blocked` for
`fail`, `blocked`, or required-but-`not_run`. Keeping this effective gate inside
the excluded QA metadata avoids changing the reviewed projection after QA.
Consumers use `final_qa.effective_result_status` as the only delivery status.
When it is `blocked`, frozen `result_status`, `stop_decision`, and `next_action`
are proposal history only; deliver the QA findings and repair/rerun route.
The v1 request, result, and finding objects use the exact keys shown above;
unknown payload fields are rejected. Reject the review projection too if it
contains candidate outputs, role or method assignments, completion order, vote
counts, role prestige, or raw reasoning/transcripts. The final consensus must
bind the self-digested manifest for the same task and exact QA record.
