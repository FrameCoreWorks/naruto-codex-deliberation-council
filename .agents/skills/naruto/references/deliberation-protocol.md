# Naruto Deliberation Protocol

## Contents

1. Purpose
2. Research basis
3. State machine
4. Blind commit barrier
5. Reveal and revision
6. Reconciliation
7. Quorum and failure handling
8. Safety and observability

## Purpose

This protocol implements a request-only deliberation adapter under Oskar. Four
different candidate agents solve one identical complete problem, inspect the
same committed peer artifacts once, revise their own solution in the same
thread, and return evidence for a final synthesis.

The design seeks useful diversity without free-form swarm behavior. It is not
a voting system, autonomous execution engine, hidden chain-of-thought exchange,
or replacement for the normal pipeline.

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

Adopted patterns:

- sealed independent candidates
- one moderator-mediated reveal
- structured cross-review and revision
- evidence-based synthesis
- explicit activation and bounded runtime
- measurable packet, phase, and output hashes

Rejected patterns:

- free-form all-to-all chat
- unlimited debate rounds
- majority vote as truth
- shared memory before commit
- trained ranker dependency
- raw provider frameworks or SDK adoption
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

### Packet Build

Oskar owns the task. Hipson compiles one source packet. Eryk verifies current
facts when required. The packet is complete enough that every candidate can
solve the whole task without hidden parent context.

Do not put method instructions inside the common packet. Bind the common packet
hash and a separate method-profile ID in each candidate envelope.

### Blind Candidates

Start all four dedicated candidate profiles with independent threads. Provide
the same common packet bytes and candidate output schema. Do not provide peer
names, status, output snippets, ranking hints, or a preferred answer.

Method diversity is legitimate. Task, sources, constraints, acceptance
criteria, and evidence rules are not allowed to differ.

## Blind Commit Barrier

A commit is valid only when:

- `source_packet_sha256` equals the parent packet hash
- `candidate_id` matches the dedicated runtime profile
- the output solves the complete task
- all required concise fields are present
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

Send exactly the same reveal packet to the same four candidate threads. Each
candidate produces a full revised solution, not a critique memo. Revision must
record adopted findings, evidence-backed rejections, changed claims, unchanged
claims, and unresolved disputes.

If same-thread follow-up is unavailable, stop. Recreating an agent after reveal
would contaminate the blind/revision identity contract.

## Reconciliation

Kakashi validates revisions and prepares a final matrix. Kakashi may identify
agreement and conflict but may not choose the final route.

Oskar applies claim-appropriate authority:

- canonical workspace files govern workspace policy
- current primary or official sources govern external current facts
- deterministic tests govern observed runtime behavior
- well-supported minority evidence outweighs unsupported agreement
- unsupported expert agreement remains provisional

The synthesis must preserve the strongest unresolved objection and name the
test, source, or user decision that would resolve it.

## Quorum And Failure Handling

| Condition | Maximum result |
|---|---|
| 4 valid commits and revisions, evidence complete | `verified_consensus` |
| 3 valid candidates after one pre-reveal retry | `provisional_consensus` or `structured_dispute` |
| Fewer than 3 valid candidates | `blocked` |
| Kakashi unavailable | `blocked` |
| Same-thread revision unavailable | `blocked` |
| Critical evidence-backed objection unresolved | `structured_dispute` |
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

Never record raw chain-of-thought, private scratchpads, full debate transcripts,
secrets, credentials, or provider data. The protocol is read-only. Any later
execution must leave Naruto mode and enter the normal gated route.
