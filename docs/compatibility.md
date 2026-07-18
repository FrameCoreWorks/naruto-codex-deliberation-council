# Codex Compatibility And Prior Art

Checked on 2026-07-16. External material informed package shape only; no code or
workflow was copied from the listed repositories.

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

## Package Decisions

- Keep `.agents/skills/naruto` and `.codex/agents` in their real project-scoped
  locations so the cloned repository is directly inspectable by Codex.
- Keep `SKILL.md` as the workflow source of truth.
- Keep `agents/openai.yaml` limited to interface metadata and explicit-only
  invocation policy.
- Use dependency-free Node scripts for offline validation and installation.
- Do not add a plugin wrapper that could imply the six custom-agent TOML files
  are automatically installed. A future plugin may bundle the skill, but the
  profile installation contract must remain explicit.
- Treat same-thread revision as a runtime capability to verify after install,
  not a property that static files can prove.

## Prior Art Reviewed

- [OpenAI skills](https://github.com/openai/skills): official skill structure
  and concise metadata patterns.
- [Awesome Codex Skills](https://github.com/composio-community/awesome-codex-skills):
  public catalog and local installation patterns.
- [llm-council](https://github.com/am-will/codex-skills/tree/main/skills/llm-council):
  prior art for planner and judge workflows.
- [oh-my-codex plan skill](https://github.com/Yeachan-Heo/oh-my-codex/blob/main/skills/plan/SKILL.md):
  prior art for bounded consensus and explicit handoff gates.
- [agent-config](https://github.com/yzhao062/agent-config): public configuration
  packaging and thin `agents/openai.yaml` metadata.

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
- If same-thread follow-up, Kakashi, Yamato, or the required capacity is
  unavailable, return `blocked`; do not emulate the run with replacement
  agents.
- Package `0.4.0` intentionally remains pre-1.0 until a live post-install run
  proves all six profiles, one shared actor identity, four fixed methods,
  Yamato preflight, one byte-identical reveal, and same-thread revision in a
  target Codex build.
