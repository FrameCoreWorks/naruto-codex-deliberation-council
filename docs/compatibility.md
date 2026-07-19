# Codex Compatibility And Prior Art

Checked on 2026-07-19. External material informed package shape only; no code
or workflow was copied from the listed repositories.

## Official Codex Sources

- [Build skills](https://developers.openai.com/codex/skills): a skill is a
  directory with `SKILL.md` plus optional scripts and references. Project
  skills live in `.agents/skills`; user skills live in
  `$HOME/.agents/skills`.
- [Subagents and custom agents](https://developers.openai.com/codex/subagents):
  project custom agents live in `.codex/agents`; personal agents live in
  `~/.codex/agents`. Profiles declare `name`, `description`,
  `developer_instructions`, and optional defaults such as
  `sandbox_mode = "read-only"`.
- [Build plugins](https://learn.chatgpt.com/docs/build-plugins): plugins are a
  broad distribution surface for reusable skills. A plugin requires
  `.codex-plugin/plugin.json`.
- [OpenAI skills examples](https://github.com/openai/skills): official public
  examples of progressive disclosure, `agents/openai.yaml`, references, and
  validation helpers.

Codex normally detects new or changed skills automatically. Restart Codex and
start a new task if discovery does not refresh. A repository must be inspected
and trusted before its project-scoped configuration is loaded.

`sandbox_mode = "read-only"` and `approval_policy = "never"` are profile
defaults, not standalone proof of the effective permission set of a spawned
child. The live parent override, managed policy, and host tool surface remain
authoritative. Version `1.1.0` therefore requires preflight confirmation of the
effective pair and blocks if the result cannot be verified.

## Stable 1.1.0 Contract

Version `1.1.0` preserves the stable public compatibility surface introduced by
`1.0.0`:

- exact `$naruto` trigger
- six bundled runtime profile IDs
- one `naruto_uzumaki` actor identity across four Naruto instances
- four fixed method IDs: Integrator, Challenger, Strategist, and Empirical
  Verifier
- existing trigger, identity, profile, method, installer, and unchanged artifact
  identifiers; the additive artifact extensions below do not remove a `1.0.x`
  field
- Tsunade Senju as the public identity of the parent Hokage role, without a
  separate Hokage profile
- project and user installer roots, package layout, and checksum surface

The `1.0.1` hardening layer adds strict installer input and path controls,
exact source and target inventory checks, fresh-context spawning, same-target
follow-up receipts, effective-permission preflight, and stricter fail-closed
repository fixtures. It does not claim universal host support.

The `1.1.0` hardening layer removes contradictory opaque-handle requirements,
requires a bounded pre-reveal semantic-redundancy audit at claim and
evidence-lineage level, and provides a non-bundled `final_qa` interoperability
example. It preserves the same six profiles and all runtime and method IDs.

### Additive Artifact Extension Rule

Version `1.1.0` keeps the existing `.v1` artifact identifiers and adds fields to
the reveal, protocol-run manifest, moderator report, and consensus report. A
reader must treat those additions as optional when ingesting a retained `1.0.x`
artifact:

- a missing blind semantic-redundancy audit maps to `unverifiable` and caps the
  result at `provisional_consensus`
- a missing request/result/artifact binding for required final QA maps to
  `blocked`
- unknown additive fields must not make an otherwise parseable `1.0.x`
  artifact malformed

This reader rule applies to retained artifacts that existed in `1.0.x`. The
new `final_qa_review_request.v1` and `final_qa_review_result.v1` message
envelopes did not exist there and are intentionally closed: a `1.1.0` producer
or validator rejects unknown request, result, or finding keys to preserve the
role-blind review boundary.

A producer claiming the `1.1.0` contract must emit the new fields. This retains
wire-level parse compatibility while preventing an older artifact from being
promoted to a stronger result than its evidence supports. No `.v1` field is
renamed or removed.

The canonical method-matrix authority is
`.agents/skills/naruto/agent_manifest.json`. The package manifest and public
documentation are projections of that source, not competing authorities.

## Publication And CI Evidence

The repository is public at
[FrameCoreWorks/naruto-codex-deliberation-council](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council).
The published [`v1.0.0` release](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/releases/tag/v1.0.0)
has two successful hosted workflow runs for the same release commit:

- [main workflow run](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/runs/29687294043)
- [tag workflow run](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/runs/29687369374)

Those runs are historical evidence for `v1.0.0`; they do not certify a later
checkout. Each release must record green hosted CI for its exact tag or commit.

## Package Decisions

- Keep `.agents/skills/naruto` and `.codex/agents` in their real
  project-scoped locations so the package is directly inspectable by Codex.
- Keep `SKILL.md` as the procedural source of truth and
  `agent_manifest.json` as the machine-readable identity, method, and host
  preflight authority.
- Keep `agents/openai.yaml` limited to interface metadata and explicit-only
  invocation policy.
- Keep all six child profiles read-only with `never` approval by default.
  Effective live values must be verified before fan-out.
- Create every child with no inherited parent conversation context. Open all
  four Naruto candidate instances before collecting any candidate output.
- Preserve `naruto_clone_verifier` and `naruto_empirical_method.v1` while
  defining the public method as `Naruto Clone: Empirical Verifier`.
- Keep evidence and source preparation as optional capabilities without fixed
  runtime IDs. Consequential results require a host-provided, role-blind
  `final_qa` reviewer; the package does not bundle it.
- Maintain protocol artifacts in parent run context. Read-only children do not
  persist protocol state to the filesystem.
- Use exact-target follow-up receipts returned by the host as continuity
  evidence. Do not require or invent a model-visible opaque thread-handle hash.
- Audit blind-output semantic redundancy by claim meaning and evidence lineage.
  Treat the result as a bounded heuristic, not a deterministic similarity score
  or measured benchmark result, and assess post-reveal convergence separately.
- Keep the `final_qa` interoperability example as a message contract inside the
  existing consensus template; bind request, task, final artifact, and result
  digests, reject mismatch or replay, and do not turn it into a seventh bundled
  profile.
- Use dependency-free Node scripts for offline package, install, and checksum
  validation.
- Do not imply that a plugin wrapper automatically installs the separate custom
  agent profiles.

## Acceptance Boundary

Repository and isolated tests can prove that files, schemas, profiles,
fixtures, checksums, and installer behavior agree. They do not parse an
arbitrary live-run artifact graph and cannot prove that a particular Codex host
discovers all six custom profiles, applies effective read-only permissions,
supplies six child slots, starts children without inherited context, or
supports follow-up to the exact same four targets.

Version `1.1.0` separates three claims:

1. Repository self-check acceptance is `PASS` only for an exact checkout whose
   full test suite succeeds.
2. Installer acceptance is `PASS` only when isolated security and lifecycle
   tests succeed.
3. Target-host acceptance remains `NOT PROVEN` until a new-task execution on
   that build records every required live receipt and validates the resulting
   acceptance record.

Base live acceptance retains unmodified host-tool targets and receipts in a
parent-owned logical sidecar. Model-authored attestations are not a substitute.
The package does not bundle a deterministic host orchestration adapter or
tamper-evident event log, and it does not claim that the logical sidecar is one.
It also does not claim measured output diversity, quality lift, latency, token,
or cost results. The comparison design is documented in
[`benchmark-plan.md`](benchmark-plan.md), but no results are bundled in
`1.1.0`.

If live capability is absent or ambiguous, return `blocked`. Do not substitute
`default`, `worker`, or `explorer`, recreate revisions in new threads, or infer
continuity from similar prose.

See [`release-acceptance-v1.1.0.md`](release-acceptance-v1.1.0.md) for the
complete current matrix and
[`release-acceptance-v1.0.0.md`](release-acceptance-v1.0.0.md) for the corrected
historical release record.

## Prior Art Reviewed

- [OpenAI skills](https://github.com/openai/skills): official skill structure
  and concise metadata patterns.
- [Awesome Codex Skills](https://github.com/composio-community/awesome-codex-skills):
  public catalog and local installation patterns.
- [llm-council](https://github.com/am-will/codex-skills/tree/main/skills/llm-council):
  prior art for planner and judge workflows.
- [oh-my-codex plan skill](https://github.com/Yeachan-Heo/oh-my-codex/blob/main/skills/plan/SKILL.md):
  prior art for bounded consensus and explicit handoff gates.
- [agent-config](https://github.com/yzhao062/agent-config): public
  configuration packaging and thin `agents/openai.yaml` metadata.

Assimilated patterns:

- progressive disclosure
- explicit installation roots and project trust
- thin UI metadata
- local validation
- bounded planner, critic, and moderator roles

Rejected patterns:

- unbounded debate
- generic-worker substitution for dedicated training instances
- majority vote as truth
- approval or sandbox bypasses
- hidden provider dependencies
- copying external agent prompts or frameworks as authority

## Known Runtime Limits

- Custom-agent configuration may evolve as Codex agent authoring matures.
- Static tests cannot prove profile discovery, effective permissions, context
  isolation, target capacity, or same-target follow-up on a specific build.
- The package does not yet provide a complete validator for arbitrary recorded
  run artifact graphs; that larger surface is deferred to `1.2.0`.
- A target environment may cap concurrent child threads below the six required
  at peak. Hokage remains the parent and does not consume a child profile.
- The exact-first-token rule is a skill contract and must be checked live; it
  is not a declarative host command registration.
- Independent `final_qa` is conditional and host-provided, so consequential
  runs block where it is unavailable.
- No executable host orchestration adapter or tamper-evident event log is
  bundled; base live acceptance depends on unmodified host-tool receipts bound
  into parent-owned logical state.
- Method output diversity and quality lift are `NOT MEASURED`, and runtime
  latency, tokens, and cost are `NOT BENCHMARKED`.
- The bundled semantic-redundancy audit is a claim-level moderator heuristic.
  It can lower the protocol result ceiling but is not benchmark calibration or
  proof that the four methods are behaviorally independent.
- Fan-art and naming rights are outside technical compatibility and remain
  `NOT CLEARED`. Review [`naming-risk.md`](naming-risk.md).
