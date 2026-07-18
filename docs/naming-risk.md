# Public Naming And Fan-art Risk

This note is a practical release assessment. It is not legal advice, a
copyright opinion, or a trademark-clearance opinion.

## Assessment

- Naruto is an active, commercially licensed entertainment franchise. Using
  its name, characters, or recognizable visual identity in a public repository
  can create copyright, trademark, affiliation, and endorsement concerns.
- The banner at
  `assets/naruto-codex-deliberation-council-banner.png` intentionally depicts
  Naruto, Kakashi, Yamato, and Tsunade. This exact-character fan-art route has
  materially more rights risk than neutral original artwork or names used only
  as functional labels.
- A newly generated or newly drawn fan-art image can still contain protected
  character expression. The absence of an official logo, copied panel, or
  dialogue does not by itself establish permission to distribute the image.
- An unofficial, no-affiliation disclaimer helps prevent a false endorsement
  claim, but it does not grant copyright, trademark, merchandising, or
  publicity rights.
- The `$naruto` trigger and character-derived role names remain functional
  compatibility labels, but they are not risk-free when presented publicly.
- No complete USPTO, WIPO, copyright, publicity-rights, or country-by-country
  clearance review has been performed.

Primary background references:

- [Official Naruto site](https://naruto-official.com/en/about)
- [VIZ Naruto](https://www.viz.com/naruto)
- [VIZ Naruto Shippuden licensing](https://cpg.viz.com/brands/naruto-shippuden)
- [USPTO likelihood of confusion](https://www.uspto.gov/trademarks/search/likelihood-confusion)
- [WIPO Global Brand Database](https://www.wipo.int/en/web/global-brand-database)
- [U.S. Copyright Office: names, titles, and short phrases](https://copyright.gov/help/faq/faq-protect.html)

## Mitigations Applied

- The repository and package use the neutral name
  `codex-deliberation-council`.
- `NOTICE.md` clearly states that the project and banner are unofficial and
  unaffiliated.
- The fan-art banner is isolated at one documented asset path and explicitly
  excluded from the MIT license.
- The repository includes no official logo, manga scan, copied panel, manga
  dialogue, or official brand asset.
- Tsunade Senju is documented only as the public identity of the Hokage role
  assumed by the parent Codex process. There is no seventh runtime profile and
  no additional solver.
- The fourth Naruto instance is defined by the Empirical Verifier method. The
  method label describes hypothesis-led testing and decision thresholds, not a
  new fictional persona.
- Package automation does not create a remote, push, upload, or publish the
  repository.

These mitigations reduce ambiguity. They do not amount to rights clearance.

## Before Public Distribution

The publisher should choose and document one of these routes:

1. Obtain appropriate rights-holder permission or qualified legal review for
   the exact public use of the banner and franchise-derived labels.
2. Replace the banner with fully original, non-franchise artwork and consider
   neutralizing public role and trigger names while preserving the underlying
   technical contract.
3. Proceed with the exact fan-art route while knowingly accepting the
   unresolved rights risk. The MIT license and disclaimer do not transfer that
   risk or grant the missing rights.

A technical `1.0.0` validation pass is not a legal clearance result. If names
or artwork are changed later, update the README, notice, manifest, checksums,
fixtures, profile labels, and acceptance tests together. Do not rename only
part of the protocol.
