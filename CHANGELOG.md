# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-07-19

### Added

- A release-specific `1.0.1` acceptance matrix that separates repository
  self-checks, installer tests, hosted CI, and target-host execution evidence.
- A tag-pinned Quick Start, project-trust preflight, example result shape, and
  fail-closed behavior table.
- A behavioral benchmark plan with single-agent and planner-critic baselines,
  blinded evaluation, redundancy and evidence-independence measures, resource
  accounting, and an explicit no-results claim boundary.

### Changed

- Defined the canonical method-matrix authority as
  `.agents/skills/naruto/agent_manifest.json` and clarified that protocol
  artifacts are maintained by the parent process in run context rather than
  written by read-only children.
- Required fresh-context child creation, opening all four candidate instances
  before collecting results, effective-permission and capacity preflight, and
  same-target follow-up receipts instead of model-visible opaque-handle hashes.
- Raised the agent manifest schema from `3` to `4` for host preflight,
  parent-owned orchestration state, and the same-target receipt contract.
- Clarified that profile `sandbox_mode = "read-only"` is a default whose
  effective live value must be verified against the parent override and host
  policy.
- Removed unsupported punctuation from public nickname candidates while
  retaining all stable runtime and method IDs.
- Reworked documentation so the Quick Start, status matrix, trust model, and
  runtime claim boundary precede the manga-inspired design history.
- Disclosed that no host orchestration adapter or event log is bundled and that
  method diversity, quality lift, latency, tokens, and cost remain unmeasured.
- Expanded hosted portability coverage to Ubuntu with Node 22/24 plus macOS and
  Windows with Node 24; pinned official Actions to full commit SHAs, disabled
  persisted checkout credentials, and added bounded workflow concurrency and
  timeouts.
- Added GitHub Actions Dependabot configuration plus issue, security-contact,
  feature-request, and pull-request templates.
- Updated publication metadata for the public repository, the `v1.0.0`
  release, and its two successful Node 22/24 GitHub Actions runs.
- Recorded the selected banner as `accepted_with_known_deviation` because its
  `CODEX` and `DELIBERATION` lettering is tightly joined.

### Fixed

- Rejected unknown, duplicated, missing-value, and scope-incompatible installer
  options before destination writes.
- Closed dangling and nested destination-symlink write paths, verified exact
  source inventory, blocked unexpected package-owned files, and validated the
  installed skill before returning `installed`.
- Snapshotted every source payload through one verified file descriptor,
  rejected source and destination hard links, and executed target validation
  from a private verified validator copy instead of mutable target JavaScript.
- Added a full historical `0.4.0` inventory regression pinned to commit
  `42cab91`, covering the actual 23 overwrite and 10 unchanged outcomes plus
  final installed-skill validation.
- Replaced release-page-relative documentation links with absolute,
  tag-pinned GitHub URLs.
- Made the dangling-destination regression portable on Windows by creating an
  NTFS directory junction and removing its target before exercising the
  fail-closed installer path.
- Normalized release-readiness inventory paths before self-exclusion checks so
  Windows separators cannot make the validator scan its own guard expressions
  as public stale claims.
- Removed stale statements that the public repository, release, and hosted CI
  had not been created.
- Made static classifiers fail closed on missing supervision, training,
  guidance, attestation, and final-QA fields; replaced loose TOML/YAML matching
  with strict dependency-free parsing; and bound checkpoint fixtures to their
  run, task, phase, and snapshot projections.

### Security

- Made the distinction between requested profile defaults and effective host
  permissions explicit and fail-closed.
- Preserved sequential, non-transactional installation as a disclosed
  limitation; automatic rollback and uninstall remain out of scope for this
  hotfix.
- Documented the remaining concurrent ancestor-swap risk and required install
  targets to be quiescent, non-elevated, and exclusively controlled by the
  installer user.
- Clarified that repository checksums authenticate nothing unless the checkout
  or checksum source is independently trusted.

### Legal And Licensing

- Removed the inaccurate claim that the franchise-derived repository name is
  neutral.
- Clarified the MIT scope for original repository material, the banner
  exclusion, recognizable franchise-derived elements, and the continuing
  `NOT CLEARED` rights status without presenting the notice as legal advice.

## [1.0.0] - 2026-07-18

### Added

- Stable release contract for the exact `$naruto` trigger, six read-only
  runtime profiles, four fixed method IDs, packet schemas, installer
  boundaries, and portable package layout.
- Tsunade Senju as the public identity of the Hokage role assumed by the parent
  Codex process, without a seventh child profile or additional solver.
- A black-and-white manga-sketch repository banner depicting one Naruto,
  Kakashi, Yamato, and Tsunade as Hokage in a posed group portrait, with the
  title "Naruto Codex Deliberation Council".
- Release acceptance documentation, security reporting guidance, and CI for
  Node.js 22 and 24.
- Isolated installer lifecycle, release-readiness, checksum, and package
  contract gates.
- Neutral public capability roles for evidence preparation and a documented,
  host-provided `final_qa` dependency for consequential results.

### Changed

- Redefined the fourth Naruto method as `Naruto Clone: Empirical Verifier`.
  It now builds a complete hypothesis-led route with discriminating tests,
  observables, thresholds, and fallback or rollback conditions.
- Clarified that host custom-profile discovery, capacity, and same-thread
  revision are live runtime acceptance conditions, not claims proved by static
  package validation.
- Raised the validation and installer baseline to Node.js 22.

### Security

- Kept all six child profiles read-only and preserved fail-closed behavior when
  a dedicated profile, supervision role, capacity, or same-thread continuation
  is unavailable.
- Extended installer acceptance around dry runs, conflicts, force replacement,
  idempotency, path boundaries, symlinks, and checksum integrity.

### Legal And Licensing

- Marked the banner as unofficial fan art, excluded it from the MIT license,
  and documented that no rights clearance or affiliation is claimed.
- Clarified that a disclaimer does not grant permission to use third-party
  characters, names, marks, or protected expression.

## [0.4.0] - 2026-07-16

- Established the pre-1.0 shadow-clone protocol, six profile layout, portable
  installer, fixtures, validation suite, and checksum manifest used as the
  migration base for `1.0.0`.
