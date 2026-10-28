# LuxuryStay design assets

All three editorial mood images were generated for this project with the built-in OpenAI ImageGen tool on 2026-10-28. They are fictional atmosphere images, not photographs of bookable properties. Property cards use the database's actual image URLs; properties without photos get an explicit placeholder. No downloaded stock photography is included.

Generated PNG originals are preserved under `/Users/ninomarianolai/.codex/generated_images/01a18171-387d-7b12-9253-c9f1b170acd3/`. Project JPEG copies are optimized for web delivery using macOS sips.

## Prompts and saved files

### `client/public/images/stay-hero.jpg`

Use case: photorealistic-natural. Asset type: website hero background for an Italian luxury villa rental service. Create a breathtaking photoreal architectural editorial photograph, wide landscape 3:2 composition. A sophisticated Mediterranean stone villa on the right side of the frame, warm cream limestone, terracotta roof, large shaded loggia, elegant natural linen outdoor sofa, turquoise rectangular infinity swimming pool stretching across lower foreground, a mature olive tree on the left, tall cypress trees, distant blue Mediterranean horizon. Warm late afternoon sunlight, quiet luxury, tasteful Architectural Digest travel photography, natural realistic material texture, filmic muted warm colors and teal pool. No people, no cars, no words, no watermark, no logos. Left half should have open sky and soft foliage and pool to allow white headline overlay. This is an aspirational mood image, not a real rental listing.

The coast inspiration tile intentionally reuses this asset, with a different crop, rather than downloading a duplicate.

### `client/public/images/stay-country.jpg`

Photoreal editorial travel photograph for luxury Italian villa rental website, a real-feeling old Tuscan limestone farmhouse in a lush garden surrounded by mature olive trees and cypress trees, terracotta tile roof, natural linen terrace chairs, small turquoise swimming pool foreground, rolling Tuscan hills in distance, golden late afternoon sunlight. Vertical portrait 2:3 composition. Architectural Digest travel editorial photography, warm muted film colors, natural material textures. Aspirational destination atmosphere, no people, no text, no watermark.

### `client/public/images/stay-island.jpg`

Photoreal luxury travel editorial photograph of a quiet Sardinian coastal cove, bright turquoise transparent Mediterranean water, creamy granite rocks, Mediterranean pine and olive trees, natural stone villa terrace with elegant linen parasol to right, distant sailboat tiny on horizon, warm summer sunlight, tasteful muted film colors, magazine travel photography. Vertical portrait 2:3 composition. Aspirational destination atmosphere. No people, no text, no logos, no watermark.

## Other assets

- `client/public/favicon.svg`: native SVG arch/house mark created in code.
- Fonts: DM Sans and Cormorant Garamond, loaded through Google Fonts with system fallbacks and `display=swap`.
- Icons: existing installed lucide-react package, consistent with the rest of the repository.

## Fictional example listing: Puglia

`client/public/images/stay-puglia.jpg` was generated with the built-in OpenAI ImageGen tool on 2026-10-28. The original PNG is `exec-7f8ee0cb-6ad8-420e-9624-d91d720a31fc.png` in the same generated_images directory listed above.

Prompt: Use case photorealistic-natural. Create one high-end architectural editorial photograph for a fictional example luxury holiday villa listing in Puglia, Italy. Wide 3:2 landscape. A beautifully renovated historic creamy limestone masseria with simple flat roofs and a small traditional domed trullo to one side, elegant pale limestone terrace, a private long rectangular aquamarine swimming pool in foreground, ancient olive trees and warm dry grass, subtle sand linen parasol, natural wooden loungers, midday soft sunlight, summery peaceful atmosphere. Photoreal materials and natural details, Architectural Digest travel editorial, muted cream olive sage and water blue. No text, no people, no logos, no collage. This is a fictional example property, not a real booking listing.

Four example villas are defined in `client/src/data/villa-examples.ts`. They use nonnumeric string IDs, are labeled as examples on every card and detail sheet, are never written to the database, and have no checkout/payment action. Their prices and map coordinates are explicitly illustrative. Real property cards continue to use database records and actual property photos.

## Vector map

The map uses MapLibre GL JS 6.16.0 and the OpenFreeMap public vector service. The custom style at `client/public/maps/mediterranean.json` is derived from OpenFreeMap Positron, with warm paper land, muted olive vegetation, sea-glass blue water, and Italian-first place labels. The alternative landscape view uses OpenFreeMap Liberty. The style is hosted in this repository, as required for custom styles.

Sources and credits:

- OpenFreeMap quick start: https://openfreemap.org/quick_start/
- Public service and commercial use: https://openfreemap.org/
- Upstream style and component licenses: `client/public/maps/OPENFREEMAP-LICENSE.md` (source: https://github.com/hyperknot/openfreemap-styles/blob/main/LICENSE.md)
- Map data: OpenStreetMap contributors, OpenMapTiles. Attribution remains visible in both map views.
- MapLibre GL JS is BSD-3-Clause; npm retains the package license.

No CARTO tile service or key is used. Its current public raster endpoint requires a registered API key; OpenFreeMap provides the required appearance without adding an account or billing setup.
