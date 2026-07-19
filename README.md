![Black-and-white manga-sketch fan-art banner with one Naruto, Kakashi, Yamato, and Tsunade as Hokage posing beside the Naruto Codex Deliberation Council title](assets/naruto-codex-deliberation-council-banner.png)

# Naruto Codex Deliberation Council

> **One Naruto. Four parallel training paths. Two supervisors. One accumulated
> lesson.**

[![CI](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/workflows/ci.yml)

**Evidence boundary:** package checks `PASS REQUIRED`; exact-release CI
`PASS REQUIRED`; target-host runtime `NOT PROVEN`; host orchestration adapter
and event log `NOT BUNDLED`; method diversity and quality lift `NOT MEASURED`;
fan-art and franchise rights `NOT CLEARED`.

Naruto Codex Deliberation Council is an explicit-only Codex skill that explores
one complete problem through four independent methods before producing one
evidence-weighted synthesis. The exact compatibility trigger is `$naruto`.

## Quick Start

Requirements: Git, Node.js 22 or newer, and a Codex host that supports
project-scoped skills and custom-agent profiles.

Clone the specific release tag before opening the directory as a trusted Codex
project:

```bash
git clone --branch v1.1.0 --depth 1 \
  https://github.com/FrameCoreWorks/naruto-codex-deliberation-council.git
cd naruto-codex-deliberation-council
git describe --tags --exact-match
```

Before running repository JavaScript or opening the checkout as a trusted Codex
project, inspect `package.json`, `.agents/skills/naruto/SKILL.md`,
`.codex/agents/`, `scripts/`, `.github/workflows/ci.yml`, and `SHA256SUMS`.
A checksum stored beside an untrusted checkout detects accidental drift but
does not authenticate its source.

After that source review, reproduce the package gates:

```bash
npm run checksums:check
npm test
```

After the checkout is trusted, open Codex from the repository directory and
start a new task:

```text
$naruto Review this architecture and recommend a verified route.
```

If the host does not discover all six profiles, cannot enforce effective child
`read-only` plus `never` approval policy, lacks capacity, or cannot continue the
same four instance threads, the correct protocol result is `blocked`. Static
tests do not turn a missing host capability into a successful live run.

To install into another project instead, preview the exact target first:

```bash
node scripts/install.mjs --scope project \
  --target /absolute/path/to/project --dry-run
node scripts/install.mjs --scope project \
  --target /absolute/path/to/project
```

## Status And Claim Boundary

| Surface | Status | Meaning |
|---|---|---|
| Package contract | `1.1.0` | Stable trigger, profile IDs, method IDs, layout, and installer roots; additive artifact fields follow the compatibility rules below. |
| Repository self-check | `PASS REQUIRED` | `npm test` must pass on the exact checkout being used. It checks package structure and fixtures, not a real hosted deliberation. |
| Isolated installer tests | `PASS REQUIRED` | Fresh install, strict CLI, source inventory, path/symlink controls, conflicts, and installed-target validation must pass. |
| Published repository | `PUBLIC` | [FrameCoreWorks/naruto-codex-deliberation-council](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council). |
| Hosted CI baseline | `PASS` | Two Node 22/24 runs passed for the published `v1.0.0` commit: [main](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/runs/29687294043) and [tag](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/runs/29687369374). Every later release needs its own green evidence. |
| Target-host discovery and same-thread revision | `NOT PROVEN` | A target Codex build must record live discovery, effective permission, capacity, isolation, and same-target follow-up evidence. |
| Host orchestration adapter and event log | `NOT BUNDLED` | Version `1.1.0` relies on parent-owned logical artifacts retaining unmodified host-tool target IDs and receipts. No deterministic adapter or tamper-evident, host-enforced event log is included. |
| Current host without that evidence | `BLOCKED` | Dedicated profiles cannot be replaced by generic agents and revisions cannot be recreated in new threads. |
| Independent final QA | `CONDITIONAL, NOT BUNDLED` | Consequential results require a host-provided, role-blind `final_qa` reviewer. The closed-envelope example binds request, result, task, final artifact, manifest, and effective outcome without adding a seventh profile; mismatch, replay, or non-pass QA blocks delivery. |
| Blind semantic-redundancy audit | `BUNDLED, HEURISTIC` | Kakashi compares claim meaning and evidence lineages before reveal. `sufficient` requires verified differences in both dimensions plus a unique contribution; one-dimensional, redundant, or unverifiable comparison caps the result at `provisional_consensus`. This is not a benchmark or deterministic similarity proof. |
| Method diversity and quality lift | `NOT MEASURED` | Four fixed instruction-level methods do not prove behavioral diversity or improvement over a single agent or planner-critic baseline. |
| Runtime cost and latency | `NOT BENCHMARKED` | The multi-agent path is expected to use more turns and resources, but this release makes no quantified efficiency claim. |
| Fan-art and franchise rights | `NOT CLEARED` | Technical validation, MIT licensing of original project material, and disclaimers do not grant third-party rights. |

See the [1.1.0 acceptance matrix](docs/release-acceptance-v1.1.0.md) for the
evidence required before a release or host run may be called accepted. The
[benchmark plan](docs/benchmark-plan.md) defines how later work can measure
output diversity, decision quality, latency, tokens, and cost without treating
method labels as evidence. Version `1.1.0` includes no benchmark results and
does not claim superiority over either baseline.

## Result Shape And Failure Modes

A successful run ends with one of the protocol statuses
`verified_consensus`, `provisional_consensus`, or `structured_dispute`.
`blocked` is a valid fail-closed result. A compact result may look like this:

```text
result_status: structured_dispute
final_qa_status: not_required
effective_result_status: structured_dispute
stop_decision: ask_user
supported_route: <claim-level synthesis with evidence references>
preserved_minority_objections:
  - <material unresolved objection>
runtime_evidence: <recorded preflight and same-target receipts>
```

This is a contract example, not a recorded host execution.
After QA, consumers must use `effective_result_status` as the sole delivery
status. When it is `blocked`, the frozen proposal's `result_status`,
`stop_decision`, and `next_action` are non-authoritative; only QA findings and a
repair or rerun route may be delivered.

| Condition | Expected behavior |
|---|---|
| Trigger is missing, quoted, prefixed, or has different case | Skill does not activate. |
| A required profile, supervisor, permission check, or child slot is unavailable | Return `blocked` before fan-out. |
| Source isolation or commit barrier cannot be demonstrated | Return `blocked`; do not infer independence. |
| Same-target follow-up cannot return to all four original instances | Return `blocked`; do not spawn replacement revisions. |
| Blind outputs differ in fewer than both required semantic dimensions, are redundant, or cannot be verified | Cap at `provisional_consensus`; do not manufacture dissent. |
| Consequential result lacks independent final QA | Return `blocked`. |
| Static, checksum, or installer validation fails | Do not install, release, or claim acceptance. |
| A solution asks for writes, providers, uploads, pushes, or deletion | Deliberation may recommend a later action, but `$naruto` grants no authority to execute it. |

## Trust And Safety Model

- Project trust comes before discovery. Codex may load project-scoped skills and
  profiles from a repository, so inspect the pinned checkout before opening it.
- All six profiles request `sandbox_mode = "read-only"` and
  `approval_policy = "never"` as profile defaults. The live parent permission
  override and managed host policy determine effective permissions; preflight
  must verify both values or block.
- Every child spawn must start without inherited conversation history. The four
  Naruto instances are opened before any candidate result is collected.
- Same-thread revision is demonstrated by successful follow-up receipts to the
  exact four targets returned at spawn, not by prose similarity.
- The repository self-check validates package scaffolding and static contract
  fixtures. It is not a complete parser of a live protocol run. Only a
  target-host acceptance run can validate host discovery and execution
  behavior.
- `$naruto` grants no provider, API, MCP, cost, upload, publishing, file-write,
  push, install, delete, destructive-action, or project-memory permission.

## The Training Arc Behind The Protocol

Naruto meets Sasuke again and the gap is impossible to ignore. Determination is
not the problem. He already knows the Rasengan, but forcing the same approach
harder will not create the next technique. He needs a way to learn faster,
practice safely, and turn many failed attempts into one usable lesson.

That is where Kakashi changes the training itself.

This skill is inspired by manga chapters **311-341**, spanning
[Volume 35](https://naruto-official.com/en/comics/01_117),
[Volume 36](https://naruto-official.com/en/comics/01_118),
[Volume 37](https://naruto-official.com/en/comics/01_119), and
[Volume 38](https://naruto-official.com/en/comics/01_120). Kakashi recognizes
that a shadow clone does more than fight beside Naruto: when it disperses, its
experience returns to the original. Parallel practice can therefore collapse
into one accumulated lesson. The
[official technique retrospective](https://naruto-official.com/en/news/01_1694)
describes that transfer directly.

The training has a concrete progression:

1. Chapters **311-312** establish the need for a new technique after Naruto
   confronts the renewed gap with Sasuke.
2. Chapter **315** explains clone experience transfer and identifies Naruto's
   Wind chakra affinity.
3. Chapters **316-318** train Wind transformation by cutting a leaf. In chapter
   **317**, Asuma contributes a short specialist lesson about the nature of Wind
   chakra.
4. Chapters **318-320** scale the exercise from a leaf to the waterfall created
   and expanded by Yamato.
5. Chapter **321** begins the harder step: combining Wind Release with the
   Rasengan.
6. Chapters **329-330** separate shape and nature transformation between two
   clones and produce Wind Release: Rasengan.
7. Chapter **339** unveils the first usable Wind Style: Rasen Shuriken.
8. Chapters **340-341** turn an unstable first combat attempt into a successful
   strike against Kakuzu.

The surrounding roles matter as much as the technique. **Kakashi** is the main
teacher and architect of the accelerated method. **Asuma** is a narrow domain
specialist who contributes exactly the missing Wind-nature insight. **Yamato**
does not replace Kakashi as teacher. He prepares the training ground, extends
the waterfall exercise, watches the physical strain, and can restrain the
Nine-Tails' chakra if Naruto loses control. The
[official Naruto retrospective](https://naruto-official.com/en/news/01_1610)
connects accelerated training, Wind nature, Rasen Shuriken, and Kakuzu; this
[official retrospective](https://naruto-official.com/en/news/01_1308) shows
Yamato's restraint role.

That arc becomes one software rule:

> Parallel work needs one learner, shared evidence, genuinely different
> training methods, protected independence, an explicit safety boundary, and a
> final owner who remains accountable.

## From Manga Training To A Codex Protocol

The implementation is inspired by the learning structure, not a literal copy
of the story. It does not create four character personas and it does not run
four identical prompts. It instantiates one shared Naruto actor identity through
four independent, method-diverse training paths.

| Manga-inspired role | Protocol responsibility |
|---|---|
| **Tsunade Senju, Fifth Hokage** | Public identity of the top-level role assumed by the parent Codex process. Hokage frames the task, controls phases, owns the stop decision, and writes the final synthesis. Tsunade is not a seventh child profile or an additional solver. |
| **Four shadow-clone instances** | Share `actor_identity_id: naruto_uzumaki`, receive the same complete task and common packets, use four fixed methods, commit before seeing peer work, then revise once in the original threads. |
| **Kakashi** | Creates one common, non-solution training brief and receives the canonical method matrix without changing it. After blind work, he validates the barrier and moderates evidence comparison without selecting a winner. |
| **Yamato** | Validates identity, method assignments, packet integrity, protected boundaries, and phase safety. He returns `pass`, `hold`, or `blocked`, but never coaches an individual instance or proposes a solution. |
| **Asuma's consultation** | Represents narrow, evidence-backed specialist input added to the shared source packet when a task needs it. It is not a permanent extra profile. |

The four training paths are fixed in
`.agents/skills/naruto/agent_manifest.json` before fan-out:

| Runtime profile | Method | Purpose |
|---|---|---|
| `naruto_clone_integrator` | `naruto_integrative_method.v1` | Build the most useful complete route, reconcile constraints, and preserve a practical fallback. |
| `naruto_clone_challenger` | `naruto_adversarial_method.v1` | Falsify weak premises, expose hidden cost and risk, and construct a safe alternative. |
| `naruto_clone_strategist` | `naruto_systems_method.v1` | Map ownership, dependencies, source-of-truth boundaries, and maintainability. |
| `naruto_clone_verifier` | `naruto_empirical_method.v1` | Build a complete hypothesis-led route with discriminating tests, observables, decision thresholds, and fallback or rollback conditions. |

```text
Tsunade as Hokage frames the mission, shared evidence, and method matrix
        -> Kakashi fixes one common brief and preserves the matrix unchanged
        -> Yamato validates identity, routing, effective permissions, and safety
        -> four Naruto training instances solve the whole task independently
        -> candidate solutions are committed behind one blind barrier
        -> one byte-identical reveal returns to the same four targets
        -> each instance revises without changing identity or method
        -> Kakashi reconciles evidence; Yamato reports phase safety
        -> Tsunade as Hokage accumulates the four lessons into one synthesis
```

This is not four agents chatting until they agree. It is a controlled training
ground with identical evidence, four explicit methods, one reveal, one
same-target revision, reproducible supervision, and a traceable final decision.

The banner is original, unofficial fan art created for this repository. It is
not included in the MIT license and does not reproduce a manga panel, dialogue,
or an official logo. It intentionally depicts recognizable franchise
characters, so its public distribution remains rights-uncleared. This project
is not affiliated with or endorsed by Masashi Kishimoto, Shueisha, VIZ Media,
or the *Naruto* franchise. Provenance, digest, QA, and distribution metadata is
stored in [`manifest/assets.json`](manifest/assets.json).

## Activation

Valid:

```text
$naruto Review this architecture and recommend a verified route.
```

```text
   $naruto
Compare these two implementation plans.
```

These do not activate the skill:

```text
naruto Review this architecture.
$Naruto Review this architecture.
$naruto: Review this architecture.
Please use $naruto later in this request.
`$naruto` is the command name.
> $naruto Review this architecture.
- $naruto Review this architecture.
```

The token must be the first non-empty token, must be followed by whitespace and
a task, and must not be quoted, escaped, fenced, or prefixed by prose or a list
marker.

## Deliberation Architecture

1. Hokage checks target-host discovery, trusted project configuration,
   effective child read-only/never permissions, capacity, source isolation, and
   same-target follow-up. Any unverified requirement blocks before fan-out.
2. Hokage fixes acceptance criteria and creates one canonical hashed evidence
   packet.
3. Hokage derives `method_matrix.v1` from the canonical agent manifest. It binds
   the one actor identity to four unique instance IDs and methods.
4. `kakashi_hatake` receives no inherited conversation context and derives one
   neutral `training_guidance_packet.v1`. It cannot recommend an answer, rank
   methods, add private evidence, or vary guidance by instance.
5. Four training envelopes bind each runtime to one matrix assignment and the
   common packet hashes. `yamato` validates identity, routing, envelopes,
   effective boundaries, and safety before candidate fan-out.
6. All four Naruto instances are spawned without inherited conversation history
   before any result is collected. Each solves the entire task independently.
7. Every candidate binds actor, instance, method, source, matrix, envelope,
   guidance, and safety hashes before the commit barrier opens.
8. Kakashi prepares one byte-identical reveal. Successful follow-up receipts to
   the exact four saved targets prove same-target revision continuity.
9. `protocol_run_manifest.v1` records packet identity, phase state, no-contact
   attestations, follow-up receipts, and regressions. Nine immutable checkpoints
   form the linked checkpoint chain.
10. Kakashi reconciles evidence lineages, minority objections, collective blind
    spots, quick surrender, and performative dissent. Yamato produces a final
    safety report from phase and boundary metadata only.
11. Hokage synthesizes with claim-level provenance. Consequential output
    receives role-blind independent final QA before the stop decision.

Completion speed, majority, answer length, confidence, and style are never
evidence. One independence key represents one underlying source lineage, even
when all four instances cite it. A supported minority objection can block
verified consensus. The protocol performs one reveal/revision cycle only.

## Repository Layout

```text
.agents/skills/naruto/   Skill instructions, schemas, fixtures, templates,
                         and the portable repository self-check
.codex/agents/           Six project-scoped read-only-default profiles
docs/                    Compatibility, acceptance, release, and rights notes
integrations/            Optional workspace adapter guidance
manifest/                Package structure, migration, asset, and release data
scripts/                 Installer, checksums, security tests, and validation
SHA256SUMS               Package-file checksums; not a source signature
```

The layout mirrors project-scoped Codex locations. Codex discovery occurs only
after the project is trusted and may require a restart or a new task.

## Validate

No dependency installation is required:

```bash
npm run validate
npm test
```

`validate` is a repository self-check for the package layout, profile and
manifest projections, strictly parsed profile TOML and agent-card YAML, trigger
and protocol fixtures, fail-closed classifiers, checkpoint projections,
installer security, release metadata, and checksums. It is not a complete
validator for arbitrary live-run artifacts and does not prove that a particular
Codex host performed a run. The claim-level semantic-redundancy fixture is a
fail-closed protocol check, not measured behavioral evidence. A full
machine-readable recorded-run validator is deferred to `1.2.0`.

## Install And Update

### Project scope

```bash
node scripts/install.mjs --scope project --target /absolute/path/to/project --dry-run
node scripts/install.mjs --scope project --target /absolute/path/to/project
```

This copies the skill to `.agents/skills/naruto/` and the six profiles to
`.codex/agents/`. Unknown, duplicated, missing-value, or scope-incompatible CLI
options fail before writes. The installer verifies the exact source inventory,
copies descriptor-verified source snapshots, rejects unsafe destination
symlinks, hard links, and unexpected package-owned skill files, then validates
the result from a private verified validator copy before reporting `installed`.
Existing differing files are never replaced unless `--force` is supplied.
Run it only without elevation against a quiescent target exclusively controlled
by your account.

### User scope

```bash
node scripts/install.mjs --scope user --dry-run
node scripts/install.mjs --scope user
```

The skill is copied to `$HOME/.agents/skills/naruto/`. Profiles are copied to
`$CODEX_HOME/agents/` when `CODEX_HOME` is set, otherwise to
`$HOME/.codex/agents/`. `--target` is not valid with user scope.

### Updating 0.4.x or 1.0.x

Preview differences first and use `--force` only for reviewed package-owned
files. The installer deliberately does not delete files. If any pre-`0.4`
legacy path is present, it returns `blocked` and `--force` cannot bypass the
migration gate.

1. Obtain a pinned release from the trusted repository source.
2. Run checksum and test commands in that checkout.
3. Run the destination install with `--dry-run`.
4. Review legacy, unexpected, differing, and unsafe-path reports.
5. Remove only confirmed obsolete package-owned files manually, if required.
6. Repeat the dry run and use `--force` only for intended replacements.
7. Restart Codex or start a new task and repeat target-host acceptance.

The release suite reproduces the complete `0.4.0` package inventory from commit
`42cab91`: 24 files are replaced, 9 are unchanged, and no package paths are
created during that migration.

Copies remain sequential rather than transactional. A filesystem or final
validation failure can leave a partial set of verified files. Inspect the exact
reported paths and rerun a dry run before recovery. No automatic rollback or
uninstall is claimed in `1.1.0`. A concurrent writer can still swap a parent
directory between pathname checks because Node has no portable `openat` API;
shared-writable and elevated installs are outside the supported trust boundary.

## Live Acceptance

After installation, any required restart, and creation of a new trusted task,
record the Codex build, scope, and evidence for:

- exact activation and documented non-activation examples
- discovery of all six dedicated profiles with no separate Hokage profile
- effective child `read-only` and `never` approval status, not only TOML defaults
- child spawns without inherited conversation history
- four unique runtime IDs and four fixed methods under one actor identity
- all four candidate spawns completed before the first candidate is collected
- byte-identical common evidence, matrix, guidance, safety, and reveal packets
- complete blind candidates committed before reveal
- successful follow-up receipts to the same four saved targets
- one revision with a traceable experience-transfer ledger per instance
- nine ordered and linked protocol checkpoints
- evidence-lineage counting and minority-objection preservation
- blind-output claim/evidence-lineage redundancy status and any result ceiling
- claim-level Hokage synthesis and consequential independent final QA
- no authority escalation and stop after one reveal/revision cycle
- a retained acceptance record for the preflight and same-target receipts

If any item is unavailable or ambiguous, report `blocked` and preserve the
missing evidence in the acceptance record.

## Distribution And License

This is a public standalone package because custom-agent TOML profiles are a
separate Codex configuration surface. It does not claim that a plugin installer
will install those profiles automatically.

Original repository code, documentation, templates, and validation scripts are
available under the MIT License. The title banner is unofficial fan art and is
expressly excluded from that license. No license or permission is granted for
third-party characters, names, marks, or protected expression, and no rights
clearance is claimed.

Review [`LICENSE`](LICENSE), [`NOTICE.md`](NOTICE.md),
[`docs/naming-risk.md`](docs/naming-risk.md), and
[`docs/compatibility.md`](docs/compatibility.md) before reuse or distribution.
