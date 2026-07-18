# Codex Compatibility And Prior Art

Checked on 2026-07-18. External material informed package shape only; no code
or workflow was copied from the listed repositories.

## Official Codex Sources

- [Build skills](https://developers.openai.com/codex/skills): a skill is a
  directory with `SKILL.md` plus optional scripts and references. `SKILL.md`
  requires `name` and `description`. Project skills live in
  `.agents/skills`; user skills live in `$HOME/.agents/skills`.
- [Subagents and custom agents](https://developers.openai.com/codex/subagents):
  project custom agents live in `.codex/agents`; personal agents live in
  `~/.codex/agents`. Every profile requires `name`, `description`, and
  `developer_instructions`. `sandbox_mode = "read-only"` is supported.
- [Build plugins](https://learn.chatgpt.com/docs/build-plugins): plugins are
  the preferred broad distribution surface for reusable skills. A plugin
  requires `.codex-plugin/plugin.json`.
- [OpenAI skills examples](https://github.com/openai/skills): official public
  examples of progressive disclosure, `agents/openai.yaml`, references, and
  validation helpers.

Codex normally detects new or changed skills automatically. Official skill
documentation says to restart Codex if a change does not appear. Custom-agent
profiles are configuration layers; test them after restart or in a new task.

## Stable 1.0.0 Contract

Version `1.0.0` is the first stable file, package, installer, and static
protocol contract. Stability covers:

- the exact `$naruto` trigger
- the six bundled read-only runtime profile IDs
- one shared `naruto_uzumaki` actor identity across four Naruto instances
- the four fixed method IDs: Integrator, Challenger, Strategist, and Empirical
  Verifier
- Kakashi guidance, Yamato safety, commit/reveal/revision, packet, checkpoint,
  and synthesis schemas
- Tsunade Senju as the public identity of the Hokage role assumed by the
  parent Codex process, without a separate Hokage profile
- the project and user installer boundaries, package layout, checksums, and
  portable validation surface

Stable does not mean that every current or future Codex host implements the
same custom-profile capacity or thread-resumption behavior. Those capabilities
remain host acceptance conditions and fail closed when unavailable.

The validation and installer helpers require Node.js 22 or newer. The committed
GitHub Actions workflow is configured for Node.js 22 and 24; no hosted run is
claimed or recorded by this repository preparation.

## Package Decisions

- Keep `.agents/skills/naruto` and `.codex/agents` in their real project-scoped
  locations so the cloned repository is directly inspectable by Codex.
- Keep `SKILL.md` as the workflow source of truth.
- Keep `agents/openai.yaml` limited to interface metadata and explicit-only
  invocation policy.
- Keep all six child profiles read-only. Hokage remains a parent-process role
  and does not consume a seventh child profile.
- Preserve the machine ID `naruto_clone_verifier` and method ID
  `naruto_empirical_method.v1`, while defining the public method as
  `Naruto Clone: Empirical Verifier`.
- Keep `evidence_packet_builder` and `source_verifier` as optional capability
  roles without fixed runtime IDs. Consequential results require a
  host-provided, role-blind `final_qa` reviewer; the package does not bundle it
  and fails closed when it is unavailable.
- Use dependency-free Node scripts for offline validation and installation.
- Do not add a plugin wrapper that could imply the six custom-agent TOML files
  are automatically installed. A future plugin may bundle the skill, but the
  profile installation contract must remain explicit.
- Treat same-thread revision as a runtime capability to verify after install,
  not a property that static files can prove.

## Acceptance Boundary

Static and isolated tests can prove that files, schemas, profiles, fixtures,
checksums, and installer behavior agree. They cannot prove that a particular
Codex host discovers all six custom profiles, provides the required concurrent
capacity, or can re-contact the same four instance threads after reveal.

The `1.0.0` release therefore separates two claims:

1. Static package and isolated installation acceptance may be marked `PASS`
   only after the repository release suite succeeds on the current checkout.
2. Host custom-profile and same-thread acceptance remains `NOT PROVEN` until a
   new-task run on the target Codex build records the required live evidence.

If live capability is absent or ambiguous, the protocol returns `blocked`. It
must not replace a dedicated profile with `default`, `worker`, or `explorer`,
recreate revisions in new threads, or infer continuity from similar text.

See [`release-acceptance-v1.0.0.md`](release-acceptance-v1.0.0.md) for the
complete acceptance matrix.

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
- explicit installation roots
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

- The custom-agent file format may evolve as Codex agent authoring matures.
- Static tests cannot prove that a specific Codex build can re-contact the same
  four open training-instance threads after reveal.
- A target environment may cap concurrent child threads below the six required
  at peak: four Naruto training instances, Kakashi, and Yamato. Hokage remains
  the parent role and does not consume a child profile.
- If same-thread follow-up, Kakashi, Yamato, a dedicated Naruto profile, or the
  required capacity is unavailable, return `blocked`; do not emulate the run
  with replacement agents.
- Fan-art and naming rights are outside technical compatibility. Review
  [`naming-risk.md`](naming-risk.md) separately before public distribution.
