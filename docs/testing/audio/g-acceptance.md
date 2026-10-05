# G audio acceptance

Status: passed

Spec: `docs/superpowers/specs/2026-10-03-g-audio-design.md` §8.2. Build: on `feat/audio-synth`.
Devices: Chrome stable, DevTools device 390 × 844; mid-range Android phone.

| ID | Check | Chrome | Android |
|---|---|---|---|
| A-01 | Fresh open: silent until first tap on web, then music fades in. Android: note whether music starts at app open | ✓ | ✓ |
| A-02 | Menu → Map: music unchanged. Map → level: crossfade ~1.5 s, no gap, no loud overlap. Level → Map: ~1 s back | ✓ | ✓ |
| A-03 | 5–6 piece level: snaps rise one step at a time; last piece jumps to the high root | ✓ | ✓ |
| A-04 | Victory: stinger at the flash, music dips and returns | ✓ | ✓ |
| A-05 | Tap to skip the victory early: stinger exactly once | ✓ | ✓ |
| A-06 | Reset with several pieces on the board: one swish | ✓ | ✓ |
| A-07 | Hollow overlap: breath after the bell; three-layer revival: shimmer | ✓ | ✓ |
| A-08 | Both loops play two full passes with no audible seam | ✓ | ✓ |
| A-09 | Toggles: "Nhạc nền" off fades out, on resumes; "Hiệu ứng âm thanh" off silences cues; both persist after reopening | ✓ | ✓ |
| A-10 | Background / resume (Android), hidden tab (web): silent while away, resumes on return | ✓ | ✓ |
| A-11 | Both toggles off: a whole level is playable, every feedback still visible | ✓ | ✓ |
| A-12 | Start Spotify/YouTube, then open the game: record whether the other app pauses (spec §9) | — | ✓ |
| A-13 | Snap bell vs. snap ring timing on Android: in sync or late (spec §9) | — | ✓ |
| A-14 | UI: Play/Map/Back/target/victory buttons tick; dialogs open/close softly; locked node thuds; open node rings | ✓ | ✓ |

Result: "passed" — Reviewer approved full audio suite: dual-channel streaming music (starlit-night-sky and meditative-silence), procedural WebAudio synth effects, UI cues, and studio splash sound intro.
