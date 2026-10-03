# G0 Audio Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a listened-to, licence-checked pick of 8 sound effects and 2 music tracks, with originals stored locally for the G1 processing script.

**Architecture:** No game code. The agent researches candidates on the web and writes them into `docs/testing/audio/candidates.md`; the reviewer listens, picks, and downloads the originals into the gitignored `game-next/audio-src/`; the agent then records the picks and the music key in the same file.

**Tech Stack:** WebSearch/WebFetch for research; Markdown.

**Spec:** `docs/superpowers/specs/2026-10-03-g-audio-design.md` (§3.2 sample library, §4.1 selection, §4.2 folders). Index: `docs/superpowers/plans/2026-10-03-g-audio-index.md`.

## Global Constraints

- Allowed licences: `CC0-1.0` and `Pixabay` only. CC-BY, CC-BY-NC, "free for personal use", or unclear terms are rejected.
- Sources: Kenney (`kenney.nl`, all CC0), Freesound (`freesound.org`, filter licence "Creative Commons 0" only), Pixabay (`pixabay.com/sound-effects/`, `pixabay.com/music/`).
- The agent cannot hear audio. Never claim how a file sounds beyond what its page states; the reviewer decides.
- Originals are never committed. `game-next/audio-src/` is gitignored.
- Docs and commit messages in English. Commit messages `type(scope): summary`. Every commit includes a `CHANGELOG.md` entry under `## Unreleased`.

## Sound brief (from spec §3.2)

Mood: "ancient astronomical stone stele seen through glass" — mysterious, deep, sharp, still. Glass, crystal and bell timbres; no drums, no 8-bit, no cartoon sounds.

| Key | Wanted | Length |
|---|---|---|
| `bell` | Short crystal/glass bell with a clear single pitch (it will be pitched to 8 notes) | ≤ 1.5 s |
| `tick` | Very light glass tap | ≤ 150 ms |
| `tap-soft` | Soft, low, muted tap | ≤ 300 ms |
| `thud` | Dull, blocked glass knock | ≤ 400 ms |
| `hollow` | Low, airy "breath", slightly hollow | ≤ 1 s |
| `shimmer` | Bright sparkle, high | ≤ 1 s |
| `swish` | Light air swish, falling | ≤ 600 ms |
| `stinger-win` | Bell chord resolving to its root | 3–5 s |
| `music-sky` | Ambient pad, slow, no percussion; Menu + Map | loopable, 60–150 s |
| `music-stele` | As above, stiller, sparse, must not mask SFX; in-level | loopable, 60–150 s |

Both tracks must be in the same key, or be drones with no clear key.

## File map

| File | Responsibility |
|---|---|
| `game-next/.gitignore` | Ignore `audio-src/` |
| `docs/testing/audio/candidates.md` | Shortlist, reviewer picks, music key |

---

### Task 1: Shortlist candidates

**Files:**
- Modify: `game-next/.gitignore`
- Create: `docs/testing/audio/candidates.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `docs/testing/audio/candidates.md` with one `## <key>` section per key, each with 2–3 rows.

- [ ] **Step 1: Branch**

```bash
git switch main
git switch -c docs/audio-g0
```

- [ ] **Step 2: Ignore originals**

Append to `game-next/.gitignore`:

```
audio-src/
```

Run: `mkdir -p game-next/audio-src && git status --short game-next`
Expected: only `game-next/.gitignore` is listed; the empty folder is not.

- [ ] **Step 3: Research**

For each key in the Sound brief, find 2–3 candidates. Suggested searches (adapt freely):

| Key | Where to look first |
|---|---|
| `bell`, `shimmer`, `stinger-win` | Freesound: "crystal bell", "glass chime", "singing bowl", "celesta", "glockenspiel" (CC0 filter). Kenney "Music Jingles" (stinger) |
| `tick`, `tap-soft`, `thud` | Kenney "Interface Sounds" (`glass_00x`, `tick_00x`, `drop_00x`, `error_00x`), Kenney "Impact Sounds" |
| `hollow`, `swish` | Freesound: "soft whoosh", "air swish", "breath low", "reverse swell" (CC0 filter); Pixabay sound effects |
| `music-sky`, `music-stele` | Pixabay music: "ambient space", "meditation pad", "celestial drone"; Freesound: "ambient pad loop" (CC0 filter) |

For every candidate open its page with WebFetch and copy: title, author, page URL, licence as stated on the page, length, and, for music, the key if the page states one. Drop any candidate whose licence is not CC0 or the Pixabay Content License.

- [ ] **Step 4: Write `docs/testing/audio/candidates.md`**

Use exactly this structure (one section per key, keys in the Sound brief order):

```markdown
# Audio candidates (G0)

Status: awaiting reviewer picks

Spec: `docs/superpowers/specs/2026-10-03-g-audio-design.md` §3.2, §4.1. Allowed licences: CC0-1.0, Pixabay.

## How to pick

1. Listen to every candidate in a section.
2. Put an `x` in the Pick column of exactly one row per section (or write "none" under the table and say what to look for instead).
3. Download the original of each picked file into `game-next/audio-src/` named `<key>.<original extension>`, for example `bell.wav`, `music-sky.mp3`.
4. Write the music key (for example "D major", or "drone, no key") on the Music key line at the end.

## bell

Want: short crystal/glass bell with one clear pitch, ≤ 1.5 s.

| Pick | # | Title | Author | Licence | Length | URL | Notes |
|---|---|---|---|---|---|---|---|
|  | 1 | … | … | CC0-1.0 | 1.2 s | https://… | page says … |

(repeat for tick, tap-soft, thud, hollow, shimmer, swish, stinger-win, music-sky, music-stele)

## Music key

Music key: _(reviewer fills in)_
```

Fill every row with real data from Step 3; leave the Pick column empty.

- [ ] **Step 5: CHANGELOG, commit, STOP**

Add under `## Unreleased` in `CHANGELOG.md`:

```markdown
### 2026-10-03 - Shortlist audio candidates (G task 1)

- Added `docs/testing/audio/candidates.md` with 2–3 CC0/Pixabay candidates per sound key from spec G §3.2, and ignored `game-next/audio-src/` for downloaded originals.
- Verification: every candidate's licence was read from its own page; `git status` shows no files under `audio-src/`.
```

```bash
git add game-next/.gitignore docs/testing/audio/candidates.md CHANGELOG.md
git commit -m "docs(audio): shortlist sound candidates for review"
```

**STOP (index stop point 2).** Tell the reviewer: the file to open, the four "How to pick" steps, and that no further task runs until the picks are in.

---

### Task 2: Record the picks

Runs only after the reviewer says the picks are done.

**Files:**
- Modify: `docs/testing/audio/candidates.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: reviewer's `x` marks, files in `game-next/audio-src/`, the Music key line.
- Produces: a `## Selected` table that G Task 5 copies into `AUDIO_ASSETS`, and a `MUSIC_ROOT_SEMITONE` value.

- [ ] **Step 1: Check the originals exist**

Run: `ls game-next/audio-src/`
Expected: exactly one file per key: `bell.*`, `tick.*`, `tap-soft.*`, `thud.*`, `hollow.*`, `shimmer.*`, `swish.*`, `stinger-win.*`, `music-sky.*`, `music-stele.*`. If a file is missing or a section says "none", stop and ask the reviewer.

- [ ] **Step 2: Re-check licences of the picks**

Open each picked URL with WebFetch again and confirm the licence still reads CC0 or Pixabay. If one changed, stop and ask.

- [ ] **Step 3: Work out the root semitone**

Map the key's tonic to a semitone number, C = 0: C 0, C♯/D♭ 1, D 2, D♯/E♭ 3, E 4, F 5, F♯/G♭ 6, G 7, G♯/A♭ 8, A 9, A♯/B♭ 10, B 11. A minor key uses its relative major's tonic (A minor → C = 0), because the snap scale is major pentatonic. "Drone, no key" uses the drone's pitch as the tonic; if the reviewer cannot name it, use D = 2 and note it. If the two tracks were marked with different keys, stop and ask (index departure 3).

- [ ] **Step 4: Add the Selected table**

Append to `docs/testing/audio/candidates.md` and change the Status line to `Status: picked`:

```markdown
## Selected

MUSIC_ROOT_SEMITONE: 2 (D major, from the reviewer's note)

| key | kind | srcFile | title | author | licence | url |
|---|---|---|---|---|---|---|
| bell | sfx | bell.wav | … | … | CC0-1.0 | https://… |
| tick | sfx | tick.ogg | … | … | CC0-1.0 | https://… |
| tap-soft | sfx | … | … | … | … | … |
| thud | sfx | … | … | … | … | … |
| hollow | sfx | … | … | … | … | … |
| shimmer | sfx | … | … | … | … | … |
| swish | sfx | … | … | … | … | … |
| stinger-win | stinger | … | … | … | … | … |
| music-sky | music | … | … | … | … | … |
| music-stele | music | … | … | … | … | … |
```

(`kind` is fixed per key exactly as shown; fill the other columns from the picked rows and the real file names.)

- [ ] **Step 5: CHANGELOG and commit**

```markdown
### 2026-10-03 - Record reviewer's audio picks (G task 2)

- Recorded the reviewer's pick per sound key, the source file names in `game-next/audio-src/`, and `MUSIC_ROOT_SEMITONE` in `docs/testing/audio/candidates.md`.
- Verification: all ten originals present locally; licences re-read on each source page.
```

```bash
git add docs/testing/audio/candidates.md CHANGELOG.md
git commit -m "docs(audio): record picked sounds and music key"
```

Tell the controller G0 is done; the reviewer merges `docs/audio-g0`.
