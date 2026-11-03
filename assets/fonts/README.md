# Local share-card fonts

These TrueType files unpack the Latin WOFF2 fonts already bundled by this site. The WOFF2 files retain the original variable fonts for the site. The TrueType copies retain the original name, copyright, and default outline tables, with variation tables removed for the OG renderer (Fraunces default weight 900; DM Sans default weight 400). Windows DirectWrite IDWriteFactory5.UnpackFontFile converted the containers; no fonts were downloaded and no outlines were synthesized.

- Fraunces: `03bda585a99c6450-s.p.32sris142tqlb.woff2`, SHA-256 `88e17be075f1be50ab67b057b99e3701b828f44ed28f9452df6c02645bb0cba9`. Embedded copyright: Copyright 2020 The Fraunces Project Authors (github.com/undercasetype/Fraunces).
- DM Sans: `5c285b27cdda1fe8-s.p.2_mbdogr7ni8i.woff2`, SHA-256 `468d56b6b25b05b70190b6c233d773f6f1770e8579827ce022a57f03fa8002fb`. Embedded copyright: Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts).

See the accompanying SIL Open Font License files, retrieved from the official google/fonts repository. `app/layout.tsx` uses these same fonts locally. OG rendering reads them from disk at build time; the export serves only generated PNGs.
