# Status — updated 2026-10-05 by Antigravity (studio splash sound and pacing added, synced)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/audio-synth` (fast-forwarded with `main` @ `6f48e79`). Working directory D:\Working\ASOL\ASOL-GAME-02.
- Studio splash intro: enhanced with synchronized WebAudio synth cues (folding ticks, mirror bar swish, sweep shimmer & center gem chime), sweep slowed to 1600ms, presence ~5.8s, tap-to-skip added.
- Android & Web assets synced via Capacitor.
- Next step: GS Task 9b (music asset sourcing & metadata) awaiting reviewer tracks, then final audio acceptance checks.
- Verified: typecheck clean, 84 files / 1036 tests pass, `npm run build` clean, `npm run android:sync` clean.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete, accepted and on `main`; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | GS1 & GS2 complete; splash intro audio added; Task 9b waits on music tracks | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | G2 complete; music tracks pending in Task 9b | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- GS Task 9b cannot commit green until the reviewer supplies the two music tracks and states their key — `MUSIC_ASSETS`'s `source` rows are deliberately blank and the manifest test asserts they are filled.
- Retuning a sound later: tune in the Audio Lab (`npm run dev`, `/audiolab.html`), press Copy as TypeScript, paste the patch body into `src/content/audio/sources/<key>.ts`, then re-run `npm run audio:author -- --all`.
- F3: approved, not started; the reviewer performs its Android/device checks during later execution.

## Gotchas learned recently

- `SplashScene` audio: triggers via `audioServices(this).sfx.play(...)` scheduled with `this.time.delayedCall`, falling back gracefully to `SILENT_AUDIO` if called before `ready`.
- A constant used by modules that a barrel file imports must live in its own leaf module (`src/content/audio/root.ts`).
- `vite.config.ts` lists only `index.html` under `build.rollupOptions.input`, so an extra root `*.html` page (`studio.html`, `audiolab.html`) ships nothing in `dist/`.
- Synth renders are deterministic end to end — re-running `npm run audio:author -- --all` leaves `git status` empty.
- Android debug build in sandbox may fail if Gradle cache lock is held outside sandbox; bypass sandbox mode or clean locks.
- `AUDIO_REGISTRY_KEY = 'audio'` in `game.registry`: calls before `ready` fall back to `SILENT_AUDIO` without throwing.
- Sound effect triggers: UI sounds route via `playUiCue(scene, event)`; gameplay snaps calculate pentatonic step from `placedCount`.
