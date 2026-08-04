# Where this was left

Written 2026-08-03, at the end of the session that created this repo.

## What happened

The web app was frozen and this repo was scaffolded from it. `../michi` is now reference
only: `main` holds everything, tagged `web-reference`, pushed. Nothing further should be
built there.

What came across, and how it went, is in `README.md`. The short version: the content, SRS,
learning, and course-map layers were pure TypeScript with no DOM and no React, so they
copied unchanged and 197 of the web build's 205 tests pass as they are. `learner-state.ts`
needed one function swapped. `audio.ts` was a real port and has its own write-up in
`docs/audio-port.md`.

## The one thing to do first

**Run the audio spike on a physical phone.**

```sh
npx expo run:ios --device
```

Nothing in the audio layer has been heard on hardware. It typechecks and it bundles; that
is all that is proven. Everything else in this repo is either copied code that already had
tests or a scaffold decision that is cheap to revisit. This is the only open question that
could change the plan, which is why it should come before any UI work.

Listen for:

- a tap sounds the instant your finger lands, with no perceptible gap
- ち does not sound like "gee"; つ does not sound like "du"
- spamming one glyph overlaps and retriggers, never queues
- えき plays as one utterance, not reassembled syllables

If it sounds wrong, `docs/audio-port.md` lists the suspects in order. The most likely one
is that dropping webm for mp3-only reintroduced mp3's ~25 ms of first-frame padding, which
the web build deliberately avoided. The fix for that is re-encoding the set, not re-tuning
the clips by ear a second time.

`app/index.tsx` is the spike. It is deliberately unstyled so it does not get mistaken for
the start of the UI. Delete it once it has done its job.

## Things you will hit

**Expo Go will not run this.** It is a prebuilt binary from the App Store and it does not
contain `react-native-audio-api` or `react-native-mmkv`, so it throws as soon as
`audio.ts` is imported. This is not about phone vs simulator: Expo Go runs on your phone
fine, it just is not *your* binary. A development build is, and after the first one the
`npm start` loop is identical.

**No iOS simulator runtimes are installed.** `xcodebuild -downloadPlatform iOS` fixes it
(several GB). Not needed for the audio test, and actively misleading for it, since the
simulator routes audio through the Mac. Worth having later for layout work.

**Do not trust remembered Expo APIs.** This scaffold was bitten twice in one session:
`react-native-mmkv` v4 replaced `new MMKV()` with `createMMKV()`, and
`decodeAudioDataSource` turned out to exist only on the web context type. Read the
installed `.d.ts` files. The Expo skills in `.claude/skills/` and `.agents/skills/` exist
for the same reason.

## After the audio is confirmed

Nothing here is decided. In rough order of what unblocks what:

1. **Project structure**, before any UI lands. The `expo-project-structure` skill covers
   the `src/` and routes-only `app/` layout this scaffold has only half adopted.
2. **The design system.** This is the founder's original ask and the reason for the
   rebuild. `../michi/DESIGN.md` doctrine carries over; its CSS does not. The web build's
   real problem was never the button layer, which was fine, but that `track1-page.tsx` was
   1848 lines with 90 inline class strings and nothing between `Button` and a whole page.
   The primitives worth having early are roughly: a screen frame, a card, a clamped kana
   glyph, and an answer-option grid.
3. **The world map.** Keep its information architecture (province → track → station, two
   bounded lists rather than one endless one) — that is why it still works at 50+ tracks.
   The rendering is open. `react-native-skia` plus gesture-handler and reanimated is the
   combination that would make it better on native rather than merely equivalent.
4. **The station runner.** `../michi/DEV-OVERVIEW.md` already plans this as the component
   that consumes `station-spec.ts`. Worth following that plan rather than improvising a
   parallel one, since the specs came across intact.

## Loose ends

- GitHub flagged one moderate dependabot advisory on this repo, inherited from the Expo
  scaffold's dependency tree. Not urgent pre-UI, worth clearing before shipping.
- `src/content/_pending/station-copy.test.ts.pending` is the one test not running. It
  guards the 30-word station copy rule by reading the web components. See that directory's
  README: the preferred fix is moving station copy out of components into content files,
  which would decouple the test from the UI entirely.
- `skills-lock.json` does not record which agent directories skills were installed to, so
  reinstalling from the lockfile alone may not recreate both. The full command is in
  `AGENTS.md`.
