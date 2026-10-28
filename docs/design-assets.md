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
