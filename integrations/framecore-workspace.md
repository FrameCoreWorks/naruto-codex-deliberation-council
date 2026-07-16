# Optional FrameCore Workspace Adapter

The standalone package does not require the FrameCore Workspace. This adapter
documents optional integration points for a workspace that already uses named
Oskar, Hipson, Eryk, Olga, and Marta roles.

Do not copy a workspace's global governance files into this repository.

## Optional Wiring

In the target workspace:

1. Add a global routing rule that activates `.agents/skills/naruto/SKILL.md`
   only when the first non-empty token is exact, case-sensitive `$naruto`.
2. Keep Oskar as the parent orchestrator and final synthesizer.
3. Use Hipson and Eryk only before candidate fan-out to compile one common
   evidence packet. Close those preparation threads before opening candidates.
4. Keep the five bundled profiles outside the permanent core roster. They are
   request-only.
5. Use Olga after the five deliberation threads close when the conclusion
   affects implementation, governance, or external action.
6. Register a workspace test command that runs the installed skill validator.
7. If the workspace maintains its own skill checksum registry, generate the
   entry from the installed files. Do not copy another workspace's registry.

## Invariants

- No implicit activation or alias.
- No generic replacement for a missing candidate or moderator profile.
- The four candidates receive the same packet bytes and hash.
- One common reveal and one same-thread revision only.
- Evidence and supported minority objections outrank majority and style.
- Deliberation does not inherit provider, upload, write, push, install,
  destructive, or project-memory permissions.
- Any execution after synthesis returns to the target workspace's normal
  approval and safety gates.

## Optional Validation Split

Keep two levels separate:

- Package validation: `npm test` in this repository.
- Workspace integration validation: target-workspace checks for global routing,
  skill registry entries, named Oskar/Olga integration, and live same-thread
  behavior.

Package validation must not fail merely because the target workspace does not
use FrameCore-specific registries or documentation.
