# Direction approved — Menu + level select visual refresh

Date: 2026-10-08. Gate file for the huashu-design three-direction step.

## Directions shown (real HTML drafts, 360×640 = 720×1280 at 0.5)

| Direction | Draft | Screenshot |
|-----------|-------|------------|
| A′ Milky Way (per-chapter screens, chapter tabs) | `A-milky-way.html` | `shots/A-milky-way.png` |
| B′ Flat Galaxy (concentric ellipses, purple) | `B-flat-galaxy.html` | `shots/B-flat-galaxy.png` |
| C Journey Scroll (vertical path, chapter gates, on the Milky Way sky) | `C-journey-scroll.html` | `shots/C-journey-scroll.png` |

References: `docs/ref/image.png` (flat galaxy), `docs/ref/image copy.png` (layered Milky Way).

## User choices (quoted)

- "Thứ mình muốn giữ là bố cục như thế không phải style" — keep the current menu layout (MIRROR logo + mirror bar and reflection, XOR dual-jewel emblem, astronomy fact line, Continue button with subtitle, Select-level button); change style only.
- "mình chọn nền tảng hướng C" — direction C is the base.
- On the proposed development ("ý tưởng thì mình thấy ok đó"): silhouette level nodes with constellation lines, a distinct sky zone per chapter, XOR chapter gates. Landmarks, info stelae and end-of-chapter pacing are deferred.
- "ok mình duyệt" — approval to record this gate and write the spec next.

## Constraints agreed

- No new image assets, no Rive/Figma: textures drawn in code and baked once.
- Performance budget goes into the spec (target ≥ 55 FPS on a mid-range Android; reviewer to name the weakest test device).
- Menu layout is frozen; the real level-select screen is already a vertical zigzag with chapter headers, so C extends it.
