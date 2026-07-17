# Naruto Deliberation Protocol

## Contents

1. Purpose
2. Research basis
3. State machine
4. Loop Protocol integration
5. Blind commit barrier
6. Reveal and revision
7. Reconciliation
8. Quorum and failure handling
9. Safety and observability

## Purpose

This protocol implements a request-only deliberation adapter under Oskar. Four
different candidate agents solve one identical complete problem, inspect the
same committed peer artifacts once, revise their own solution in the same
thread, and return evidence for a final synthesis.

The design seeks useful diversity without free-form swarm behavior. It is not
a voting system, autonomous execution engine, hidden chain-of-thought exchange,
or replacement for the normal pipeline.

Its non-negotiable learning shape follows the user's Volume 35-inspired
analogy: distinct agents practice the same complete problem, preserve their
independent attempts behind a barrier, receive one common evidence transfer,
and revise inside their original threads. The skill borrows only that abstract
learning mechanism, not franchise text, dialogue, visual identity, or lore.

## Research Basis

The local design assimilates, rather than directly adopts, these public ideas:

- Self-Consistency: sample multiple reasoning paths and select by answer
  consistency, adapted here to method diversity plus evidence rather than
  hidden reasoning-path voting: https://arxiv.org/abs/2203.11171
- Multi-Agent Debate: agents can improve after exposure to other answers,
  adapted here to one bounded reveal/revision cycle with no conversational
  transcript: https://arxiv.org/abs/2305.14325
- Mixture-of-Agents: aggregate outputs from multiple agents, adapted here to a
  local moderator and Oskar synthesis without provider infrastructure:
  https://arxiv.org/abs/2406.04692
- Voting or Consensus?: voting and deliberative consensus have different
  failure modes, motivating explicit evidence and minority preservation:
  https://aclanthology.org/2025.findings-acl.606/

Related implementations reviewed for architecture patterns include
`togethercomputer/MoA`, `deeplearning-wisc/debate-or-vote`,
`yuchenlin/LLM-Blender`, `Multi-Agent-LLMs/MALLM`, and
`Skytliang/Multi-Agents-Debate`.

The production expansion also reviewed `wan-huiyan/agent-review-panel`, Claude
Council Skill, `Imbad0202/agent-council`, `Yeachan-Heo/oh-my-codex`,
`kstevica/captain-claw`, and `the-open-engine/zeroshot`. Only small mechanisms
compatible with the existing Naruto shape were assimilated:

- phase-integrity evidence instead of a new orchestration platform
- pre-reveal self-audit and blind evidence review instead of extra debate rounds
- same-thread experience-transfer records instead of shared free-form memory
- evidence-lineage checks, quick-surrender detection, and minority preservation
- traceable Oskar synthesis plus role-blind, reproducible Olga QA

Adopted patterns:

- sealed independent candidates
- one moderator-mediated reveal
- structured cross-review and revision
- evidence-based synthesis
- explicit activation and bounded runtime
- measurable packet, phase, and output hashes
- explicit same-thread provenance through opaque runtime-handle hashes
- evidence independence counted by source lineage, not agent count
- bounded groupthink and performative-dissent checks

Rejected patterns:

- free-form all-to-all chat
- unlimited debate rounds
- majority vote as truth
- shared memory before commit
- trained ranker dependency
- raw provider frameworks or SDK adoption
- live agent-to-agent communication, voting platforms, and persistent council memory
- sixteen-phase review pipelines or additional automatic critic rounds
- persona imitation or copied franchise dialogue

Character names are internal method labels only. Do not copy dialogue, lore,
visual identity, logos, artwork, or imply official association.

## State Machine

Use these phases in order:

```text
inactive
  -> packet_build
  -> blind_candidates
  -> commit_barrier
  -> reveal
  -> same_thread_revision
  -> moderation_reconcile
  -> oskar_synthesis
  -> olga_qa (when required)
  -> closed
```

Allowed terminal exits from any active phase are `blocked` and
`structured_dispute`. Do not skip from blind candidates directly to synthesis.
Maintain `protocol_run_manifest.v1` as a local sidecar across the phases. It is
not a new phase and is excluded from the common source packet hash. Append a
canonical checkpoint hash after packet, barrier, reveal, revision, reconcile,
synthesis, and QA. Kakashi binds its report to the reconcile checkpoint; the
final consensus binds to the post-QA manifest hash and moderator report hash.

## Loop Protocol Integration

The Naruto state machine is a bounded projection of the workspace Loop
Protocol. Oskar opens `loop_control_fit` before fan-out and owns its stop
decision. Hipson may compile the checklist and packet; Olga evaluates evidence
when QA is required. No Naruto candidate becomes a loop owner.

| Loop phase | State-machine evidence |
|---|---|
| brief | normalized task, objective, constraints, and exclusions |
| checklist | acceptance criteria and evidence requirements fixed before source packet hashing |
| execute | four sealed complete candidate artifacts |
| evaluate | valid commit set, hash/schema checks, and criterion findings |
| critique | one common reveal packet with evidence, failures, and questions |
| repair | one same-thread revised solution from every valid candidate |
| repeat | failed criteria and previous passes rechecked by Kakashi/Oskar |
| stop | result ceiling, Olga QA when required, and Oskar stop decision |

The optimizer budget is exactly one reveal/revision cycle. The pre-reveal
technical retry is a transport recovery and does not consume or extend that
budget. A failed post-revision criterion cannot trigger a second reveal or a
fresh replacement panel. Preserve the dispute or blocker and state the exact
resolution need.

### Packet Build

Oskar owns the task. Hipson compiles one source packet. Eryk verifies current
facts when required. The packet is complete enough that every candidate can
solve the whole task without hidden parent context.

Acceptance criteria are the loop checklist. Each required criterion names its
evidence and pass condition before the packet hash is calculated.

Assign every source an `independence_key`. Different summaries, excerpts, or
candidate citations derived from one underlying source share one key. Four
agents repeating one source are one evidence lineage, not four confirmations.

Do not put method instructions inside the common packet. Bind the common packet
hash and a separate method-profile ID in each candidate envelope.

### Blind Candidates

Start all four dedicated candidate profiles with independent threads. Provide
the same common packet bytes and candidate output schema. Do not provide peer
names, status, output snippets, ranking hints, or a preferred answer.

Method diversity is legitimate. Task, sources, constraints, acceptance
criteria, and evidence rules are not allowed to differ.

Every candidate classifies claim evidence, records its independence keys and a
falsification check, then completes a concise pre-reveal self-audit naming its
least defensible claim and likely blind spot. This is structured output, not a
request for hidden reasoning.

## Blind Commit Barrier

A commit is valid only when:

- `source_packet_sha256` equals the parent packet hash
- `candidate_id` matches the dedicated runtime profile
- the output solves the complete task
- all required concise fields are present
- claim evidence classes, independence keys, falsification checks, and the
  pre-reveal self-audit are present
- protected boundaries pass
- no raw reasoning transcript appears
- `candidate_output_sha256` matches the canonical concise output

One technical retry is allowed before reveal for malformed transport, missing
required fields, or recoverable output truncation. A retry receives the same
packet and cannot see peer material.

Do not reveal until all four commits are valid or the retry policy is exhausted.
An early finisher remains sealed. Completion order is never shown to peers and
never used as a quality signal.

## Reveal And Revision

Kakashi receives committed artifacts only after the barrier. Kakashi builds a
claim/evidence matrix and one common reveal packet. The reveal packet must not
identify a preferred candidate, include raw chain-of-thought, or add new source
evidence unavailable to the candidates.

Kakashi counts independent source lineages and runs bounded anti-groupthink
checks. Unsupported majority agreement, shared-source-only convergence,
position changes without evidence, quick surrender, authority submission, and
lost critical minorities lower the result ceiling. Unsupported or factually
incorrect opposition is also flagged; disagreement is not rewarded merely for
being different.

For each failed, partial, or unverifiable criterion, Kakashi records evidence,
severity, root cause, and loopback target. A vague request to "improve" is not a
valid repair instruction.

Send exactly the same reveal packet to the same four candidate threads. Each
candidate produces a full revised solution, not a critique memo. Revision must
record adopted findings, evidence-backed rejections, changed claims, unchanged
claims, unresolved disputes, and `experience_transfer` with a claim-by-claim
change map and evidence delta.

If same-thread follow-up is unavailable, stop. Recreating an agent after reveal
would contaminate the blind/revision identity contract.
The parent records a SHA-256 hash of the candidate thread's opaque runtime
handle at original commit and revision. The hashes must match. Missing,
unverifiable, or unequal hashes block the run; never store a raw thread ID.

## Reconciliation

Kakashi validates revisions and prepares a final matrix. Kakashi may identify
agreement and conflict but may not choose the final route.

Reconciliation reruns failed criteria and protects every previous pass. Record
new regressions and whether the revision produced material improvement. Do not
convert a regression into consensus merely because more candidates now agree.

Kakashi verifies every experience-transfer ledger against the original claim,
common reveal hash, revised claim, and same-thread proof. A change without new
evidence or a corrected assumption is not automatically improvement. Preserve
material unchanged claims as evidence that a candidate considered and rejected
peer feedback, not as a failure to conform.

Oskar applies claim-appropriate authority:

- canonical workspace files govern workspace policy
- current primary or official sources govern external current facts
- deterministic tests govern observed runtime behavior
- well-supported minority evidence outweighs unsupported agreement
- unsupported expert agreement remains provisional

The synthesis must preserve the strongest unresolved objection and name the
test, source, or user decision that would resolve it.

Oskar records synthesis provenance from final claims back to revision claim IDs
and evidence. Any critical or major claim introduced by Oskar must be verified,
demoted, or rejected before delivery. For consequential results Olga receives
only the final artifact, criteria, and evidence, without candidate identities,
role prestige, completion order, or vote counts. Every QA failure must include
an observable mismatch and reproducible next check.

## Quorum And Failure Handling

| Condition | Maximum result |
|---|---|
| 4 valid commits and revisions, evidence complete | `verified_consensus` |
| 3 valid candidates after one pre-reveal retry | `provisional_consensus` or `structured_dispute` |
| Fewer than 3 valid candidates | `blocked` |
| Kakashi unavailable | `blocked` |
| Same-thread revision unavailable | `blocked` |
| Reveal bytes differ between valid candidates | `blocked` |
| Same-thread runtime-handle hashes differ or are unverifiable | `blocked` |
| Critical evidence-backed objection unresolved | `structured_dispute` |
| Critical agreement depends on one shared lineage only | at most `provisional_consensus` |
| Unsupported critical or major Oskar-introduced claim | at most `provisional_consensus` |
| Consequential Olga QA missing or non-reproducible | `blocked` |
| Required protected action lacks permission | `blocked` |

Runtime timeout and token controls come from the normal Codex task router,
token-economy pipeline, and parent runtime. Do not hardcode arbitrary seconds or
token limits inside this skill. A timeout is partial evidence, not a vote.

## Safety And Observability

Record only concise protocol artifacts:

- source packet hash
- candidate and revision output hashes
- phase transitions
- valid/invalid/timeout state per candidate
- claim/evidence/dispute matrix
- result status
- runtime/context usage when available
- QA and stop decision
- acceptance-matrix results and regression evidence
- iteration count, hard-stop reason, and material-improvement status
- opaque same-thread handle hashes and byte-identical reveal hash
- experience-transfer claim map and evidence deltas
- evidence-independence and anti-groupthink findings
- synthesis provenance and reproducible QA findings

Never record raw chain-of-thought, private scratchpads, full debate transcripts,
secrets, credentials, or provider data. The protocol is read-only. Any later
execution must leave Naruto mode and enter the normal gated route.
