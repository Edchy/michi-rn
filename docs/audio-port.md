# Audio port notes

`src/lib/audio.ts` is the highest-risk file in the port. This records what changed, what
did not, and what is still unverified.

## Why this file was ported first

The web build's header explains the choice it made: the character IS the sound, so a tap
must produce audio immediately. `HTMLAudioElement.play()` is asynchronous by contract and
costs tens to hundreds of variable milliseconds, so the web build used the Web Audio API,
where a clip decodes once and starting it is a buffer hookup.

`expo-av` and `expo-audio` have the same shape as the API that was rejected. Using them
would silently undo a deliberate decision and degrade the core interaction. So this uses
`react-native-audio-api`, which implements the Web Audio spec natively.

That choice is the reason the port is small: the structure below is the web file's, with
only the asset layer swapped.

## What did not change

- The module's public surface: `play`, `playRecording`, `playOnStepAppear`,
  `playRecordingOnStepAppear`, `primeAudio`, `STEP_AUDIO_DELAY_MS`.
- The `buffers` / `pending` decode-once caches.
- `start()` creating a fresh `AudioBufferSourceNode` per tap, so spamming a glyph
  overlaps and retriggers instead of queueing.
- `STEP_AUDIO_DELAY_MS = 120`, and the reasoning behind it.
- Content `audioSrc` values, which stay URL-shaped ("/audio/words/eki-station.mp3").
  They are stable content ids shared with the web build, not paths.

## What changed

| Web | Native | Why |
|---|---|---|
| `fetch(url)` → `arrayBuffer` → `decodeAudioData` | `decodeAudioData(moduleId)` | `DecodeDataInput` is `number \| string \| ArrayBuffer`, and a Metro module id is a number. No asset resolution step needed, so `expo-asset` was installed and then removed. |
| `extension()` picking webm/mp3 | mp3 only | The Opus-vs-mp3 branch existed for Safari support. One platform, one format. Only the mp3s were copied; the webm files stayed behind. |
| Context resumed on user gesture | Context created lazily | The browser autoplay rule has no native equivalent. |
| Path-derived clip URLs | `KANA_MODULES` / `WORD_MODULES` maps | Metro resolves `require` statically and cannot follow a computed path, so the asset layout is spelled out once. |

The module maps are verified complete: all 46 kana ids and 7 word paths match the files in
`assets/audio/`, checked both directions, and all 53 appear in an `expo export` bundle.

## The mp3 first-frame caveat

The web file notes that mp3 pads its first frame, putting ~25 ms of silence in front of
every clip, and that Opus was preferred because it starts on sample zero. Dropping webm
means **every clip now carries that padding**.

This may be inaudible, or it may partly undo the attack-transient work done on ち and つ.
It is the single most likely cause if the clips feel late or soft on device. If so, the
fix is to re-encode the set to a format without the padding rather than to re-tune by ear
a second time.

## Not yet verified

**None of this has been heard on a physical device.** It typechecks and it bundles; that
is all that is currently proven.

The web build's clip timing was tuned by ear against a browser's output latency, and the
last five commits before the freeze reshaped the attack transients on ち and つ
specifically. Whether that tuning survives native output latency is the open question the
spike screen exists to answer.

`app/index.tsx` is that spike. What to listen for:

- a tap sounds immediately, with no perceptible gap after the finger
- ち does not sound like "gee"; つ does not sound like "du"
- spamming one glyph retriggers instantly and overlaps, never queues
- えき plays as one utterance, not as reassembled syllables

If the timing is off, suspects in order: the mp3 padding above, then output latency
needing a lower `STEP_AUDIO_DELAY_MS`, then the clips themselves.

## The corresponding test

`src/content/kana-audio.test.ts` (62 assertions) checks the clips as *files* — that every
kana has one, that consonants survive encoding, that there is no dead air in front. It
passes here because it reads `assets/audio/hiragana` off disk, and it is worth keeping
green: it guards the recordings independently of how they are played.
