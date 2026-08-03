/**
 * Audio — plays local kana clips and complete word/sentence recordings.
 *
 * Ported from the web build with its structure intact. See `../../docs/audio-port.md`
 * for what changed and why.
 *
 * Kana clips live in assets/audio/hiragana/<itemId>.mp3. Complete AI-voiced utterances
 * live in assets/audio/words/ and are played as single recordings; words must never be
 * reconstructed by overlapping isolated kana clips. Offline-first: they ship inside the
 * app bundle, no network at play time. A missing clip is a silent no-op, so the app
 * stays usable while the set is completed.
 *
 * These licensed human recordings are suitable for the current personal, non-commercial
 * build. A later native-voice production pass can replace the same files by id without
 * changing this code. See THIRD-PARTY-NOTICES.md.
 *
 * ## Why the Web Audio API, still
 *
 * The character IS the sound: you tap あ and you should hear あ. The web build chose Web
 * Audio over `HTMLAudioElement` because `play()` is asynchronous by contract and costs
 * tens to hundreds of variable milliseconds. `expo-av` and `expo-audio` have the same
 * shape as the API that was rejected, so this uses `react-native-audio-api`, which
 * implements the Web Audio spec natively: clips decode once into memory and starting one
 * is a buffer hookup.
 *
 * The tradeoff is unchanged: decoded audio lives in memory. 46 clips of ~1.3 s mono at
 * 48 kHz is roughly 11 MB of Float32 — fine for this set, worth re-checking if the
 * library ever grows to thousands of clips.
 *
 * ## What is NOT yet verified
 *
 * The web build's clip timing was tuned against a browser's output latency. The attack
 * transients on ち and つ in particular were reshaped by ear. Whether that tuning
 * survives on-device output latency is an open question that only a real device answers.
 */

import { AudioContext, type AudioBuffer } from "react-native-audio-api";

/**
 * Anything keyed by a kana id can be played — a Kana, or a Syllable of an example word.
 * Only the id is ever used, so asking for more would force callers to invent fields they
 * do not have.
 */
type Playable = { id: string };

/** Decoded clips, keyed by id. Decode happens once; every later tap is a buffer hookup. */
const buffers = new Map<string, AudioBuffer>();
/** In-flight load+decode, so priming twice does not read the asset twice. */
const pending = new Map<string, Promise<AudioBuffer | null>>();

let ctx: AudioContext | null = null;

/**
 * The context is created lazily. Unlike the browser there is no suspended-until-gesture
 * rule to satisfy, so this is simply a one-time construction.
 */
function context(): AudioContext | null {
  ctx ??= new AudioContext();
  return ctx;
}

/**
 * Bundled clips are addressed by Metro module id rather than by path, so the require map
 * below is deliberate: Metro resolves `require` calls statically at build time and cannot
 * follow a computed path. This is the one place the asset layout is spelled out.
 *
 * `audioSrc` values in content files stay URL-shaped ("/audio/words/eki-station.mp3")
 * because they are stable content ids shared with the web build. This maps them onto the
 * bundle.
 */
const WORD_MODULES: Record<string, number> = {
  "/audio/words/camera.mp3": require("../../assets/audio/words/camera.mp3"),
  "/audio/words/eki-station.mp3": require("../../assets/audio/words/eki-station.mp3"),
  "/audio/words/karaoke.mp3": require("../../assets/audio/words/karaoke.mp3"),
  "/audio/words/michi.mp3": require("../../assets/audio/words/michi.mp3"),
  "/audio/words/tsunami.mp3": require("../../assets/audio/words/tsunami.mp3"),
  "/audio/words/watashi.mp3": require("../../assets/audio/words/watashi.mp3"),
  "/audio/words/yama.mp3": require("../../assets/audio/words/yama.mp3"),
};

/**
 * Kana clips, keyed by item id. Generated into this file rather than resolved at runtime
 * for the same Metro reason as the words above.
 */
const KANA_MODULES: Record<string, number> = {
  hira_a: require("../../assets/audio/hiragana/hira_a.mp3"),
  hira_chi: require("../../assets/audio/hiragana/hira_chi.mp3"),
  hira_e: require("../../assets/audio/hiragana/hira_e.mp3"),
  hira_fu: require("../../assets/audio/hiragana/hira_fu.mp3"),
  hira_ha: require("../../assets/audio/hiragana/hira_ha.mp3"),
  hira_he: require("../../assets/audio/hiragana/hira_he.mp3"),
  hira_hi: require("../../assets/audio/hiragana/hira_hi.mp3"),
  hira_ho: require("../../assets/audio/hiragana/hira_ho.mp3"),
  hira_i: require("../../assets/audio/hiragana/hira_i.mp3"),
  hira_ka: require("../../assets/audio/hiragana/hira_ka.mp3"),
  hira_ke: require("../../assets/audio/hiragana/hira_ke.mp3"),
  hira_ki: require("../../assets/audio/hiragana/hira_ki.mp3"),
  hira_ko: require("../../assets/audio/hiragana/hira_ko.mp3"),
  hira_ku: require("../../assets/audio/hiragana/hira_ku.mp3"),
  hira_ma: require("../../assets/audio/hiragana/hira_ma.mp3"),
  hira_me: require("../../assets/audio/hiragana/hira_me.mp3"),
  hira_mi: require("../../assets/audio/hiragana/hira_mi.mp3"),
  hira_mo: require("../../assets/audio/hiragana/hira_mo.mp3"),
  hira_mu: require("../../assets/audio/hiragana/hira_mu.mp3"),
  hira_n: require("../../assets/audio/hiragana/hira_n.mp3"),
  hira_na: require("../../assets/audio/hiragana/hira_na.mp3"),
  hira_ne: require("../../assets/audio/hiragana/hira_ne.mp3"),
  hira_ni: require("../../assets/audio/hiragana/hira_ni.mp3"),
  hira_no: require("../../assets/audio/hiragana/hira_no.mp3"),
  hira_nu: require("../../assets/audio/hiragana/hira_nu.mp3"),
  hira_o: require("../../assets/audio/hiragana/hira_o.mp3"),
  hira_ra: require("../../assets/audio/hiragana/hira_ra.mp3"),
  hira_re: require("../../assets/audio/hiragana/hira_re.mp3"),
  hira_ri: require("../../assets/audio/hiragana/hira_ri.mp3"),
  hira_ro: require("../../assets/audio/hiragana/hira_ro.mp3"),
  hira_ru: require("../../assets/audio/hiragana/hira_ru.mp3"),
  hira_sa: require("../../assets/audio/hiragana/hira_sa.mp3"),
  hira_se: require("../../assets/audio/hiragana/hira_se.mp3"),
  hira_shi: require("../../assets/audio/hiragana/hira_shi.mp3"),
  hira_so: require("../../assets/audio/hiragana/hira_so.mp3"),
  hira_su: require("../../assets/audio/hiragana/hira_su.mp3"),
  hira_ta: require("../../assets/audio/hiragana/hira_ta.mp3"),
  hira_te: require("../../assets/audio/hiragana/hira_te.mp3"),
  hira_to: require("../../assets/audio/hiragana/hira_to.mp3"),
  hira_tsu: require("../../assets/audio/hiragana/hira_tsu.mp3"),
  hira_u: require("../../assets/audio/hiragana/hira_u.mp3"),
  hira_wa: require("../../assets/audio/hiragana/hira_wa.mp3"),
  hira_wo: require("../../assets/audio/hiragana/hira_wo.mp3"),
  hira_ya: require("../../assets/audio/hiragana/hira_ya.mp3"),
  hira_yo: require("../../assets/audio/hiragana/hira_yo.mp3"),
  hira_yu: require("../../assets/audio/hiragana/hira_yu.mp3"),
};

function loadModule(key: string, moduleId: number | undefined): Promise<AudioBuffer | null> {
  const existing = pending.get(key);
  if (existing) return existing;

  const ac = context();
  if (!ac || moduleId === undefined) return Promise.resolve(null);

  // `decodeAudioData` takes a Metro module id directly (DecodeDataInput is
  // `number | string | ArrayBuffer`), so a bundled clip needs no asset resolution step.
  // A missing clip resolves to null rather than throwing: the lesson stays usable.
  const task = ac
    .decodeAudioData(moduleId)
    .then((buf) => {
      buffers.set(key, buf);
      return buf;
    })
    .catch(() => null);

  pending.set(key, task);
  return task;
}

function load(id: string): Promise<AudioBuffer | null> {
  return loadModule(id, KANA_MODULES[id]);
}

/** Play a kana's recording. Tapping again restarts it (spammable). No-op if missing. */
export function play(kana: Playable): void {
  const ac = context();
  if (!ac) return;

  const buf = buffers.get(kana.id);
  if (buf) {
    start(ac, buf);
    return;
  }
  // Not primed yet (or priming still in flight) — play as soon as it lands.
  void load(kana.id).then((b) => b && start(ac, b));
}

/**
 * How long a sound waits when it plays because a step appeared, rather than because the
 * learner asked for it.
 *
 * A tap should sound instantly: the finger is the cue, and any delay reads as lag. A
 * slide arriving is different. The sound is the prompt, so it must not reach the ear
 * before the thing it belongs to is on screen. Firing inside the same frame as the render
 * means the audio starts while the view is still being laid out and the learner hears the
 * question before they can see it.
 *
 * 120 ms cleared a paint and the step transition on the web. Whether the same figure
 * suits a native transition is worth re-checking on a device.
 */
export const STEP_AUDIO_DELAY_MS = 120;

/**
 * Play a kana's recording once the step it belongs to has had a moment to appear.
 * Returns a cleanup function, so a learner who moves on quickly does not hear the sound
 * of a step they already left.
 */
export function playOnStepAppear(kana: Playable): () => void {
  const timer = setTimeout(() => play(kana), STEP_AUDIO_DELAY_MS);
  return () => clearTimeout(timer);
}

/** The same appearance delay for a full word or sentence recording. */
export function playRecordingOnStepAppear(source: string): () => void {
  const timer = setTimeout(() => playRecording(source), STEP_AUDIO_DELAY_MS);
  return () => clearTimeout(timer);
}

/** Play a complete word or sentence recording shipped with the app. */
export function playRecording(source: string): void {
  const ac = context();
  if (!ac) return;

  const key = `recording:${source}`;
  const buf = buffers.get(key);
  if (buf) {
    start(ac, buf);
    return;
  }

  void loadModule(key, WORD_MODULES[source]).then((loaded) => loaded && start(ac, loaded));
}

function start(ac: AudioContext, buf: AudioBuffer): void {
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  // Overlapping taps are the point: each tap is its own node, so spamming a glyph
  // retriggers instantly rather than waiting for the previous one to be rewound.
  src.start();
}

/**
 * Decode the clips for a set of kana ahead of time, so the first tap is instant. The web
 * build did this on an early user gesture to satisfy the browser's autoplay rule; here it
 * is purely a latency measure and can run whenever a station knows its pool.
 */
export function primeAudio(pool: Playable[]): void {
  if (!context()) return;
  for (const k of pool) if (!buffers.has(k.id)) void load(k.id);
}
