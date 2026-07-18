# Codex Deliberation Council

> **Four independent candidates. One shared training brief. Two supervisors.
> One accountable synthesis.**

## The Training Arc Behind The Protocol

Naruto meets Sasuke again and has to face a hard truth: determination alone
will not close the gap. He already knows the Rasengan. What he needs now is a
stronger technique and a better way to learn.

That is where Kakashi changes the shape of the training.

The inspiration for this skill comes from manga chapters **311-341**, spanning
[Volume 35](https://naruto-official.com/en/comics/01_117),
[Volume 36](https://naruto-official.com/en/comics/01_118),
[Volume 37](https://naruto-official.com/en/comics/01_119), and
[Volume 38](https://naruto-official.com/en/comics/01_120). Kakashi turns the
Shadow Clone Technique into a learning accelerator: when a clone disperses,
its experience and knowledge return to the original Naruto. Many parallel
attempts can therefore become one accumulated lesson. The
[official technique retrospective](https://naruto-official.com/en/news/01_1694)
describes that transfer directly.

The chapter sequence is concrete. Chapters **311-312** establish the need for a
new technique after the renewed gap with Sasuke. Chapter **315** explains clone
experience transfer and identifies Naruto's Wind affinity. The training then
moves through observable stages:

1. Chapters **316-318**: cut a leaf with Wind chakra, with a brief specialist
   lesson from Asuma in chapter **317**.
2. Chapters **318-320**: scale the exercise until the clones cut through the
   waterfall created and expanded by Yamato.
3. Chapter **321**: begin adding Wind Release to the Rasengan.
4. Chapters **329-330**: separate shape and nature transformation between two
   clones and produce Wind Release: Rasengan.
5. Chapter **339**: unveil the first usable **Wind Style: Rasen Shuriken**.
6. Chapters **340-341**: recover from an unstable first combat attempt and land
   the technique successfully against Kakuzu.

The roles around him matter as much as the technique. **Kakashi** is the main
teacher and architect of the method. **Asuma** appears briefly as a domain
specialist who gives practical guidance about Wind chakra. **Yamato** is not a
second main teacher. He builds and expands the training ground, monitors the
strain, and acts as the safety supervisor who can restrain the Nine-Tails'
chakra if Naruto loses control. The
[official Naruto retrospective](https://naruto-official.com/en/news/01_1610)
connects the accelerated training, Wind nature, Rasen Shuriken, and Kakuzu;
[this official retrospective](https://naruto-official.com/en/news/01_1308)
shows Yamato's restraint role.

That training arc became one software rule:

> Parallel work needs shared direction, independent execution, an explicit
> safety boundary, and a final owner who remains accountable.

## From Manga Training To A Codex Council

| Manga-inspired role | Protocol responsibility |
|---|---|
| **Hokage** | The public top-level role assumed by the parent Codex process. Hokage frames the task, controls phase transitions, owns the stop decision, and writes the final synthesis. Hokage is not a spawned profile. |
| **Four candidates** | Naruto, Sasuke, Shikamaru, and Sakura receive the same complete task plus byte-identical guidance and safety packets. They solve independently and commit before seeing peers. |
| **Kakashi** | Creates one neutral, non-solution training brief for all four candidates. After the blind phase, he validates the barrier and moderates the evidence comparison without choosing a winner. |
| **Yamato** | Validates guidance integrity, protected boundaries, and phase safety. He returns `pass`, `hold`, or `blocked`, but never coaches one candidate or proposes a preferred solution. |
| **Asuma's consultation** | Represents narrow, evidence-backed specialist input added to the shared source packet when a task needs it. It is not a permanent extra profile. |

```text
Hokage frames the mission
        -> Kakashi prepares common guidance
        -> Yamato clears the safety boundary
        -> four candidates solve independently
        -> positions are committed and revealed
        -> the same four threads revise once
        -> Kakashi reconciles, Yamato reports safety
        -> Hokage produces the final synthesis
```

This is not four agents chatting until they agree. It is a controlled training
ground: identical starting conditions, protected independence, one reveal, one
same-thread revision, explicit supervision, and a traceable final decision.

This independent project contains no manga artwork or reproduced dialogue and
does not imitate a character performance. It is not affiliated with or
endorsed by Masashi Kishimoto, Shueisha, VIZ Media, or the *Naruto* franchise.

## What It Is

Codex Deliberation Council is a request-only skill for comparing four complete,
independent solutions before one evidence-weighted synthesis. The current
compatibility trigger is `$naruto`.

The package is intentionally read-only during deliberation. It does not grant
permission to edit files, spawn nested agents, call providers or APIs, use MCP,
upload, push, install, delete, or write project memory.

## Status

- Standalone package version: `0.3.0`
- Skill name: `naruto`
- Trigger: exact, case-sensitive first non-empty token `$naruto`
- Runtime profiles: four candidates, Kakashi, and Yamato
- Parent role: Hokage; no separate Hokage profile is bundled
- Dependencies: Node.js 18 or newer for validation and installation helpers
- External services: none

The package has static and fixture-based validation. Version `0.3.0` remains
pre-1.0 intentionally: a real post-install Codex run is still required to prove
six-profile availability, same-thread revision, and Yamato supervision in the
target runtime.

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

1. The parent Codex process assumes the public **Hokage** role as sole
   orchestrator and final synthesizer. Hokage is not a seventh agent.
2. Hokage opens `loop_control_fit` with `max_iterations: 1`, fixes acceptance
   criteria, and creates one canonical, hashed evidence packet.
3. `kakashi_hatake` derives one neutral `training_guidance_packet.v1` from that
   packet. It may clarify criteria and checks, but cannot recommend an answer,
   rank routes, add private evidence, or vary by candidate.
4. `yamato` validates the guidance and protected boundaries in
   `safety_control_packet.v1`. Candidate fan-out starts only after `pass`; one
   common preflight repair is permitted after `hold`, and any second non-pass
   blocks the run.
5. `naruto_uzumaki`, `sasuke_uchiha`, `shikamaru_nara`, and
   `sakura_haruno` receive byte-identical source, guidance, and safety packets,
   then solve the complete task independently through distinct methods.
6. Every candidate commits all three packet hashes, a full solution, evidence
   classes, independence keys, falsification checks, a pre-reveal self-audit,
   and a no-blind-supervisor-contact attestation before seeing peers.
7. Kakashi validates the barrier and prepares one byte-identical reveal packet.
   The same four open threads then revise exactly once. Matching opaque
   thread-handle hashes and an experience-transfer claim map prove continuity.
8. `protocol_run_manifest.v1` records training control, packet identity,
   same-thread proofs, no-contact state, and regressions. Every phase also
   preserves an immutable `protocol_checkpoint.v1` snapshot linked to the
   previous checkpoint.
9. Kakashi reconciles evidence lineages, minority objections, collective blind
   spots, quick surrender, and performative dissent. Yamato produces a final
   `safety_report.v1` from phase and boundary metadata only.
10. Hokage synthesizes with claim-level provenance. Consequential outputs
    receive role-blind Olga QA with reproducible findings before the final stop
    decision.

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
.codex/agents/           Six project-scoped read-only custom-agent profiles
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
protocol, supervision, checkpoint integrity, loop, and regression fixtures, six
read-only profiles, package hygiene, installer security, required documentation,
and all recorded SHA-256 checksums.

## Install

### Project scope

Preview changes, then install into an existing project:

```bash
node scripts/install.mjs --scope project --target /absolute/path/to/project --dry-run
node scripts/install.mjs --scope project --target /absolute/path/to/project
```

This copies the skill to `.agents/skills/naruto/` and the six profiles to
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
- all six dedicated profiles are available and read-only
- no separate `hokage.toml` exists; the parent process assumes the Hokage role
- Kakashi emits one non-solution guidance packet derived from the shared source
- Yamato returns `pass` before fan-out and produces a final safety report
- all four candidates receive the same source, guidance, and safety hashes
- every candidate attests to no blind-phase supervisor content contact
- no candidate sees peers before the commit barrier
- acceptance criteria exist before fan-out and bind to `loop_control_fit`
- the reveal bytes are identical for every candidate
- opaque original/revision thread-handle hashes match for each candidate
- every revision has a traceable experience-transfer ledger
- all nine immutable protocol checkpoints are present, ordered, and linked to
  their immediate predecessor
- the safety report binds the preserved `reconcile` checkpoint before Hokage
  synthesis
- shared sources retain one independence key rather than inflating consensus
- Kakashi records bounded anti-groupthink and minority-preservation checks
- Hokage synthesis traces material claims back to revisions and evidence
- consequential Olga QA is role-blind and every failure is reproducible
- missing Kakashi, Yamato, or candidate profiles are not replaced by a generic
  worker
- result status respects quorum and unresolved minority evidence
- `$naruto` does not inherit provider, upload, write, push, install, or delete
  permission
- previous passes are rechecked for regressions after the one revision
- the run stops after one reveal/revision cycle and never opens a second panel

If same-thread follow-up or the dedicated profiles are unavailable in the
target runtime, the correct result is `blocked`.

## Safety Boundaries

- Candidates, Kakashi, and Yamato are read-only.
- Candidate agents cannot spawn children or research outside the common packet.
- Missing dedicated agents cannot be replaced by `default`, `worker`, or
  `explorer` profiles.
- Kakashi guidance cannot recommend or rank a solution, vary by candidate, or
  introduce evidence absent from the common packet.
- Yamato cannot inspect solution content, coach candidates, or raise the result
  ceiling; mismatched supervision packets or unverifiable safety state block.
- `$naruto` grants no provider, API, MCP, cost, upload, publishing, file-write,
  push, destructive-action, install, delete, or project-memory permission.
- Any later execution leaves deliberation mode and re-enters the target
  project's normal approval and safety route.
- Raw chain-of-thought, private scratchpads, and debate transcripts are not
  protocol artifacts.

## Distribution Note

Current OpenAI documentation treats a skill folder as the authoring format and
recommends plugins for broad installable distribution. This repository remains
a transparent standalone skill package because its six project/user custom
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
