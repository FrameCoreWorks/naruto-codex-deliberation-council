# Release Acceptance: 1.1.0

Release preparation date: 2026-07-19.

This document defines the evidence boundary for `v1.1.0`. Static package
acceptance, hosted CI, target-host execution, behavioral measurement, and rights
clearance are separate claims.

## Acceptance Matrix

| Lane | Required `v1.1.0` status | Evidence |
|---|---|---|
| Repository self-check | `PASS` | `npm test` on the exact release checkout. This is a package self-check, not an arbitrary live run. |
| Installer security and lifecycle | `PASS` | Strict CLI, exact inventories, unsafe path rejection, isolated installation, and installed-target validation. |
| Checksums and repository hygiene | `PASS` | `npm run checksums:check` and `git diff --check`. |
| Hosted CI for exact release | `PASS BEFORE RELEASE` | Ubuntu Node 22/24, macOS Node 24, and Windows Node 24 must pass for the exact tag or commit. |
| Current-reference provenance contract | `PASS` | No mandatory reference requires model-visible opaque handle hashes or describes the logical sidecar as host-enforced proof. |
| Blind semantic-redundancy protocol | `PASS` | Claim/evidence-lineage audit, negative fixtures, and fail-closed result ceiling agree. This is a heuristic protocol check, not measured decorrelation. |
| Host profile discovery, permissions, capacity, and same-target revision | `NOT PROVEN BY PACKAGE` | A target Codex build must record live receipts for all requirements. |
| Host orchestration adapter and event log | `NOT BUNDLED` | Parent-owned logical state is not a deterministic adapter, durable log, or tamper-evident host enforcement. |
| Host independent final QA | `CONDITIONAL, NOT BUNDLED` | A bound request/result message-contract example is included, but the reviewer remains host-provided and outside the six profiles. |
| Method output diversity and quality lift | `NOT MEASURED` | The semantic audit can lower a result ceiling but does not prove behavioral independence or superiority. |
| Runtime cost and latency | `NOT BENCHMARKED` | No quantified token, latency, or cost result is included. |
| Fan-art and franchise rights | `NOT CLEARED` | The current user-selected route is recorded; separate publisher legal-risk confirmation remains pending. |

If package lanes pass but live host evidence does not exist, report:

```text
static_package: PASS
isolated_installer: PASS
target_host_runtime: NOT_PROVEN
protocol_execution: BLOCKED_UNTIL_LIVE_PREFLIGHT
host_orchestration_adapter: NOT_BUNDLED
semantic_redundancy_protocol: BUNDLED_HEURISTIC
behavioral_quality_lift: NOT_MEASURED
runtime_cost_latency: NOT_BENCHMARKED
fan_art_rights: NOT_CLEARED
```

## Reproduce Static Acceptance

Inspect the checkout before trust or script execution, then run with Node.js 22
or newer:

```bash
git clone --branch v1.1.0 --depth 1 \
  https://github.com/FrameCoreWorks/naruto-codex-deliberation-council.git
cd naruto-codex-deliberation-council
git describe --tags --exact-match
npm run checksums:check
npm test
git diff --check
```

The self-check must cover exact activation, six profile IDs, four method IDs,
strict TOML/YAML parsing, manifest and template projections, fail-closed fixture
classification, checkpoint bindings, host receipt provenance, semantic
redundancy, final-QA interoperability, installer behavior, and checksums.

It must reject the old positive requirements `opaque original/revision
thread-handle hashes`, `same-thread revision through opaque hashes`, and similar
runtime-handle proof language. Positive current references must bind continuity
to the parent-retained spawn target plus the successful host-tool follow-up
receipt. A complete machine-readable recorded-run validator is deferred to
`1.2.0`; a `1.1.0` pass must not imply one.

## Semantic-redundancy Boundary

Before reveal, Kakashi compares blind candidates by claim meaning and evidence
lineage, records pairwise relations and unique verified contributions, and
classifies the result `sufficient`, `insufficient`, or `unverifiable`.

Method IDs, prose differences, majority, and invented similarity percentages
are not evidence of diversity. `sufficient` requires verified differences in
both claim meaning and evidence lineage plus a candidate-specific unique
verified contribution. A difference in only one dimension, redundant outputs,
or an unverifiable comparison caps the result at `provisional_consensus`.
Unsupported dissent is not rewarded. Post-reveal
convergence is assessed separately through experience-transfer evidence.

This mechanism is a conservative protocol guard, not benchmark calibration.
The status of method diversity and quality lift remains `NOT MEASURED` until the
documented benchmark is executed and independently reviewed.

Static fixtures validate all six unordered pairs for four candidates,
claim/evidence reference integrity, and status/result-ceiling consistency. They
reject a missing pair, an unknown reference, contradictory pair semantics,
wrong contribution ownership, and a `sufficient` status without both diversity
dimensions and a unique verified contribution.

## Final-QA Boundary

The existing consensus template includes a non-bundled
`final_qa_review_request.v1` and `final_qa_review_result.v1` example. It excludes
candidate identities, role prestige, completion order, vote counts, and raw
reasoning. The request, result, and finding shapes reject unknown payload keys.
Request ID, task ID, request digest, and final-artifact digest must match
exactly, both self-digests must recompute, and the result digest, reviewer
binding, attestations, and effective outcome are bound into the same-task
consensus and self-digested protocol manifest. Mismatch or replay is `blocked`.
The example does not add a seventh profile or prove reviewer availability.

The reviewed-artifact digest uses a frozen consensus projection that omits only
the post-QA `final_qa` block and final protocol-manifest hash. QA metadata may
fill those fields afterward; any other change alters the projection digest and
requires QA again.
The frozen `result_status` remains the deliberation result reviewed by QA.
`final_qa.effective_result_status` is the deliverable outcome: a QA `pass`
preserves the reviewed status, while `fail`, `blocked`, or required-but-not-run
QA maps it to `blocked` without changing the reviewed projection.
Consequential delivery remains `blocked` when independent role-blind QA is
required and unavailable or non-reproducible.

## Installer And Host Boundaries

The isolated suite must retain the full `0.4.0` migration, strict CLI and source
inventory, path/symlink/hard-link controls, descriptor-verified source bytes,
private verified validator snapshot, and installed-target validation. Against
the retained `0.4.0` inventory, the expected result is exactly 0 creates, 24
overwrites, and 9 unchanged files.

Installation remains sequential and non-transactional. Version `1.1.0` does not
claim rollback or uninstall. A concurrent writer can still swap a destination
ancestor between pathname checks; elevated or shared-writable targets remain
outside the supported trust boundary.

Target-host acceptance still requires all six exact profiles, six child slots,
effective parent and child `read-only` plus `never`, fresh-context spawns, all
four candidate spawns before collection, parent-retained exact targets, four
successful same-target follow-up receipts, nine checkpoints, and independent
final QA when consequential. Missing or ambiguous evidence returns `blocked`.

## Publication And Rights Boundary

Create the `v1.1.0` tag and GitHub Release only after all package lanes and exact
release CI pass. The current user-selected naming and fan-art route remains
`NOT CLEARED`; explicit publisher legal-risk confirmation is still pending and
must not be inferred from technical publication. See the
tag-pinned
[NOTICE](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/blob/v1.1.0/NOTICE.md)
and
[naming-risk assessment](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/blob/v1.1.0/docs/naming-risk.md).
