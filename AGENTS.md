# Michi RN agent instructions

This is the React Native rebuild of Michi. The web app at `../michi` is **frozen
reference**, tagged `web-reference`. Read `README.md` here first, then reach into
`../michi` for anything this repo does not yet answer.

## Expo has changed

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing
any code. Do not rely on remembered Expo or React Native APIs: this scaffold has already
been bitten twice, by `react-native-mmkv` v4 replacing `new MMKV()` with `createMMKV()`,
and by `decodeAudioDataSource` existing only on the web context type. Check the installed
`.d.ts` files in `node_modules` rather than trusting recall.

## Expo skills

The official Expo agent skills (from https://github.com/expo/skills, MIT) are installed
twice, once per agent:

```
.claude/skills/   Claude Code
.agents/skills/   Codex
```

Both are **real files, not symlinks** — installed with `--copy` on purpose. The CLI
symlinks by default, which is fine locally but commits a bare pointer that dangles on a
fresh clone or in CI. Duplicate files are what git and CI expect; nobody hand-edits these
anyway.

Use them: they exist precisely because remembered Expo knowledge goes stale. The ones
most relevant to the work ahead:

- `expo-project-structure` — `src/` layout and routes-only `app/`, before the UI lands.
- `expo-router` — navigation, native stacks, modals, tabs.
- `expo-native-ui` — native-feeling styling, semantic colors, animations. Read this
  before reaching for web-CSS habits.
- `expo-upgrade` — SDK upgrades.

Update both copies with `npx skills@latest update`. They are committed rather than
ignored, so the versions are pinned with the project.

`skills-lock.json` records each skill's source and content hash, but **not** which agent
directories it was installed to. So restoring from the lockfile alone may not recreate
both locations. To reinstall from scratch, repeat the original command:

```sh
npx skills@latest add expo/skills --skill '*' --agent claude-code --agent codex --copy -y
```

Note that `--agent` must be repeated per agent; a comma-separated list is rejected.

Their telemetry is opt-in and off by default; nothing is sent unless someone explicitly
runs `telemetry.cjs --on`. Leave it off unless the founder asks otherwise.

## Sources of truth

- The working application is the truth about what is implemented.
- `README.md` is the concise current project description.
- `docs/audio-port.md` records what changed in the audio layer and what is unverified.
- `../michi/PRODUCT.md` remains the strategic product truth.
- `../michi/DESIGN.md` is the web design system. Its **doctrine** carries over; its
  pixels do not. See "UI is a clean slate" below.
- `../michi/PLAN.md` and `../michi/DEV-OVERVIEW.md` describe the learning system and its
  planned boundaries. Both still apply: the content and learning layers were copied here
  unchanged.
- `../michi/REFERENCE.md` is a historical archive. Do not treat an archived proposal as
  an accepted requirement.

When code, current documentation, and a user request disagree, surface the difference
plainly. Do not silently choose the archived version.

## Working with the founder

- Keep explanations short and concrete.
- Work one phase and one meaningful decision at a time.
- Explain unfamiliar learning or technical terms in ordinary language.
- Do not broaden a narrow request into a product rewrite.
- Preserve working behavior before restructuring it.
- Ask before committing unrelated existing changes.

## Learner-facing work

These rules are unchanged from the web build and are not up for renegotiation because the
platform changed.

- Each screen should have one clear learning job.
- Give the learner enough exposure and guidance before testing recall.
- Do not use romaji as a reading or pronunciation aid.
- Do not use streaks, points, lives, guilt, or punishment mechanics.
- Keep feedback calm and make mistakes useful.
- Do not use unexplained jargon or unexplained Japanese.
- Do not use em dashes in learner-facing copy.
- Keep station copy short: at most 30 words and 2 sentences per slide. Stepping through a
  station should feel like moving, not reading. The test that enforced this is parked at
  `src/content/_pending/` until the RN station components exist.
- A completion claim may only state what the station actually verified. Speaking and
  writing are rehearsed but ungraded, so they never appear in a capability sentence.
- Preserve accessible focus, reduced motion, and adequate touch targets.

## UI is a clean slate

Nothing about the visual design is settled. The web CSS was not ported and should not be
ported line by line: it encodes browser-specific solutions to problems React Native does
not have.

What **does** carry over from `../michi/DESIGN.md` is the doctrine, because it is product
thinking rather than styling:

- The Learning Line: transit-wayfinding clarity, calm, one obvious forward action.
- Yellow marks forward movement or the current teaching focus, never decoration.
- State is carried by shape and label, never by color alone.
- Track colors identify grouping, not importance.
- Minimum 44pt touch targets.

What carries over from the world map is its **information architecture** — province →
track → station, with two bounded lists rather than one endless one. That structure is
why the map still works at 50+ tracks. Reimagine the rendering freely; keep the shape.

`app/index.tsx` is an unstyled audio spike, not the beginning of the UI. Replace it.

## Verification

```sh
npm test          # vitest, the platform-agnostic layer
npm run typecheck # tsc --noEmit
```

Run a bundle check when assets, native modules, or entry points change:

```sh
npx expo export --platform ios --output-dir /tmp/michi-check
```

Anything touching audio timing needs a real device. The simulator is not evidence.
