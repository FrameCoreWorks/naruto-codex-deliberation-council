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

This protocol implements a request-only deliberation adapter under Hokage,
publicly identified as Tsunade Senju in the parent Codex process. Four
independent shadow-clone training instances share one Naruto actor identity but
use four different, fixed methods. Each solves the same complete problem,
inspects the same committed peer artifacts once, revises its own solution in
the same thread, and returns evidence for one accumulated synthesis.

The design seeks useful diversity without free-form swarm behavior. It is not
a voting system, autonomous execution engine, hidden chain-of-thought exchange,
or replacement for the normal pipeline.

Its non-negotiable learning shape follows the user's Volume 35-inspired
analogy: one learner practices the same complete problem through four parallel
training paths, preserves the attempts behind a barrier, receives one common
evidence transfer, and revises inside the original threads. The skill borrows
only that abstract learning mechanism, not franchise text, dialogue, visual
identity, or lore.

## Research Basis

The local design assimilates, rather than directly adopts, these public ideas:

- Self-Consistency: sample multiple reasoning paths and select by answer
  consistency, adapted here to method diversity plus evidence rather than
  hidden reasoning-path voting: https://arxiv.org/abs/2203.11171
- Multi-Agent Debate: agents can improve after exposure to other answers,
  adapted here to one bounded reveal/revision cycle with no conversational
  transcript: https://arxiv.org/abs/2305.14325
- Mixture-of-Agents: aggregate outputs from multiple agents, adapted here to a
  local moderator and Hokage synthesis without provider infrastructure:
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
- traceable Hokage synthesis plus role-blind, reproducible final QA

Adopted patterns:

- sealed independent training instances with one shared actor identity
- four explicit method assignments fixed before fan-out
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

Method labels are functional, not character personas. Do not copy dialogue,
lore, visual identity, logos, artwork, or imply official association.

## State Machine

Use these phases in order:

```text
inactive
  -> packet_build
  -> training_control
  -> blind_instances
  -> commit_barrier
  -> reveal
  -> same_thread_revision
  -> moderation_reconcile
  -> safety_report
  -> hokage_synthesis
  -> final_qa (when required)
  -> closed
```

Allowed terminal exits from any active phase are `blocked` and
`structured_dispute`. Do not skip from blind instances directly to synthesis.
Maintain `protocol_run_manifest.v1` as a local sidecar across the phases. It is
excluded from the common source packet hash. Preserve one immutable
`protocol_checkpoint.v1` after packet, training control, barrier, reveal,
revision, reconcile, safety report, synthesis, and QA. Each checkpoint contains
the projected manifest snapshot and previous-checkpoint digest; the manifest
stores its hash. Kakashi's moderator report digest is present before the
reconcile checkpoint. Yamato binds its safety report to that checkpoint. The
final consensus binds to the post-QA manifest, moderator report, and safety
report hashes.

## Loop Protocol Integration

The Naruto state machine is a bounded projection of the workspace Loop
Protocol. Hokage opens `loop_control_fit` before fan-out and owns its stop
decision. A host-provided `evidence_packet_builder` may compile the checklist
and packet; an independent `final_qa` reviewer evaluates evidence when QA is
required. No Naruto training instance becomes a loop owner.

| Loop phase | State-machine evidence |
|---|---|
| brief | normalized task, objective, constraints, and exclusions |
| checklist | acceptance criteria fixed, common guidance created, and Yamato safety control passed before fan-out |
| execute | four sealed complete candidate-solution artifacts from one shared identity |
| evaluate | valid commit set, hash/schema checks, and criterion findings |
| critique | one common reveal packet with evidence, failures, and questions |
| repair | one same-thread revised solution from every valid training instance |
| repeat | failed criteria and previous passes rechecked by Kakashi/Hokage |
| stop | result ceiling, independent final QA when required, and Hokage stop decision |

The optimizer budget is exactly one reveal/revision cycle. The pre-reveal
technical retry is a transport recovery and does not consume or extend that
budget. A failed post-revision criterion cannot trigger a second reveal or a
fresh replacement panel. Preserve the dispute or blocker and state the exact
resolution need.

### Packet Build

Hokage owns the task and one source packet. Optional host-provided
`evidence_packet_builder` and `source_verifier` roles may compile the packet and
verify current facts when required. The packet is complete enough that every training instance can
solve the whole task without hidden parent context.

Acceptance criteria are the loop checklist. Each required criterion names its
evidence and pass condition before the packet hash is calculated.

Assign every source an `independence_key`. Different summaries, excerpts, or
instance citations derived from one underlying source share one key. Four
training instances repeating one source are one evidence lineage, not four
confirmations.

Do not put private method instructions inside the common packet. Build one
byte-identical `method_matrix.v1` from the canonical manifest, with the shared
`naruto_uzumaki` identity, four unique instance IDs, and four unique method
profile IDs fixed before fan-out. Bind the common packet, matrix, and guidance
hashes plus one matrix assignment in each training-instance envelope.

The packet also fixes the supervision contract: common non-solution guidance,
byte identity, no instance-specific blind-phase coaching, required Yamato
access to the full final source packet plus its verified hash, required Yamato
preflight, and one permitted common-packet repair after a `hold`.

### Training Control

Hokage starts Kakashi with the final source packet, canonical method matrix, and
no solution output. Kakashi derives one `training_guidance_packet.v1` that
restates only the common
objective, acceptance observables, evidence discipline, falsification targets,
protected boundaries, full-solution requirement, and stop conditions. It must
not recommend an answer, rank methods, add evidence, or tailor a message.

Yamato receives that guidance, the full final `source_evidence_packet.v1`, the
byte-identical method matrix, and all four routing envelopes. Yamato recomputes
their digests and checks the shared actor identity, unique instance IDs, unique
fixed method IDs, envelope difference allowlist, and protected boundaries. A
missing artifact, mismatched hash, foreign identity, duplicate assignment, or
unlisted envelope difference blocks. Yamato then returns
`safety_control_packet.v1` with `pass`, `hold`, or `blocked`.
Training-instance fan-out requires `pass`. One `hold` may return to Hokage for a
bounded common-artifact repair; a second non-pass result or any solution
direction blocks the run.

Hash the matrix, envelopes, and both supervision packets and record the common
digests in the run manifest. Send byte-identical common artifacts to all four
training instances; only the allowlisted routing fields differ by envelope.
Kakashi and Yamato remain open, but neither may send instance-specific content
feedback during blind work. Yamato may
receive phase metadata and protected-boundary attestations only.

### Blind Shadow-Clone Instances

Start all four dedicated training-instance profiles with independent threads.
Provide the same source, method-matrix, training-guidance, and safety-control
bytes plus the candidate output schema and the instance's allowlisted envelope.
Do not provide peer status, output snippets, ranking hints, a preferred answer,
or private supervisor content.

Method diversity is legitimate. Task, sources, constraints, acceptance
criteria, and evidence rules are not allowed to differ.

Every training instance classifies claim evidence, records its independence keys and a
falsification check, then completes a concise pre-reveal self-audit naming its
least defensible claim and likely blind spot. This is structured output, not a
request for hidden reasoning.

## Blind Commit Barrier

A commit is valid only when:

- `source_packet_sha256` equals the parent packet hash
- `actor_identity_id` is exactly `naruto_uzumaki`
- `method_matrix_sha256` equals the common matrix hash
- `training_instance_envelope_sha256` matches the dedicated envelope
- `candidate_id` and `method_profile_id` match the envelope and matrix
- `training_guidance_packet_sha256` and `safety_control_packet_sha256` equal the
  common supervision hashes
- the output solves the complete task
- all required concise fields are present
- claim evidence classes, independence keys, falsification checks, and the
  pre-reveal self-audit are present
- protected boundaries pass
- `no_blind_phase_supervisor_contact_attestation` is true
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
identify a preferred solution, include raw chain-of-thought, or add new source
evidence unavailable to the training instances.

Kakashi counts independent source lineages and runs bounded anti-groupthink
checks. Unsupported majority agreement, shared-source-only convergence,
position changes without evidence, quick surrender, authority submission, and
lost critical minorities lower the result ceiling. Unsupported or factually
incorrect opposition is also flagged; disagreement is not rewarded merely for
being different.

For each failed, partial, or unverifiable criterion, Kakashi records evidence,
severity, root cause, and loopback target. A vague request to "improve" is not a
valid repair instruction.

Send exactly the same reveal packet to the same four training-instance threads.
Each instance produces a full revised solution, not a critique memo. Revision
must record adopted findings, evidence-backed rejections, changed claims,
unchanged claims, unresolved disputes, and `experience_transfer` with a
claim-by-claim change map and evidence delta.

If same-thread follow-up is unavailable, stop. Recreating an instance after
reveal would contaminate the blind/revision identity contract. The actor
identity, instance ID, method assignment, matrix hash, and envelope hash cannot
change. The parent records a SHA-256 hash of the instance thread's opaque runtime
handle at original commit and revision. The hashes must match. Missing,
unverifiable, or unequal hashes block the run; never store a raw thread ID.

## Reconciliation

Kakashi validates revisions and finalizes `moderator_report.v1`. Kakashi may
identify agreement and conflict but may not choose the final route. Record its
digest in the manifest and preserve the `reconcile` checkpoint. Yamato receives
that checkpoint plus final guidance-integrity, phase-order, forbidden-action,
and boundary metadata, then emits `safety_report.v1`; it never inspects or edits
solution content. Record the safety digest and preserve the `safety_report`
checkpoint before Hokage synthesis.

Reconciliation reruns failed criteria and protects every previous pass. Record
new regressions and whether the revision produced material improvement. Do not
convert a regression into consensus merely because more instances now agree.

Kakashi verifies every experience-transfer ledger against the original claim,
common reveal hash, revised claim, and same-thread proof. A change without new
evidence or a corrected assumption is not automatically improvement. Preserve
material unchanged claims as evidence that an instance considered and rejected
peer feedback, not as a failure to conform.

Hokage applies claim-appropriate authority:

- canonical workspace files govern workspace policy
- current primary or official sources govern external current facts
- deterministic tests govern observed runtime behavior
- well-supported minority evidence outweighs unsupported agreement
- unsupported expert agreement remains provisional

The synthesis must preserve the strongest unresolved objection and name the
test, source, or user decision that would resolve it.

Hokage records synthesis provenance from final claims back to revision claim IDs
and evidence. Any critical or major claim introduced by Hokage must be verified,
demoted, or rejected before delivery. For consequential results the independent final QA reviewer receives
only the final artifact, criteria, and evidence, without training-instance
identities, role prestige, completion order, or vote counts. Every QA failure
must include an observable mismatch and reproducible next check.

## Quorum And Failure Handling

| Condition | Maximum result |
|---|---|
| 4 valid commits and revisions, evidence complete | `verified_consensus` |
| 3 valid training instances after one pre-reveal retry | `provisional_consensus` or `structured_dispute` |
| Fewer than 3 valid training instances | `blocked` |
| Kakashi unavailable | `blocked` |
| Yamato unavailable or preflight not `pass` | `blocked` |
| Yamato lacks the full final source packet or its hash does not match | `blocked` |
| Method matrix has a foreign identity, duplicate instance ID, or duplicate method ID | `blocked` |
| A method assignment changes after fan-out | `blocked` |
| Training-instance envelope differs outside the allowlist | `blocked` |
| Guidance contains solution direction or differs by instance | `blocked` |
| Instance-specific blind-phase supervisor contact | `blocked` |
| Protected-boundary or phase-integrity supervision failure | `blocked` |
| Same-thread revision unavailable | `blocked` |
| Reveal bytes differ between valid training instances | `blocked` |
| Same-thread runtime-handle hashes differ or are unverifiable | `blocked` |
| Critical evidence-backed objection unresolved | `structured_dispute` |
| Critical agreement depends on one shared lineage only | at most `provisional_consensus` |
| Unsupported critical or major Hokage-introduced claim | at most `provisional_consensus` |
| Consequential final QA missing or non-reproducible | `blocked` |
| Required protected action lacks permission | `blocked` |

Runtime timeout and token controls come from the normal Codex task router,
token-economy pipeline, and parent runtime. Do not hardcode arbitrary seconds or
token limits inside this skill. A timeout is partial evidence, not a vote.

## Safety And Observability

Record only concise protocol artifacts:

- source packet hash
- method matrix and training-instance envelope hashes
- training guidance, safety control, and final safety report hashes
- candidate-solution and revision output hashes
- phase transitions
- valid/invalid/timeout state per training instance
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
- supervision status, hold count, no-contact attestations, and result-ceiling
  effects
- all nine immutable checkpoint artifacts and their previous-checkpoint chain

Never record raw chain-of-thought, private scratchpads, full debate transcripts,
secrets, credentials, or provider data. The protocol is read-only. Any later
execution must leave Naruto mode and enter the normal gated route.
