# Visual Refactor VR1 — Shared Foundation and Main Menu

Date: 2026-10-05
State: draft
Scope: `game-next/src/presentation/`

## 1. Why

The reviewer assessed the Main Menu against GDD v0.3.0 and raised eight issues.
Reading the code while answering them turned up a larger problem behind four of
them: the palette in `designTokens.ts` has drifted from the GDD palette table,
and the two were never reconciled.

| Element | GDD v0.3.0 | `designTokens.ts` |
|---|---|---|
| Cosmic background | `#080E24` | `#1A2470 → #2B3192 → #4A3A9E → #6B4BA8` |
| Primary glass border | `#68B8DC` | `#A9E3FF` |
| Grid coordinates | `#D4A359` | `#FFD27A` |

GDD v0.3.0 was published the same day (`eb40631`, "reflect current production
state") but its palette table still carries the original values, so the document
never described the shipped game.

Because `SkyBackdrop` is shared, the drift shows on all three screens, not just
the menu. A background that bright leaves stars and nebulae with little contrast,
so individual elements compensate by glowing — which is the direct cause of
issue #6 (everything glows, nothing stands out) and issue #8 (the background
reads flat).

This spec therefore covers the shared visual foundation plus the Main Menu.
Level Select and Gameplay get their own specs once their reviews arrive; the
foundation decisions here are checked against their current screenshots so they
do not regress.

## 2. Decisions taken

All four were decided by the reviewer during brainstorming.

| # | Question | Decision |
|---|---|---|
| 1 | Keep the purple lower half, or return to navy? | **Cut the purple, keep the current brightness.** Not a return to the GDD's much darker `#080E24`. |
| 2 | Should the menu hero animate the XOR rule? | **Yes, the full overlap.** The reviewer accepts that this spoils part of the Chapter 2 discovery moment. |
| 3 | Is the small star ring on the orbit a feature? | **Neither — it is a tap ripple.** Identified in `MenuScene.ts:663-665`. |
| 4 | Menu layout | **Option C**: large hero, buttons near the bottom. |
| 5 | Hero behaviour under Reduced Motion | **Freeze at the t=3.4s pose** (overlapped, negative star visible). |

Decision 1 means the code is now authoritative and the **GDD palette table must
be rewritten to the shipped values**, not the other way round.

Decision 4 has a known gap: option C leaves the astronomy fact as a caption
under the hero, so issue #2 is not solved by the layout itself. It is solved
typographically instead — see §4.3.

## 3. Shared foundation

### 3.1 Sky gradient

`COLOR_TOKENS.sky.stops` becomes:

```
#1A2470  (0.00)   unchanged
#1E2A80  (0.45)   was #2B3192
#24307F  (0.78)   was #4A3A9E
#1B2563  (1.00)   was #6B4BA8
```

The gradient stays inside the navy–blue family and darkens slightly towards the
bottom rather than warming towards magenta. Brightness at the top is unchanged,
so the casual feel established by the BR branding work survives.

### 3.2 The glow ladder

**Glow is a state, not default decoration.** Exactly one element per screen sits
at tier 3.

| Tier | Meaning | Menu | Level Select | Gameplay |
|---|---|---|---|---|
| 3 — focus | The primary action. One per screen. | Continue button | Current level node | Piece being dragged |
| 2 — active | Interactive, or in motion | Hero emblem | Unlocked nodes | Tray pieces, just-snapped cell |
| 1 — structure | Frames and rules: visible, not inviting | Logo glass bar, secondary button | Constellation links | Board glass border, tray |
| 0 — ground | **No glow.** Colour and opacity only | Logo, stars, fact caption | Locked nodes, chapter labels | Coordinate grid, target silhouette |

The tiers live in `designTokens.ts` as `GLOW_TIERS`, each entry giving the
values an element needs to render its tier — outer radius, alpha, and colour —
with tier 0 defined as no glow at all rather than a very small one. Screens read
their values from this table instead of hard-coding shadow numbers, which is
also what makes the tier-3 test in §6 possible: the tier is declared data, not
an emergent property of scattered draw calls.

Putting the logo at tier 0 is the most debatable call here and was confirmed
explicitly with the reviewer. The reasoning: the logo is not something the
player taps, and it already dominates through size and amber colour. Glowing it
only dilutes the Continue button directly beneath it.

### 3.3 Colour corrections

| Location | Current | Becomes | Reason |
|---|---|---|---|
| `designTokens.ts` `sky.stops` | purple tail | §3.1 | Decision 1 |
| `feedback/FeedbackDirector.ts:323` | `#4ECDC4` | `#A9E3FF` | GDD bans this teal by name |
| `transitions/stardust.ts:17` | `#4ECDC4` | `#A9E3FF` | Same |
| `feedback/FeedbackDirector.ts:322` | `#FFD166` | `#FFC857` | Stray yellow, not a token |
| Logo extrusion | `#3B1F6E` purple | `#11204F` → `#0B163A` | Issue #6, outside the three families |

`#4ECDC4` is the exact teal the GDD names as removed ("teal cũ `#4ECDC4`"). It
is still live in two places, which is why §6 adds a test to stop it returning.

### 3.4 The ◆ motif

Most of this already exists but is drawn ad hoc in each location. The work is to
route it through one shared draw function.

| Place | Status |
|---|---|
| Logo glass bar | exists |
| Level node | exists (diamond) |
| Progress counter `◇ ◇ ◇ ◇` | exists (Gameplay) |
| Fact caption label | new — ◆ prefix |
| Snap feedback | new — ◆ pulses at the snap point |
| Tap ripple | changed — diamond instead of circle (§4.5) |

## 4. Main Menu

### 4.1 Layout — option C

Top to bottom on the 720×1280 canvas: language pill and settings (unchanged top
bar) → logo with glass bar → large hero in its orbit → fact caption → Continue →
Level Select → version footer.

The hero gets the largest share because it now carries a 6-second animation.
Buttons move closer to the bottom, which both fills the dead ~28% and puts them
further into thumb reach. Exact coordinates are an implementation concern; the
constraint is that nothing overlaps on a 16:9 device, the shortest aspect the
game supports.

### 4.2 Logo

Recolour only — the letterforms are not redrawn.

| Part | Change |
|---|---|
| Face | `#FFC857` — unchanged |
| Top highlight | `#FFF4D6` ivory, 1px offset up-left — replaces the glow |
| Extrusion | `#11204F` → `#0B163A` deep navy, replacing purple |
| Glow | **Removed** — tier 0 |
| Reflection | Kept, lowered to ~22% opacity |

### 4.3 Fact caption

Option C keeps the fact under the hero, so issue #2 is addressed by typography
rather than position: larger size, contrast raised from `#8FA4D8` to `#B9C9F2`,
and a ◆ prefix marking it as a deliberate element rather than stray subtitle
text. No background panel — that would add another glowing object to a screen
this spec is trying to calm.

### 4.4 Hero — the XOR loop

A 6-second loop:

| t | State |
|---|---|
| 0.0s | At rest, centres 76px apart |
| 2.0s | Drawing together, ease-in-out |
| 3.0s | Overlap region becomes empty navy |
| 3.4s | Star lights inside the empty region |
| 6.0s | Separated, loop restarts |

The existing bob, breathing pulse and orbiting dust ring are kept.

The overlap is currently **not geometric** — `renderDualJewelEmblem` paints a
fixed navy diamond between the two jewels. For the region to empty correctly at
arbitrary separations it must be computed, reusing the existing
`polygonClip.ts`. This is the largest piece of work in the spec.

**Reduced Motion:** the emblem freezes at the t=3.4s pose — overlapped, region
empty, star visible. No motion at all, but the mechanic is still taught by a
still image. This matters because decision 2 made the animation a teaching
device; switching it off entirely would deny that teaching to exactly the
players who enabled the option.

### 4.5 Settings icon and tap ripple

**Settings icon** (issue #3): teeth join into a closed outline instead of
separate spokes radiating from a centre, so it stops reading as a sun next to
the moon halo in the same corner.

**Tap ripple** (issue #4): kept, but drawn as a diamond rather than two
concentric circles, and lowered to tier 1. This stops it reading as a mysterious
badge and gives the ◆ motif another appearance.

## 5. Code structure

| File | Change |
|---|---|
| `designTokens.ts` | `sky.stops`; add `GLOW_TIERS` |
| `feedback/FeedbackDirector.ts` | Lines 322–323 colours |
| `transitions/stardust.ts` | `DUST_COLORS` |
| **`menu/DualJewelEmblem.ts`** (new) | Extracted from `MenuScene.ts:793–941`, rewritten for real XOR geometry |
| `MenuScene.ts` | Layout C, logo colours, diamond ripple, delegate to the emblem module |
| Settings icon | Closed-outline gear |
| `docs/gdd/master-gdd.md` §3.1 | Rewrite the palette table to the shipped values (decision 1) |

Only one block is extracted: the emblem, because it is being rewritten anyway,
so the extraction costs nothing extra. `buildCasualMirrorLogo` (186 lines) stays
where it is — only its colours change, and moving it would be refactoring that
does not serve this work. `MenuScene.ts` drops from 941 to roughly 790 lines.
It remains large; that is a separate task.

## 6. Testing

Following the repo's existing habit of guard tests (`displayFontCoverage.test.ts`
exists to stop a font regression recurring):

- **Banned-colour guard** — scan `src/` for `#4ECDC4` and for purple outside the
  three families; fail the build. This teal has now survived two cleanups.
- **Emblem geometry** — overlap area is 0 at t=0 and greater than 0 at t=3.0s.
- **Reduced Motion** — with the option on, the emblem holds the t=3.4s pose and
  `update` does not advance its state.
- **Glow ladder** — each screen declares exactly one tier-3 element.

Manual check: all three screens on a 16:9 device after the gradient change.

## 7. Out of scope

- Two-layer parallax background and the water-ripple logo reflection — the
  reviewer ranked both "later". Issue #8 is therefore only partly addressed,
  through the glow ladder rather than through background depth.
- Level Select and Gameplay detail — their own specs, pending their reviews.
  This spec only verifies the shared foundation does not regress them.
- Splitting `MenuScene.ts` or `TextureFactory.ts` beyond the one extraction above.

## 8. Risks

- `sky.stops` is shared, so every background adjustment needs checking on all
  three screens, not just the menu.
- The glow ladder touches many files for a few lines each; the diff will be wide
  and mostly mechanical, which makes it easy to miss a spot. The tier-3 test is
  the backstop.
- Computing real overlap geometry every frame is more work per frame than
  painting a fixed diamond. The GDD requires battery frugality, so the emblem
  should recompute only when the separation changes, not on every tick.
