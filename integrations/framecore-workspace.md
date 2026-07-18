# Optional FrameCore Workspace Adapter

The standalone package does not require the FrameCore Workspace. This adapter
documents optional integration points for a workspace that already uses named
research, packet-building, QA, and delivery roles.

Do not copy a workspace's global governance files into this repository.

## Optional Wiring

In the target workspace:

1. Add a global routing rule that activates `.agents/skills/naruto/SKILL.md`
   only when the first non-empty token is exact, case-sensitive `$naruto`.
2. Map the workspace's existing parent orchestrator to the public **Hokage**
   role for every Naruto artifact. Do not add a separate Hokage profile.
3. Map the optional public `evidence_packet_builder` role to Hipson and
   `source_verifier` to Eryk. Use them only before training-instance fan-out,
   then close those preparation threads before opening the four instances.
4. Keep the six bundled profiles outside the permanent core roster. They are
   request-only.
5. Map the host-provided public `final_qa` role to Olga. Keep Kakashi and Yamato
   open through the bounded protocol, then close all six child threads before
   opening that independent reviewer when the conclusion affects
   implementation, governance, or external action.
6. Register a workspace test command that runs the installed skill validator.
7. If the workspace maintains its own skill checksum registry, generate the
   entry from the installed files. Do not copy another workspace's registry.

## Invariants

- No implicit activation or alias.
- No generic replacement for a missing training instance, Kakashi, or Yamato.
- The four instances share `actor_identity_id: naruto_uzumaki`, receive the same
  source, `method_matrix.v1`, guidance, and safety bytes, and keep four fixed
  methods through revision.
- Each `naruto_training_instance_envelope.v1` differs only in allowlisted
  routing fields and its resulting digest.
- Kakashi guidance is common and non-solution; Yamato safety control passes
  before fan-out and cannot become instance-specific coaching.
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
  skill registry entries, parent-Hokage and QA integration, and live same-thread
  behavior.

Package validation must not fail merely because the target workspace does not
use FrameCore-specific registries or documentation.
