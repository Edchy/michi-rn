# 道 Michi (React Native)

Michi is a Japanese-learning app for a beginner. It should teach durable, useful Japanese
without streaks, points, punishment, or other engagement tricks.

This repository is the native rebuild. The web app at `../michi` is frozen reference,
tagged `web-reference`.

**Starting a session?** Read `docs/next-session.md` first. It says where this was left,
what to do first, and what is not decided yet.

## Current state

This is a **scaffold**, not a playable app. What exists:

- The complete platform-agnostic learning layer, copied from the web build and passing
  its own tests unchanged.
- The audio layer ported to native, typechecking and bundling but **not yet heard on a
  device**.
- An unstyled audio spike screen (`app/index.tsx`) whose only job is to answer whether
  the clip timing survived the port.

There is no map, no station, no design system, and no UI worth the name. That is
deliberate: the UI is a clean-slate decision that has not been made yet.

## What was carried over

| Layer | Files | Status |
|---|---|---|
| Content | `src/content/` | Copied unchanged |
| SRS engine | `src/srs/` | Copied unchanged |
| Learning system | `src/learning/` | Copied unchanged |
| Course map data | `src/course/worldmap.ts` | Copied, import path updated |
| Learner state | `src/lib/learner-state.ts` | One function swapped: localStorage → MMKV |
| Audio | `src/lib/audio.ts` | Ported, see `docs/audio-port.md` |
| Recordings | `assets/audio/` | 46 kana + 7 words, mp3 only |

The content, SRS, and learning layers import nothing from React Native and nothing from
the DOM. That is why they moved for free, and it is worth keeping true.

**197 of the web build's 205 tests pass here unmodified.** The 8 that do not are one
parked file, `src/content/_pending/station-copy.test.ts.pending`, which reads copy out of
the web station components. It is parked rather than deleted or stubbed, because the rule
it guards still applies. See that directory's README.

## What has NOT been verified

The audio timing. The web build tuned these recordings by ear against a browser's output
latency, and the last commits before the freeze reshaped the attack transients on ち and
つ specifically. Nothing here has been heard on physical hardware.

Dropping the webm/Opus clips also means every clip now carries mp3's ~25 ms of first-frame
padding, which the web build deliberately avoided. `docs/audio-port.md` covers this.

**Run the spike on a real device before building anything on top of this.**

## Running it

```sh
npm start           # then press i / a, or scan with Expo Go
npm test            # vitest, the platform-agnostic layer
npm run typecheck   # tsc --noEmit
```

Note that `react-native-audio-api` and `react-native-mmkv` are native modules, so Expo Go
will not run them. Use a development build:

```sh
npx expo run:ios
```

## Stack

Expo SDK 57, expo-router, TypeScript, vitest. `react-native-audio-api` for audio (Web
Audio API compatible, chosen deliberately over `expo-av` — see `docs/audio-port.md`).
`react-native-mmkv` for synchronous storage.

## Documentation

- `AGENTS.md` / `CLAUDE.md`: agent instructions, including the learner-facing rules.
- `docs/audio-port.md`: what changed in the audio layer and what is still unproven.
- `../michi/PRODUCT.md`: strategic product truth, still current.
- `../michi/PLAN.md`, `../michi/DEV-OVERVIEW.md`: the learning system and its boundaries.
- `../michi/DESIGN.md`: the web design system. Doctrine carries over, pixels do not.
