# Codex Deliberation Council

> **One mission. Four paths. Every lesson comes home.**

## Where The Idea Began

A hard problem blocks the road? Good. That means training starts now.

One attempt hits the wall. Then another. Each one tests a different opening,
finds a different weakness, and earns a different lesson. When the attempts
come back together, none of that experience is wasted. The next answer returns
stronger because every struggle left something behind.

That is the spark behind this skill.

The inspiration comes from Masashi Kishimoto's *Naruto*, specifically
[*NARUTO*, Volume 35](https://naruto-official.com/en/comics/01_117). The volume
collects [chapters 310-319](https://www.viz.com/shonenjump/chapters/naruto),
while chapter 315 introduces the mechanism that shaped this protocol: Naruto
learns that a shadow clone's experience returns when it disperses. Chapters
316-319 then show that idea put to work as parallel training. The
[official Naruto retrospective](https://naruto-official.com/en/news/01_1610)
also identifies this Volume 35 training as the point where the technique lets
him accelerate his progress.

The manga's training idea became a software rule:

1. Four dedicated agents face the same complete task.
2. Each attempt stays blind and independent until every answer is committed.
3. One identical reveal carries the lessons, conflicts, and missing evidence
   back to the same four agent threads.
4. Every agent revises its own complete answer instead of surrendering its
   perspective or voting for the loudest result.
5. Kakashi reconciles the evidence. Oskar delivers the synthesis or preserves
   the dispute when the evidence does not justify consensus.

This is not a shortcut. It is not four agents splitting one mission into easy
pieces. It is four full attempts, one shared lesson, and one chance to return
stronger.

**Train in parallel. Learn together. Bring back the strongest answer.**

This is an independent, unofficial project inspired by a general training
mechanism from the manga. It does not reproduce manga pages, dialogue,
catchphrases, artwork, or character performance, and it is not affiliated with
or endorsed by Masashi Kishimoto, Shueisha, or any *Naruto* rights holder.

## What It Is

Codex Deliberation Council is a request-only skill for comparing four complete,
independent solutions before one evidence-weighted synthesis. The current
compatibility trigger is `$naruto`.

The package is intentionally read-only during deliberation. It does not grant
permission to edit files, spawn nested agents, call providers or APIs, use MCP,
upload, push, install, delete, or write project memory.

## Status

- Standalone package version: `0.2.0`
- Skill name: `naruto`
- Trigger: exact, case-sensitive first non-empty token `$naruto`
- Runtime profiles: four candidates and one moderator
- Dependencies: Node.js 18 or newer for validation and installation helpers
- External services: none

The package has static and fixture-based validation. A real post-install Codex
run is still required to prove same-thread revision behavior in the target
runtime.

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

1. The parent Codex agent acts as Oskar, the sole orchestrator and final
   synthesizer.
2. Oskar opens `loop_control_fit` with `max_iterations: 1`, fixes the acceptance
   criteria, and creates one canonical, hashed evidence packet.
3. `naruto_uzumaki`, `sasuke_uchiha`, `shikamaru_nara`, and
   `sakura_haruno` receive byte-identical task evidence and solve the complete
   task independently through distinct methods.
4. Every candidate commits a concise, schema-valid output, including evidence
   classes, independence keys, falsification checks, and a pre-reveal
   self-audit, before any peer result is revealed.
5. `kakashi_hatake` validates the barrier and prepares one byte-identical reveal
   packet. Kakashi is a moderator, not a fifth candidate or final judge.
6. The reveal returns to the same four open candidate threads for exactly one
   complete revision. Matching opaque thread-handle hashes and an
   experience-transfer claim map prove continuity without exposing thread IDs.
7. `protocol_run_manifest.v1` records phase checkpoints, reveal identity,
   same-thread proofs, and regression results without entering the common packet
   hash.
8. Kakashi reconciles evidence lineages, minority objections, collective blind
   spots, quick surrender, and performative dissent. Repeated use of one source
   independence key still counts as one evidence lineage.
9. Oskar synthesizes with claim-level provenance. Consequential outputs receive
   role-blind Olga QA with reproducible findings before the final stop decision.

Completion speed, majority, answer length, confidence, and style are never
evidence. A supported minority objection can block verified consensus.

Possible result statuses are `verified_consensus`, `provisional_consensus`,
`structured_dispute`, and `blocked`.

The bounded stop decisions are `stop_sufficient`, `patch_one_gap`, `ask_user`,
and `blocked`. The protocol never starts a second panel automatically.

## Repository Layout

```text
.agents/skills/naruto/   Skill instructions, cards, references, templates,
                         fixtures, and the portable validator
.codex/agents/           Five project-scoped read-only custom-agent profiles
docs/                    Compatibility, prior-art, and naming-risk notes
integrations/            Optional workspace adapter guidance
manifest/                Package structure and release metadata
scripts/                 Installer, checksum, and package validation helpers
SHA256SUMS               SHA-256 for every package file except itself
```

The layout mirrors official project-scoped Codex locations. Cloning the repo
and opening Codex from this directory makes the skill and profiles available as
project configuration.

## Validate

No dependency installation is required:

```bash
npm run validate
npm test
```

Both commands run the same suite. It checks the skill contract, trigger,
protocol, integrity, loop, and regression fixtures, five read-only profiles,
package hygiene, required documentation, and all recorded SHA-256 checksums.

## Install

### Project scope

Preview changes, then install into an existing project:

```bash
node scripts/install.mjs --scope project --target /absolute/path/to/project --dry-run
node scripts/install.mjs --scope project --target /absolute/path/to/project
```

This copies the skill to `.agents/skills/naruto/` and the five profiles to
`.codex/agents/` inside the target project. Existing differing files are never
overwritten unless `--force` is supplied.

### User scope

Preview and install for the current user:

```bash
node scripts/install.mjs --scope user --dry-run
node scripts/install.mjs --scope user
```

The skill is copied to `$HOME/.agents/skills/naruto/`. Profiles are copied to
`$CODEX_HOME/agents/` when `CODEX_HOME` is set, otherwise to
`$HOME/.codex/agents/`.

Codex normally detects skill changes automatically. If the skill or profiles
do not appear, restart Codex and start a new task. Configuration changes should
be tested in a new task so no old thread context affects trigger checks.

## Update

1. Pull or replace this repository from its trusted source.
2. Run `npm test` here before updating an installation.
3. Preview the target with the same install command plus `--dry-run`.
4. Review any differing destination files. Preserve local changes if they are
   intentional.
5. Re-run the install command with `--force` only when replacing those files is
   intended.
6. Restart Codex or start a new task if the updated skill or profiles are not
   visible.
7. Repeat the live acceptance checks below.

The installer never deletes extra destination files and never creates a remote
or pushes code.

## Live Acceptance

After installation and any required restart, verify in a new task:

- exact `$naruto` activation and all documented non-activation examples
- all five dedicated profiles are available and read-only
- all four candidates receive the same evidence-packet hash
- no candidate sees peers before the commit barrier
- acceptance criteria exist before fan-out and bind to `loop_control_fit`
- the reveal bytes are identical for every candidate
- opaque original/revision thread-handle hashes match for each candidate
- every revision has a traceable experience-transfer ledger
- shared sources retain one independence key rather than inflating consensus
- Kakashi records bounded anti-groupthink and minority-preservation checks
- Oskar synthesis traces material claims back to revisions and evidence
- consequential Olga QA is role-blind and every failure is reproducible
- a missing dedicated profile is not replaced by a generic worker
- result status respects quorum and unresolved minority evidence
- `$naruto` does not inherit provider, upload, write, push, install, or delete
  permission
- previous passes are rechecked for regressions after the one revision
- the run stops after one reveal/revision cycle and never opens a second panel

If same-thread follow-up or the dedicated profiles are unavailable in the
target runtime, the correct result is `blocked`.

## Safety Boundaries

- Candidates and Kakashi are read-only.
- Candidate agents cannot spawn children or research outside the common packet.
- Missing dedicated agents cannot be replaced by `default`, `worker`, or
  `explorer` profiles.
- `$naruto` grants no provider, API, MCP, cost, upload, publishing, file-write,
  push, destructive-action, install, delete, or project-memory permission.
- Any later execution leaves deliberation mode and re-enters the target
  project's normal approval and safety route.
- Raw chain-of-thought, private scratchpads, and debate transcripts are not
  protocol artifacts.

## Distribution Note

Current OpenAI documentation treats a skill folder as the authoring format and
recommends plugins for broad installable distribution. This repository remains
a transparent standalone skill package because its five project/user custom
agent TOML profiles are a separate Codex configuration surface. It does not
claim that a plugin installer will install those profiles automatically.

See [`docs/compatibility.md`](docs/compatibility.md) for official sources and
prior art, [`integrations/framecore-workspace.md`](integrations/framecore-workspace.md)
for the optional FrameCore adapter, and [`NOTICE.md`](NOTICE.md) before public
release.

## License

Original repository code and documentation are available under the MIT License.
Third-party names are not licensed. See [`LICENSE`](LICENSE) and
[`NOTICE.md`](NOTICE.md).
