---
name: naruto
description: Request-only blind multi-agent deliberation for difficult creative, technical, governance, or decision-support tasks. Use only when the current user message begins with the exact case-sensitive first token `$naruto`; never invoke implicitly, from an alias, from quoted/code text, or merely because a task is complex. Runs four distinct read-only candidate agents on the same complete task, one moderated reveal and revision cycle, then Oskar synthesis and evidence-based QA.
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

## Required Run

### 1. Normalize The Task

Oskar removes only the exact activation token and preserves the user's task.
Resolve scope ambiguities only when they make safe deliberation impossible.
Select the smallest normal task/model route capable of running the protocol.

### 2. Build One Shared Evidence Packet

Use Hipson to compile the packet and Eryk to verify current or external facts
when those facts matter. Finish and close those preparatory agents before the
candidate phase so runtime capacity remains bounded.

Create `source_evidence_packet` from `templates/source-packet.md`. It must
contain the complete task, source inventory, constraints, protected boundaries,
acceptance criteria, evidence rules, output schema, and canonical SHA-256.

Canonicalize as UTF-8 JSON with recursively sorted object keys, preserved array
order, LF line endings, and no volatile timestamps. Candidate method profiles
are recorded separately and are not part of the common packet hash.

If a required evidence gap remains, expose the same gap to all candidates.
Do not let one candidate privately gain a different source set.

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

### 4. Enforce The Commit Barrier

Require each candidate to return:

- candidate ID
- common source packet hash
- full solution
- assumptions and evidence references
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
- missing evidence
- questions every candidate must resolve

Do not include raw chain-of-thought or a conversational debate transcript.

### 6. Revise In The Same Four Threads

Send the identical reveal packet back to the same four candidate threads. Each
candidate returns one complete revised solution and records:

- adopted peer findings
- rejected peer findings with evidence
- changed and unchanged claims
- remaining disputes

If the runtime cannot re-contact the same open candidate threads, stop as
`blocked`. Do not respawn replacements and pretend learning occurred.

### 7. Reconcile And Synthesize

Send the four revisions to the same Kakashi thread for the final
claim/evidence/dispute matrix. Then close all five Naruto agents before opening
Olga when QA is required.

Oskar synthesizes the final result. Evidence authority depends on the claim:

1. Workspace policy questions: canonical workspace source of truth first.
2. Current external facts: current official or primary sources first.
3. Runtime behavior: deterministic tests prove observations, not policy.
4. Expert agreement without evidence remains weak evidence.

Speed, majority, verbosity, confidence prose, and charisma never decide. A
critical evidence-backed minority objection prevents `verified_consensus`
until resolved.

### 8. Classify The Result

Use exactly one result:

- `verified_consensus`: four valid revisions, required evidence is present,
  critical objections are resolved, and the solution passes its checks.
- `provisional_consensus`: useful convergence exists, but only three valid
  candidates remain or a non-critical evidence gap is unresolved.
- `structured_dispute`: two or more evidence-backed options remain materially
  incompatible. Preserve the dispute and state what would resolve it.
- `blocked`: fewer than three valid candidates, Kakashi unavailable, same-thread
  revision unavailable, required evidence inaccessible, or a protected gate
  prevents the next step.

Four valid candidates are mandatory for `verified_consensus`. After one
pre-reveal technical retry, three may yield only `provisional_consensus` or
`structured_dispute`. Fewer than three blocks.

### 9. Stop

Run only one reveal/revision cycle. Do not automatically launch a second Naruto
run. Return to the normal Loop Protocol only for a concrete implementation or
repair with its own owner, acceptance test, and stop condition.

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
- Use the matching file in `templates/` for every protocol artifact.
- Run `node scripts/validate-naruto.mjs` after changing this skill, its agents,
  fixtures, global routing guard, or runtime profiles.

## Done When

The exact trigger is proven, all required packet hashes and barriers are valid,
four complete methods were independently attempted, one same-thread revision
cycle completed, evidence and minority objections were reconciled, Oskar issued
one explicit result status, required QA passed, and no permission or normal
routing boundary was changed.
