# Mirror silhouette authoring verification — 2026-09-17

Task 2 evidence only. Real Phaser/WebGL canvas previews at 390 × 844, using the existing `drawMask` to show the target at full opacity on the board. The tray and thumbnail remain the current scene; UI redesign and interaction testing follow in later tasks. Both reference images in `docs/ref/` were viewed to compare readable cutouts and piece scale.

## Final authored geometry

Coordinates are bounding-box origins. Sizes are shared raster widths. Bboxes below use exclusive right/bottom bounds; component sizes use four-neighbor flood fill.

| Level | Square size; x,y | Triangle size; x,y | Diamond size; x,y | Target bbox | Two / three-layer cells | Visible component sizes |
| --- | --- | --- | --- | --- | --- | --- |
| 1-1 | 48;32,66 | 48;44,78 | — | 32,66 → 92,126 | 642 / 0 | 2220 |
| 1-2 | 48;28,66 | — | 48;52,78 | 28,66 → 100,126 | 522 / 0 | 1782,678 |
| 1-3 | 44;26,68 | 48;50,58 | 40;40,100 | 26,58 → 98,140 | 487 / 42 | 2088,782,42,6 |
| 2-1 | 48;24,68 | 48;48,52 | 40;56,80 | 24,52 → 96,120 | 812 / 136 | 1640,387,284,136,1 |
| 2-2 | 44;28,72 | 48;32,56 | 44;56,82 | 28,56 → 100,126 | 1046 / 136 | 770,678,144,136,56 |
| 2-3 | 48;24,64 | 48;48,76 | 44;42,62 | 24,62 → 96,124 | 838 / 196 | 2309,118,15,6 |

All target centers lie within 12 cells of (64,96). Target widths are 60 for 1-1 and 72 for every other level. Pieces retain their 36–48-cell requirement. The scoped 1-1 width exception was approved during implementation: a 70-cell union of two shapes no wider than 48 cells puts the triangle apex against the square side. Moving the triangle inward exposes both diagonal edges of the notch. The explicit exception is recorded in spec, plan and tests.

## Visual review

- [1-1 Vết khuyết](mirror-redesign/1-1.png): offset triangular notch with both sloping sides clearly readable inside the large square; lower triangular apron makes cancellation visible. The first width72 candidate had only a diagonal edge cut and was rejected.
- [1-2 Cạnh vỡ](mirror-redesign/1-2.png): substantial diagonal bite in the square, with a distinct gold projection to its lower right. The void and added outer area are simultaneously visible.
- [1-3 Hai nhánh](mirror-redesign/1-3.png): upper offset branches above a detached lower diamond, separated by a horizontal dark slit. Moving the diamond down12 cells broke the original hidden connecting bridge; the two major regions contain2088 and782 cells, so separation is not a one-pixel artifact.
- [2-1 Lõi sáng](mirror-redesign/2-1.png): restored triangular core at the left half of the lower diamond is surrounded by cancellation along its three sides. Its136 cells form a separate component; the small upper triangle and outer lower projection provide context. An earlier candidate had a connected core and was rejected.
- [2-2 Mảnh dấu](mirror-redesign/2-2.png): triangle displaced left creates a broad central void, a separated upper tip, slim right fragment, restored core and lower-right diamond projection. This is visibly different from2-1 rather than a resized/translated repeat. All five components are at least56 cells.
- [2-3 Ấn lệch](mirror-redesign/2-3.png): left square mass, diagonal void and restored sloping strip lead into an offset lower triangle; asymmetry and four anchor choices combine the established rules.

Rasterized diagonal intersections leave tiny auxiliary components in1-3,2-1 and2-3, recorded above. The important detached masses and triple core are large and readable at the preview size. No custom cell editing or parity exceptions were used to hide raster geometry.

## Automated verification and limits

- RED: `npm test -- src/domain/levels.test.ts` failed all3 new tests against old data: incorrect piece combinations, width8<36 and target width8<70.
- GREEN: all14 tests pass across4 files. Checks cover all authored anchors inside the board, spacing>12, exact anchor counts2/2/3/3/3/4, changed masks at alternatives, piece necessity, two/triple coverage, order independence, target bbox/center and substantial detached regions. Session tests use complete solutions and verify every omitted piece prevents victory.
- `npm run build`: TypeScript and Vite production build pass; existing bundle-size warning remains.
- Preview harness lives in ignored `.superpowers/sdd/2026-09-17-mirror-puzzle-visual-redesign/preview.mjs`. Instrumentation is served through a Playwright route only; no production debug API. The route accepts Vite's `?t` query, necessary after hot updates.
- Difficulty progression, physical Android touch comfort and full input flows are not proven by these structural tests or static previews. No Android playtest claimed.
