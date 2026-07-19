# Release Acceptance: 1.0.1

Release preparation date: 2026-07-19.

This document defines the evidence boundary for `v1.0.1`. A green repository
suite and a successful target-host execution are different claims. Neither may
stand in for the other.

## Acceptance Matrix

| Lane | Required `v1.0.1` status | Evidence |
|---|---|---|
| Repository self-check | `PASS` | `npm run validate` on the exact release checkout. This is package scaffolding validation, not a live run. |
| Installer security and lifecycle | `PASS` | Strict CLI, exact source inventory, unsafe symlink and path rejection, conflicts, installed-target inventory, and target validation in isolated roots. |
| Checksums and repository hygiene | `PASS` | `npm run checksums:check` and `git diff --check` succeed with no drift. |
| Hosted CI for exact release | `PASS BEFORE RELEASE` | Ubuntu Node 22/24, macOS Node 24, and Windows Node 24 jobs must pass for the exact tag or commit. |
| Host profile discovery | `NOT PROVEN BY PACKAGE` | A target build must expose all six exact runtime IDs. |
| Host effective child permissions | `NOT PROVEN BY PACKAGE` | Parent and child effective `read-only` plus `never` approval status must be verified live. TOML defaults are insufficient. |
| Host context isolation and capacity | `NOT PROVEN BY PACKAGE` | Fresh-context child creation, spawn-all-before-wait, and six-slot peak capacity require live receipts. |
| Host same-target revision | `NOT PROVEN BY PACKAGE` | Four successful follow-ups must address the exact targets returned at candidate spawn. |
| Host orchestration adapter and event log | `NOT BUNDLED` | Base live acceptance uses a parent-owned logical sidecar with unmodified host-tool targets and receipts. A deterministic adapter and tamper-evident, host-enforced event log are not included. |
| Host independent final QA | `CONDITIONAL, NOT BUNDLED` | Consequential results require a host-provided role-blind reviewer. |
| Method output diversity and quality lift | `NOT MEASURED` | Fixed method assignments do not establish nonredundant reasoning or superiority over single-agent and planner-critic baselines. |
| Runtime cost and latency | `NOT BENCHMARKED` | No quantified token, latency, or cost result is included. |
| Public repository | `PUBLIC` | Repository publication is recorded independently of host acceptance. |
| Fan-art and franchise rights | `NOT CLEARED` | Technical acceptance is not permission, affiliation, or legal clearance. |

If every package lane passes but no target-host evidence exists, report:

```text
static_package: PASS
isolated_installer: PASS
target_host_runtime: NOT_PROVEN
protocol_execution: BLOCKED_UNTIL_LIVE_PREFLIGHT
host_orchestration_adapter: NOT_BUNDLED
behavioral_quality_lift: NOT_MEASURED
runtime_cost_latency: NOT_BENCHMARKED
fan_art_rights: NOT_CLEARED
```

## Trusted-source Preflight

Obtain the exact tag from the public repository without opening it as a trusted
Codex project first:

```bash
git clone --branch v1.0.1 --depth 1 \
  https://github.com/FrameCoreWorks/naruto-codex-deliberation-council.git
cd naruto-codex-deliberation-council
git describe --tags --exact-match
```

Inspect the project-scoped skill, profiles, installer, workflow, and checksum
policy. A checksum committed beside the files detects drift but is not an
independent source signature.

## Reproduce Static Acceptance

Run with Node.js 22 or newer:

```bash
npm run validate
npm test
npm run checksums:check
git diff --check
```

The release is not accepted if any command fails or changes tracked files.
Before publication, record the exact commit and hosted CI URLs for Ubuntu Node
22/24, macOS Node 24, and Windows Node 24 in the final delivery record or
release page.

The repository self-check must cover package paths, manifest projections,
exact trigger fixtures, strictly parsed profile TOML and agent-card YAML, stable
runtime and method IDs, fail-closed classification fixtures, checkpoint
run/task/phase/snapshot bindings, supervision contracts, templates, checksums,
and documentation invariants.

The repository self-check must fail closed when the static profile, manifest,
fixture, template, or documented preflight and receipt contracts disagree. It
does not parse an arbitrary live artifact graph. A complete machine-readable
recorded-run validator is deferred to `1.1.0` and must not be implied by a
`1.0.1` pass.

## Reproduce Isolated Installer Acceptance

The suite must prove:

- unknown, duplicated, missing-value, and scope-incompatible CLI options fail
  before destination writes
- project `--target` is absolute and user scope rejects `--target`
- source files exactly match the package manifest and checksum inventory
- fresh project and user installation, dry-run no-write, and idempotency
- differing files block without `--force` and reviewed replacement succeeds
- ancestor, directory, nested, final-component, and dangling symlinks block
- source and destination hard links block, including destination `--force`
- unexpected files in the package-owned Naruto skill directory block
- source payloads are copied from descriptor-verified byte snapshots
- target validation executes a private verified validator snapshot
- the full `0.4.0` inventory produces 0 creates, 23 overwrites, and 10 unchanged
- pre-`0.4` legacy paths block even with `--force`
- the installed skill validator passes before status `installed`

Installation is still sequential, not transactional. Partial verified files
may remain after a filesystem or final-validation failure. `1.0.1` does not
claim rollback or uninstall. The installer is not safe against a concurrent
writer swapping a destination ancestor between pathname checks; use only a
quiescent target exclusively controlled by the installer user and do not run
the installer elevated.

## Target-host Acceptance

After project trust, installation, any required restart, and creation of a new
task, record the Codex build and target scope. Before fan-out, prove:

1. all six exact profile IDs are discoverable and spawnable
2. capacity is at least six child threads at peak
3. parent and child effective permissions are `read-only` with `never` approval
4. each child can be created without inherited conversation context
5. all four Naruto instances can be spawned before collecting any candidate
6. the host can follow up to an exact saved target and return a success receipt
7. the parent can retain the protocol artifact graph in run context without
   child or filesystem persistence

The executed run must then record identical common packets, one actor identity,
four unique fixed methods, a blind commit barrier, one common reveal, four
same-target revisions, nine checkpoints, evidence-lineage controls, preserved
minority objections, and claim-level synthesis.

For consequential results, record independent role-blind final QA. If any live
capability or evidence item is missing or ambiguous, return `blocked`.

Base `1.0.1` live acceptance uses a parent-owned logical sidecar to bind
canonical protocol artifacts to unmodified target IDs and delivery receipts
returned by host tools. Model-authored IDs, hashes, or acknowledgements cannot
stand in for those runtime facts. The sidecar is not a deterministic adapter,
durable audit log, or tamper-evident host enforcement of phase order; those
stronger surfaces are not bundled and must not be implied by a successful run.

## Behavioral Evidence

Version `1.0.1` does not claim that its four method assignments produce
behaviorally diverse outputs or improve decision quality. It also makes no
quantified latency, token, or cost claim. See the
[behavioral benchmark plan](benchmark-plan.md) for the required single-agent
and planner-critic baselines, blinded evaluation, diversity and redundancy
measures, budget controls, and evidence package.

## Publication And Rights Boundary

The repository is already public. Publication status does not prove package or
host acceptance. The `v1.0.1` tag and release should be created only after all
required package lanes and exact-release hosted CI pass.

The banner remains unofficial fan art, excluded from the MIT license and
`NOT CLEARED`. See the tag-pinned
[NOTICE](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/blob/v1.0.1/NOTICE.md)
and
[naming-risk assessment](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/blob/v1.0.1/docs/naming-risk.md).
