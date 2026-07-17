---
name: naruto
description: Request-only blind multi-agent deliberation for difficult creative, technical, governance, or decision-support tasks. Use only when the current user message begins with the exact case-sensitive first token `$naruto`; never invoke implicitly, from an alias, from quoted/code text, or merely because a task is complex. Runs four distinct read-only candidate agents on the same complete task, one moderated reveal and same-thread repair cycle, then Oskar synthesis, evidence-based QA, regression checking, and a bounded Loop Protocol stop decision.
---

# Naruto Deliberation

Use this skill as a bounded comparison-and-verification layer under Oskar. It
does not replace normal routing, split a task into subtasks, grant permissions,
or create a second orchestrator.

## Activation Contract

Activate only when all conditions hold:

1. The current user message's first non-empty token is exactly `$naruto`.
2. The token is case-sensitive and separated from the task by whitespace.
3. The token is not quoted, escaped, inside inline/fenced code, or preceded by
   a list marker or other text.
4. A task remains after the token. If it does not, ask for the task and stop.

Reject aliases and near matches, including `naruto`, `$Naruto`, `$NARUTO`,
`$naruto:`, `use naruto`, and a later mention of `$naruto` in prose. Never
activate from prior turns, Memory Cache, a fixture, or an agent suggestion.

## Ownership And Boundaries

- Oskar remains the only workflow orchestrator and final synthesizer.
- Oskar owns `loop_control_fit`, the acceptance checklist, loop state, loopback,
  and the final stop decision. Naruto does not create a second loop owner.
- The normal task router remains authoritative before and after deliberation.
- Naruto, Sasuke, Shikamaru, and Sakura are candidate agents. Each solves the
  same complete task independently through a different method.
- Kakashi is a moderator only. Kakashi enforces the commit barrier, prepares
  the reveal packet, and records agreements and disputes. Kakashi does not
  submit a fifth candidate answer or select the winner.
- Olga performs final QA when the result affects implementation, workflow
  governance, external execution, or another consequential decision.
- Candidate agents are read-only and cannot spawn children, edit files, run
  providers, upload, push, install, delete, write Memory Cache, or execute the
  proposed solution.
- `$naruto` grants no provider activation, cost approval, upload approval,
  destructive-action approval, or other permission. Later execution returns
  to the normal route and re-checks every current-turn gate.

## Core Learning Invariant

Preserve the user's Volume 35-inspired training concept without copying story
text or roleplaying the franchise: four distinct agents independently practice
the same complete task, all blind work is sealed, one shared evidence packet is
revealed, and every original agent thread updates its own complete solution.
Only then may Kakashi reconcile and Oskar synthesize. Splitting the problem into
four different subtasks, letting agents communicate before commit, or respawning
fresh agents after reveal breaks the learning mechanism and invalidates the run.

## Loop Protocol Integration

Naruto uses the workspace Loop Protocol as one bounded evaluator-optimizer
cycle. It does not add a second debate round or a second automatic panel run.

| Loop Protocol phase | Naruto phase |
|---|---|
| brief | normalized user task and shared source inventory |
| checklist | source packet acceptance criteria fixed before hashing |
| execute | four blind complete candidate solutions |
| evaluate | commit barrier, schema/hash checks, and Kakashi evidence matrix |
| critique | one byte-identical reveal packet with criterion gaps |
| repair | one complete revision in the same four candidate threads |
| repeat | rerun failed criteria and regression checks during reconciliation |
| stop | Olga QA when required and Oskar's explicit stop decision |

Set `max_iterations: 1` for the Naruto optimizer iteration. The one permitted
pre-reveal technical retry repairs malformed transport or truncation and does
not count as another optimizer iteration. Never continue merely because a
different or more polished answer might be possible.

## Required Run

### 1. Normalize The Task

Oskar removes only the exact activation token and preserves the user's task.
Resolve scope ambiguities only when they make safe deliberation impossible.
Select the smallest normal task/model route capable of running the protocol.
Open `loop_control_fit` with the objective, exclusions, checklist version,
`max_iterations: 1`, hard stop conditions, and forbidden regressions.

### 2. Build One Shared Evidence Packet

Use Hipson to compile the packet and Eryk to verify current or external facts
when those facts matter. Finish and close those preparatory agents before the
candidate phase so runtime capacity remains bounded.

Create `source_evidence_packet` from `templates/source-packet.md`. It must
contain the complete task, source inventory, constraints, protected boundaries,
acceptance criteria, loop-control binding, evidence rules, output schema, and
canonical SHA-256. Acceptance criteria are the loop checklist and must exist
before candidate execution.

Assign one `independence_key` to every underlying source. Mirrors, summaries,
or excerpts derived from the same underlying source reuse that key. Candidate
count never increases evidence independence.

Canonicalize as UTF-8 JSON with recursively sorted object keys, preserved array
order, LF line endings, and no volatile timestamps. Candidate method profiles
are recorded separately and are not part of the common packet hash.

If a required evidence gap remains, expose the same gap to all candidates.
Do not let one candidate privately gain a different source set.
Create `protocol_run_manifest.v1` from
`templates/protocol-run-manifest.md` as a local runtime sidecar. Keep it outside
the common packet hash and store only hashes of opaque runtime handles. Append
canonical checkpoint hashes after every completed phase.

### 3. Run Four Blind Complete Solutions

Open the four dedicated runtime agents with the same packet hash:

| Runtime agent | Method lens |
|---|---|
| `naruto_uzumaki` | Integrative and practical: maximize user value and find a workable synthesis. |
| `sasuke_uchiha` | Adversarial and risk-first: attack assumptions, failure modes, and hidden costs. |
| `shikamaru_nara` | Systems and efficiency: map dependencies, simplify the route, and protect maintainability. |
| `sakura_haruno` | Empirical and implementation-focused: require testability, evidence, and operational quality. |

Each agent must return a full `candidate_solution`, not a subtask, critique-only
note, or roleplay. Do not reveal peer outputs, completion status, or partial
conclusions before all valid candidates commit or the pre-reveal retry policy
is exhausted.

Every claim must identify its evidence class, source independence keys, and a
falsification check. Each agent also returns a concise pre-reveal self-audit of
its strongest claim, least defensible claim, likely failing assumption, and
possible blind spot. This is not a request for raw reasoning.

### 4. Enforce The Commit Barrier

Require each candidate to return:

- candidate ID
- common source packet hash
- full solution
- assumptions and evidence references
- claim evidence classes, independence keys, and falsification checks
- concise pre-reveal self-audit
- tests or verification plan
- risks and uncertainty
- protected-boundary check
- `no_raw_cot_attestation: true`
- a hash of its concise candidate output

Reject hash mismatch, missing full solution, raw reasoning traces, forbidden
actions, or peer-dependent output as invalid. Permit one technical retry before
reveal. Never replace a failed dedicated candidate with a generic worker.

### 5. Moderate One Reveal

After the barrier, start `kakashi_hatake` and provide only the four committed
candidate artifacts. Kakashi creates one `reveal_transfer_packet` containing:

- concise candidate solutions
- claim/evidence ledger
- agreements
- conflicts
- critical minority objections
- collective blind spots and evidence-lineage findings
- unsupported convergence, quick surrender, fake dissent, authority submission,
  and factually incorrect opposition checks
- missing evidence
- criterion-level failures with evidence, severity, and root cause
- questions every candidate must resolve

Do not include raw chain-of-thought or a conversational debate transcript.

### 6. Revise In The Same Four Threads

Send the identical reveal packet back to the same four candidate threads. Each
candidate returns one complete revised solution and records:

- adopted peer findings
- rejected peer findings with evidence
- changed and unchanged claims
- remaining disputes
- failed criteria addressed, evidence delta, and regression risks
- an `experience_transfer` claim map showing what changed, why, and which peer
  claims or evidence were adopted or rejected

If the runtime cannot re-contact the same open candidate threads, stop as
`blocked`. Do not respawn replacements and pretend learning occurred.
Record a SHA-256 hash of each candidate thread's opaque runtime handle at first
commit and revision. The two hashes must match; missing, unverifiable, or
unequal proofs block the run. Never record the raw handle.

### 7. Reconcile And Synthesize

Send the four revisions to the same Kakashi thread for the final
claim/evidence/dispute matrix. Then close all five Naruto agents before opening
Olga when QA is required.

Kakashi verifies the experience-transfer ledgers, reveal byte identity,
same-thread proofs, evidence independence, and bounded anti-groupthink checks.
Agreement derived from one shared source remains one evidence lineage. Genuine
evidence-backed minority objections are preserved, while unsupported dissent
is rejected rather than rewarded.

Oskar synthesizes the final result. Evidence authority depends on the claim:

1. Workspace policy questions: canonical workspace source of truth first.
2. Current external facts: current official or primary sources first.
3. Runtime behavior: deterministic tests prove observations, not policy.
4. Expert agreement without evidence remains weak evidence.

Speed, majority, verbosity, confidence prose, and charisma never decide. A
critical evidence-backed minority objection prevents `verified_consensus`
until resolved.

Oskar records synthesis provenance from final claims back to revised claim IDs
and evidence. A critical or major claim introduced during synthesis must be
verified, demoted, or rejected; it cannot silently support a verified result.
The final consensus report binds the post-QA protocol manifest hash and Kakashi
moderator report hash.
When Olga QA is required, provide only the final artifact, acceptance criteria,
and evidence. Exclude candidate identities, role prestige, completion order,
and vote counts. Every failed QA finding must include an observable mismatch
and a reproducible next check.

Re-evaluate every required acceptance criterion after revision. Preserve
previous passes, record new regressions, and do not treat agreement as evidence
that a criterion passed.

### 8. Classify The Result

Use exactly one result:

- `verified_consensus`: four valid revisions, required evidence is present,
  critical objections are resolved, and the solution passes its checks.
- `provisional_consensus`: useful convergence exists, but only three valid
  candidates remain or a non-critical evidence gap is unresolved.
- `structured_dispute`: two or more evidence-backed options remain materially
  incompatible. Preserve the dispute and state what would resolve it.
- `blocked`: fewer than three valid candidates, Kakashi unavailable, same-thread
  revision provenance unavailable, reveal bytes differ, consequential Olga QA
  is missing or non-reproducible, required evidence is inaccessible, or a
  protected gate prevents the next step.

Four valid candidates are mandatory for `verified_consensus`. After one
pre-reveal technical retry, three may yield only `provisional_consensus` or
`structured_dispute`. Fewer than three blocks.

### 9. Loopback And Stop

Run only one reveal/revision cycle. At each evaluation point Oskar records one
Loop Protocol decision, and the delivered report ends with one final decision:

- `stop_sufficient`: all critical and major criteria pass, regression is clean,
  and remaining issues do not justify another intervention.
- `patch_one_gap`: exactly one concrete synthesis/report gap has a known root
  cause, bounded repair, and clear acceptance test. Repair it once without
  reopening the panel, rerun the failed check plus regression checks, then issue
  the final decision.
- `ask_user`: a real preference, missing input, protected approval, or material
  tradeoff requires the user.
- `blocked`: quorum, integrity, evidence, same-thread identity, protected
  boundary, or regression prevents a reliable result.

Do not automatically launch a second Naruto run. A substantive unresolved gap
is returned as `structured_dispute`, `ask_user`, or `blocked` with its exact
resolution need. A later run requires a new current user message beginning with
the exact `$naruto` token. Downstream implementation or repair returns to the
normal Loop Protocol with its own owner, acceptance test, and stop condition.

## Runtime Capacity

The documented default supports six open child-agent threads. This protocol
uses no more than five at once: four candidates plus Kakashi. Finish and close
Eryk/Hipson before candidate fan-out; close candidates and Kakashi before Olga.
Never nest candidate spawning.

## Load On Demand

- Read `references/deliberation-protocol.md` for barrier, quorum, reconciliation,
  and failure handling.
- Read `references/contracts-and-schemas.md` before constructing packets.
- Read `references/role-methods.md` before prompting dedicated agents.
- Read `references/examples-and-failure-modes.md` for realistic routes and
  anti-patterns.
- Read `references/prior-art-assimilation.md` when reviewing why a public
  council mechanism was accepted or rejected.
- Use the matching file in `templates/` for every protocol artifact, including
  `protocol-run-manifest.md` for phase-integrity evidence.
- Run `node scripts/validate-naruto.mjs` after changing this skill, its agents,
  fixtures, global routing guard, or runtime profiles.

## Done When

The exact trigger is proven, all required packet hashes and barriers are valid,
four complete methods were independently attempted, one same-thread revision
cycle completed, the acceptance matrix and regression check are evidenced,
the experience-transfer ledger and phase-integrity manifest are valid, evidence
independence and minority objections were reconciled, Oskar synthesis is
traceable, Oskar issued one result and one Loop Protocol stop decision, required
role-blind QA passed, and no permission or normal routing boundary was changed.
