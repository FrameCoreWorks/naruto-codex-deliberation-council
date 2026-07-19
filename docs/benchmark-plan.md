# Behavioral Benchmark Plan

Status: design only. No benchmark run or performance result is bundled with
`1.1.0`.

## Purpose

The protocol assigns one actor identity to four fixed methods, but instruction
diversity is not evidence of behavioral diversity or better decisions. This
plan defines the evidence required before claiming that the council improves on
less expensive approaches.

Host acceptance and behavioral performance are separate lanes. A benchmark
cannot repair missing profile discovery, permissions, context isolation,
capacity, same-target revision, or final-QA capability. A host run that lacks
those receipts is invalid even if its answer appears strong.

## Comparison Arms

Use the same sanitized task corpus, evidence packet, base model/build, tool
policy, and evaluation rubric for three arms:

1. **Single-agent one-pass:** one complete answer with no critique cycle.
2. **Single-agent planner-critic:** one planner followed by one bounded critique
   and revision.
3. **Council:** the complete four-method, blind commit/reveal/revision protocol.

Run both an equal-input comparison and a budget-normalized comparison. Report
unconstrained council resource use separately. Do not silently give one arm
private evidence, broader tools, more permissive sandboxing, or a different
stop rule.

## Corpus And Execution

- Freeze and hash the task corpus before execution. Include architecture,
  debugging, migration, operational-risk, and evidence-conflict tasks with
  objective acceptance criteria where practical.
- Preregister hypotheses, sample size, exclusions, stopping rules, evaluator
  rubric, and material-effect thresholds before viewing results.
- Randomize arm order and run multiple independent repetitions per task.
  Prevent conversation or artifact leakage between repetitions and arms.
- Record the exact Codex build, model configuration, reasoning setting, tool
  surface, permissions, concurrency, timestamps, and task/packet digests.
- Use public or deliberately sanitized inputs. Do not place secrets, customer
  data, credentials, or private paths in benchmark artifacts.

## Measures

Report per-task values and aggregate uncertainty for:

| Measure | Required interpretation |
|---|---|
| Acceptance-criteria coverage | Correct, supported criteria satisfied by the final answer. |
| Material error rate | Unsupported or incorrect claims with decision impact. |
| Unique verified contribution | Nonredundant risks, constraints, hypotheses, or solutions that survive evidence review. |
| Output redundancy | Semantic overlap across the four blind candidates, reported independently of method IDs. |
| Evidence independence | Unique underlying source lineages, not citation count. |
| Reveal and revision delta | Material supported changes after peer reveal, including useful minority objections retained. |
| Decision quality | Blind rubric score from evaluators who do not know the producing arm. |
| Reliability | Variance and failure/block rate across repetitions. |
| Resource use | End-to-end latency, child turns, input/output tokens, and estimated or measured cost. |

Method names, answer length, confidence, majority, and stylistic difference do
not count as diversity or quality evidence.

## Evaluation Controls

- Keep evaluators blind to the producing arm and randomize answer order.
- Use at least two evaluators for subjective criteria and report agreement.
- Resolve rubric disagreements without revealing arm identity.
- Publish confidence intervals or another preregistered uncertainty measure;
  do not report only the best run or aggregate mean.
- Retain negative and blocked results. State missing data and protocol
  violations explicitly.
- Separate statistical change from a preregistered practically material gain.

## Evidence Package

A publishable benchmark record should contain:

```text
benchmark/<run-id>/
  preregistration.json
  corpus-manifest.json
  host-acceptance.json
  execution-events.jsonl
  sanitized-outputs/
  evaluator-scores.json
  metrics.json
  reproduction.md
```

For a publishable benchmark, the host-owned acceptance record and event log
must use runtime identifiers and receipts emitted by the host, not self-attested
identifiers invented in model text. The log should bind build ID, task and
packet hashes, profile targets, phase transitions, commit barrier, reveal
delivery, same-target follow-ups, and final-QA disposition. This is stronger
evidence than the parent-owned logical sidecar used for base `1.1.0` live
acceptance. Version `1.1.0` does not bundle the adapter or log implementation.

## Claim Gate

Until this plan is executed and independently reviewed, the only accurate
status is:

```text
method_output_diversity: NOT_MEASURED
behavioral_quality_lift: NOT_MEASURED
runtime_cost_latency: NOT_BENCHMARKED
```

Any later performance claim must name the tested build, corpus, comparison arm,
budget regime, uncertainty, and retained evidence package. Results from one
task, one seed, or one evaluator are exploratory only.
