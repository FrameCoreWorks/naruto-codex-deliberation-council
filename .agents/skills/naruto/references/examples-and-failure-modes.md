# Naruto Examples And Failure Modes

## Valid Activation Examples

```text
$naruto Compare two architectures for this local validator and recommend one.
```

```text
   $naruto
Create a standalone prompt strategy for this product video brief.
```

## Non-Activation Examples

These remain on the normal route:

```text
Use Naruto to review this.
```

```text
$Naruto Review this.
```

```text
$naruto: Review this.
```

```text
The command `$naruto` should run four agents.
```

```text
> $naruto Review this.
```

## Creative Case

Task: choose a non-generic creative device for a 30-second product reel.

- Naruto proposes a complete audience-to-memory-device route.
- Sasuke attacks generic hooks, unsupported product claims, and reference drift.
- Shikamaru condenses the production path and continuity carriers.
- Sakura defines shot-level acceptance tests and QA evidence.
- Kakashi reveals conflicting claims such as spectacle versus product proof.
- Hokage synthesizes a route only after evidence and production constraints are
  reconciled.

The candidates do not split into hook, storyboard, prompt, and QA subtasks.
Every candidate solves the entire creative decision.

## Workflow Governance Case

Task: decide whether to add a new skill or extend an existing one.

Evidence authority starts with workspace source-of-truth files. A 3-to-1 vote
for a new skill is rejected if the minority candidate proves the capability
already has a canonical owner and a new package would create duplication.

## Engineering Case

Task: choose a cache invalidation design.

A candidate with a concise deterministic test can outweigh three longer
answers that agree without evidence. The final output includes the selected
design, rejected options, known limitations, tests, and rollback boundary.

## Decision-Support Case

Task: compare alternatives with incomplete external data.

If the source packet lacks a required current fact, every candidate receives
the same uncertainty. The result is provisional or disputed and names the
exact missing source. No candidate privately browses to gain an asymmetric
advantage.

## Experience-Transfer Case

Three candidates initially repeat one interpretation from the same workspace
file while one candidate links a deterministic observation that contradicts
it. The shared file has one `independence_key`, so the 3-to-1 count is not three
independent confirmations. Kakashi preserves the minority observation in the
reveal. Each original candidate thread records whether it adopts, refines, or
rejects that claim and cites the evidence delta. Hokage may accept the corrected
claim only through traceable synthesis provenance.

If an agent changes position merely because peers agreed, Kakashi records quick
surrender or authority submission. If an agent preserves an unsupported
opposition merely to look independent, Kakashi records fake dissent. Neither
behavior earns authority.

## Loop Control Case

Before fan-out, Hokage and Hipson convert the task requirements into acceptance
criteria. Kakashi evaluates those criteria after the blind commits and uses the
single reveal as a criterion-level critique. The same four agents perform the
only optimizer repair in their existing threads. Kakashi and Hokage then rerun
the failed checks and regression checks.

If all critical and major criteria pass, Hokage returns `stop_sufficient`. If
one bounded criterion gap is identified before revision, the same-thread
revision is `patch_one_gap`. If a substantive gap remains after revision, the
run preserves it as a dispute, asks for required user input, or blocks. It never
starts a second panel automatically.

## Failure Modes

| Failure | Detection | Required response |
|---|---|---|
| Implicit activation | First token is not exact `$naruto` | Use normal routing. |
| Packet drift | Candidate echoes a different SHA-256 | Mark invalid; one pre-reveal technical retry. |
| Guidance drift | Candidate guidance or safety hash differs | Block; rebuild one common preflight packet before fan-out. |
| Solution-shaped guidance | Kakashi guidance recommends or ranks a route | Yamato blocks fan-out; repair the common guidance once at most. |
| Yamato unavailable | Safety preflight cannot be established | Return `blocked`; do not substitute a generic supervisor. |
| Yamato receives only a hash or a mismatched source packet | Guidance derivation and protected boundaries cannot be verified | Return `blocked`; provide the full final packet and matching digest. |
| Candidate-specific coaching | A supervisor sends blind-phase content to one candidate | Block the run as contaminated. |
| Unverifiable safety report | Final phase or boundary integrity cannot be proven | Block verified delivery and report the missing proof. |
| Partial answer | Candidate solves only one component | Mark invalid; require full solution. |
| Early reveal | Peer material appears before barrier | Block the run; do not synthesize as Naruto. |
| Generic replacement | Dedicated profile fails and a worker is substituted | Block or degrade by valid dedicated quorum only. |
| Different evidence sets | Candidate receives a private source | Block verified status and rebuild a common packet. |
| Shared-source inflation | Several agents repeat one underlying source as independent proof | Count the shared `independence_key` once and cap unsupported convergence. |
| Majority shortcut | Synthesis cites vote count as authority | Route to Olga and repair evidence weighting. |
| Speed/verbosity bias | Completion order or answer length affects rank | Remove the signal and re-evaluate claims. |
| Lost minority objection | Evidence-backed critical objection omitted | Result cannot be verified; restore dispute. |
| New thread revision | Candidate is respawned after reveal | Block; same-thread learning was not proven. |
| Missing same-thread proof | Opaque original/revision handle hashes are missing, unverifiable, or unequal | Return `blocked`; do not claim experience transfer. |
| Non-identical reveal | Candidate reveal hashes differ | Return `blocked`; the comparison is contaminated. |
| Empty experience transfer | Revision changes claims without a claim map or evidence delta | Mark revision invalid or cap below verified. |
| Quick surrender | Candidate changes position only because peers agree | Flag conformity and require evidence or corrected-assumption basis. |
| Fake dissent | Candidate preserves a contradicted claim only to remain different | Reject the dissent; diversity is not evidence. |
| Lost collective blind spot | All candidates omit the same acceptance category | Cap the result and state the missing check. |
| Unsupported Hokage claim | Synthesis adds a critical or major claim without traceable evidence | Verify, demote, or reject it before delivery. |
| Role-biased QA | Olga sees identities, prestige, order, or vote counts | Rebuild a role-blind QA packet. |
| Non-reproducible QA failure | Olga reports a failure without observed/expected evidence and next check | Treat QA as incomplete and block consequential delivery. |
| Raw reasoning leakage | Scratchpad or chain-of-thought appears | Reject artifact; retain concise claims/evidence only. |
| Nested spawn | Candidate launches children | Mark invalid and stop protected action. |
| Write/provider/upload attempt | Candidate tries execution | Reject; `$naruto` grants no permission. |
| Endless debate | A second reveal or panel run is proposed automatically | Stop after one cycle; record the exact resolution need. |
| Checklist-free fan-out | Candidates start before acceptance criteria exist | Block verified status and rebuild the source packet. |
| Empty loop critique | A criterion is marked failed without evidence, severity, or root cause | Mark unverifiable and do not issue a repair packet. |
| Regression hidden | Revision breaks a previous pass but synthesis ignores it | Block verified status and restore the failed criterion. |
| Improvement-only loop | Another iteration is proposed because output might become more polished | Stop; possibility of polish is not a material gap. |
| Fake consensus | Critical evidence conflict remains | Return `structured_dispute`. |
| Weak quorum | Fewer than three valid candidates | Return `blocked`. |

## Output Quality Check

A useful final answer must tell the user:

- what the four methods agreed on
- what materially differed
- which evidence resolved the difference
- whether evidence came from independent source lineages
- what changed in the same agent threads after reveal
- what remains uncertain
- the selected route or structured dispute
- whether Hokage's final claims are traceable to revisions and evidence
- whether common guidance and Yamato safety control remained intact
- whether Olga QA was required and passed
- what happens next under the normal workflow

Do not dump internal agent transcripts or pretend unanimity.
