# Public Naming Risk

This note is a practical release assessment, not legal advice and not a
trademark-clearance opinion.

## Assessment

- Copyright risk from names alone is lower than risk from copied character
  expression. A brief attributed description of the inspiring training
  mechanism is included, but the repository must not include manga pages,
  franchise artwork, dialogue, catchphrases, extended plot retelling,
  character imitation, logos, or visual identity.
- Trademark and affiliation risk is material because Naruto is an active,
  commercially licensed entertainment franchise. Using the franchise name as
  repository, product, icon, or marketing identity can create a source or
  endorsement concern.
- Full character names are safer as internal mnemonic labels than as public
  branding, but they are not risk-free.
- No complete USPTO, WIPO, or country-by-country clearance search has been
  performed.

Primary references:

- [Official Naruto site](https://naruto-official.com/en/about)
- [VIZ Naruto](https://www.viz.com/naruto)
- [VIZ Naruto Shippuden licensing](https://cpg.viz.com/brands/naruto-shippuden)
- [USPTO likelihood of confusion](https://www.uspto.gov/trademarks/search/likelihood-confusion)
- [WIPO Global Brand Database](https://www.wipo.int/en/web/global-brand-database)
- [U.S. Copyright Office: names, titles, and short phrases](https://copyright.gov/help/faq/faq-protect.html)

## Mitigations Applied

- Neutral repository and package name: `codex-deliberation-council`.
- The trigger and role names are retained compatibility labels disclosed in
  `NOTICE.md`; they are not repository or package branding.
- No anime styling, screenshots, icons, logos, artwork, dialogue, catchphrases,
  or extended plot retelling.
- The README limits manga context to a short attributed explanation of the
  training mechanism that maps directly to the protocol design.
- Clear unofficial and no-affiliation notice.
- MIT license explicitly excludes rights to third-party names and marks.
- No public push or remote creation is performed by the packaging workflow.

## Before Public Release

Choose one route:

1. Lowest practical risk: rename the public skill trigger and all five role
   labels to neutral names, then update profiles, fixtures, docs, hashes, and
   live acceptance tests together.
2. Compatibility route: retain `$naruto` and the current internal labels, keep
   the neutral repository branding and notice, and obtain legal review if the
   repository will be promoted or distributed commercially.

Do not rename only part of the protocol. A rename must preserve trigger tests,
runtime IDs, behavior-contract mapping, packet schemas, and the no-fallback
rule.
