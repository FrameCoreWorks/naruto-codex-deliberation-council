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
- Oskar synthesizes a route only after evidence and production constraints are
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

## Failure Modes

| Failure | Detection | Required response |
|---|---|---|
| Implicit activation | First token is not exact `$naruto` | Use normal routing. |
| Packet drift | Candidate echoes a different SHA-256 | Mark invalid; one pre-reveal technical retry. |
| Partial answer | Candidate solves only one component | Mark invalid; require full solution. |
| Early reveal | Peer material appears before barrier | Block the run; do not synthesize as Naruto. |
| Generic replacement | Dedicated profile fails and a worker is substituted | Block or degrade by valid dedicated quorum only. |
| Different evidence sets | Candidate receives a private source | Block verified status and rebuild a common packet. |
| Majority shortcut | Synthesis cites vote count as authority | Route to Olga and repair evidence weighting. |
| Speed/verbosity bias | Completion order or answer length affects rank | Remove the signal and re-evaluate claims. |
| Lost minority objection | Evidence-backed critical objection omitted | Result cannot be verified; restore dispute. |
| New thread revision | Candidate is respawned after reveal | Block; same-thread learning was not proven. |
| Raw reasoning leakage | Scratchpad or chain-of-thought appears | Reject artifact; retain concise claims/evidence only. |
| Nested spawn | Candidate launches children | Mark invalid and stop protected action. |
| Write/provider/upload attempt | Candidate tries execution | Reject; `$naruto` grants no permission. |
| Endless debate | A second reveal is proposed automatically | Stop after one cycle; use normal Loop Protocol later. |
| Fake consensus | Critical evidence conflict remains | Return `structured_dispute`. |
| Weak quorum | Fewer than three valid candidates | Return `blocked`. |

## Output Quality Check

A useful final answer must tell the user:

- what the four methods agreed on
- what materially differed
- which evidence resolved the difference
- what remains uncertain
- the selected route or structured dispute
- whether Olga QA was required and passed
- what happens next under the normal workflow

Do not dump internal agent transcripts or pretend unanimity.
