import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Kana audio has to actually contain the consonant it teaches.
 *
 * A stop consonant (k, t, p, g, d, b) is made by closing the vocal tract and releasing
 * it, so its recording MUST begin with near-silence and then jump. A file that starts
 * already loud has had its onset trimmed off, which leaves か sounding like あ. That is
 * exactly what happened to き, く, け and こ: they played as the bare vowels i, u, e, o
 * on the station teaching the K row, and nothing in the code was wrong. Only listening
 * caught it.
 *
 * Vowels and fricatives are deliberately not checked: they legitimately start loud (あ)
 * or quiet (さ), so onset level says nothing about whether they are correct.
 *
 * Skipped when ffmpeg is unavailable, so the suite still runs on a machine without it.
 */

const AUDIO_DIR = join(process.cwd(), "assets", "audio", "hiragana");
const FRAME_SECONDS = 0.01;
const SAMPLE_RATE = 16000;

/** Kana whose reading begins with a released stop, where closure silence is required. */
const STOP_ONSET = /^(k|g|t|d|p|b)/;
/** ち and つ are affricates: real recordings of them start quiet, so the rule differs. */
const AFFRICATE = /^(chi|tsu)/;

/**
 * Escape hatch for clips carrying the trimmed-onset defect that made き/く/け/こ play as
 * bare vowels. Empty, and should stay that way: た and て were the last two, replaced on
 * 3 August 2026 from fresh recordings using the same repair as the K row.
 *
 * If a future clip lands broken and cannot be replaced immediately, add its id here so
 * the defect is recorded rather than silently tolerated, and so a NEW regression still
 * fails the suite. The check below then fails once it is fixed, forcing the entry out.
 */
const KNOWN_TRIMMED_ONSET = new Set<string>();

function hasFfmpeg(): boolean {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Peak dBFS per 10 ms frame, decoded straight from the shipped file. */
function envelope(file: string): number[] {
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "f32le", "-"],
    { maxBuffer: 64 * 1024 * 1024, encoding: "buffer" },
  );

  const samples = new Float32Array(
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  );
  const frame = Math.round(SAMPLE_RATE * FRAME_SECONDS);
  const frames: number[] = [];
  for (let i = 0; i + frame <= samples.length; i += frame) {
    let peak = 0;
    for (let j = i; j < i + frame; j += 1) peak = Math.max(peak, Math.abs(samples[j]!));
    frames.push(peak > 1e-6 ? 20 * Math.log10(peak) : -99);
  }
  return frames;
}

/**
 * Read the ids from the audio folder rather than from the content layer: clips for the
 * whole 46 ship today while only the taught rows exist as `Kana`, and a recording is
 * wrong the moment it lands, not when a station finally uses it.
 */
/**
 * Per-frame energy in two bands, from the decoded file: above 3 kHz (friction) and below
 * 1 kHz (voicing). Uses ffmpeg's own bandpass filters rather than a hand-rolled DFT, so
 * the measurement is fast and the filter behaviour is not something this file has to own.
 */
function bandFrames(file: string): Array<{ high: number; low: number }> {
  const energies = (filter: string): number[] => {
    const raw = execFileSync(
      "ffmpeg",
      ["-v", "error", "-i", file, "-af", filter, "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "f32le", "-"],
      { maxBuffer: 64 * 1024 * 1024, encoding: "buffer" },
    );
    const samples = new Float32Array(
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
    );
    const frame = Math.round(SAMPLE_RATE * FRAME_SECONDS);
    const out: number[] = [];
    for (let i = 0; i + frame <= samples.length; i += frame) {
      let sum = 0;
      for (let j = i; j < i + frame; j += 1) sum += samples[j]! * samples[j]!;
      out.push(sum > 1e-12 ? 10 * Math.log10(sum / frame) : -99);
    }
    return out;
  };

  const high = energies("highpass=f=3000,highpass=f=3000");
  const low = energies("lowpass=f=1000,lowpass=f=1000");
  return high.map((value, i) => ({ high: value, low: low[i] ?? -99 }));
}

/** Every shipped clip id, for checks that apply regardless of the sound being taught. */
function allIds(): string[] {
  return readdirSync(AUDIO_DIR)
    .filter((name) => name.endsWith(".webm"))
    .map((name) => name.replace(/\.webm$/, ""))
    .sort();
}

function stopConsonantIds(): string[] {
  return readdirSync(AUDIO_DIR)
    .filter((name) => name.endsWith(".webm"))
    .map((name) => name.replace(/\.webm$/, ""))
    .filter((id) => {
      const reading = id.replace(/^hira_/, "");
      return STOP_ONSET.test(reading) && !AFFRICATE.test(reading);
    })
    .sort();
}

describe.skipIf(!hasFfmpeg())("kana recordings contain their consonant", () => {
  const stops = stopConsonantIds();

  it("covers the stop-consonant kana", () => {
    // Guards the discovery: an empty or tiny list must not quietly pass as "all good".
    expect(stops.length).toBeGreaterThanOrEqual(5);
    expect(stops).toContain("hira_ka");
  });

  it("only lists clips that are genuinely still broken", () => {
    // Keeps the allowance honest: once a file is replaced, this fails until the entry is
    // removed, so KNOWN_TRIMMED_ONSET cannot quietly hide a fixed clip or a stale name.
    for (const id of KNOWN_TRIMMED_ONSET) {
      expect(stops, `${id} is not a stop-consonant clip`).toContain(id);
      const frames = envelope(join(AUDIO_DIR, `${id}.webm`));
      expect(
        frames[0]!,
        `${id} now starts quietly, so it is fixed: remove it from KNOWN_TRIMMED_ONSET`,
      ).toBeGreaterThan(-25);
    }
  });

  /**
   * The opposite defect from a trimmed onset: dead air before the speech.
   *
   * ち and つ shipped with ~410 ms of room tone at −35 to −55 dBFS in front of the voice.
   * The set's own trim used a −38 dBFS threshold, and that noise sat right at it, so the
   * trim never fired. Nothing sounded wrong in isolation; it read as the app being slow
   * to respond to a tap, which is why measuring the whole set caught it and listening to
   * one clip did not.
   *
   * Measured across every clip rather than by sound type, because this is about the file,
   * not the phoneme: a vowel with 400 ms of hiss in front is just as late as an affricate
   * with the same. The rest of the set lands at or under 110 ms.
   */
  /**
   * ち and つ are affricates: a friction burst (the "ch", the "ts") that ramps up over
   * roughly 100 ms before the vowel arrives. That ramp is the consonant, and it is quiet
   * relative to the vowel, so any head trim aimed at the loud part will eat it.
   *
   * This check exists because that is exactly what happened. A first repair used a -30 dBFS
   * head threshold to strip room tone, which sat ABOVE the friction, so つ lost ~60 ms of
   * its onset and played as "tu". The time-to-sound check below passed it, because sound
   * did start promptly; it was just the wrong sound. Measuring quiet-but-present energy
   * ahead of the peak is what distinguishes the two.
   */
  it.each(allIds().filter((id) => AFFRICATE.test(id.replace(/^hira_/, ""))))(
    "%s keeps the friction that ramps in before its vowel",
    (id) => {
      const frames = envelope(join(AUDIO_DIR, `${id}.webm`));
      const peak = Math.max(...frames);
      const vowelAt = frames.findIndex((value) => value > peak - 10);
      // Frames before the vowel that carry real energy: the affricate's friction.
      const friction = frames
        .slice(0, vowelAt)
        .filter((value) => value > peak - 35 && value > -60);
      expect(
        friction.length * FRAME_SECONDS * 1000,
        `${id} has only ${(friction.length * FRAME_SECONDS * 1000).toFixed(0)} ms of friction before its vowel, so its consonant was trimmed off`,
      ).toBeGreaterThanOrEqual(60);
    },
  );

  /**
   * The friction has to survive ENCODING, not just trimming.
   *
   * An earlier repair kept the friction in the source but re-encoded the clips at 48 kbps
   * Opus, half the set's ~100 kbps. Opus spends its bits on the perceptually dominant
   * vowel, so the high-frequency noise that distinguishes ち from "gee" and つ from "du"
   * was smeared away. The waveform envelope still showed friction present, because
   * envelope measures loudness and this defect is spectral.
   *
   * So this measures the decoded spectrum: energy above 3 kHz must exceed energy below
   * 1 kHz somewhere before the vowel. That is what an affricate IS, and it is the only
   * check here that would have caught a lossy-encode regression.
   */
  it.each(allIds().filter((id) => AFFRICATE.test(id.replace(/^hira_/, ""))))(
    "%s keeps its high-frequency friction after encoding",
    (id) => {
      const frames = bandFrames(join(AUDIO_DIR, `${id}.webm`));
      const frictionFrames = frames.filter(({ high, low }) => high > low);
      expect(
        frictionFrames.length * FRAME_SECONDS * 1000,
        `${id} has ${(frictionFrames.length * FRAME_SECONDS * 1000).toFixed(0)} ms where high frequencies dominate; its friction was lost, most likely to a low encoder bitrate`,
      ).toBeGreaterThanOrEqual(60);
    },
  );

  /**
   * An affricate has to ARRIVE, not fade in.
   *
   * The last defect in this sequence: ち and つ held their friction and their spectrum,
   * but it ramped up gradually with no sharp edge, so the ear heard no stop at all and
   * read them as "gee" and "tu". Every other check here passed them.
   *
   * A released consonant rises steeply out of its closure. た, a plain stop, manages
   * ~55 dB over 15 ms. Requiring 40 dB keeps a clear margin below that while failing the
   * ~20 dB creep the originals had.
   */
  it.each(allIds().filter((id) => AFFRICATE.test(id.replace(/^hira_/, ""))))(
    "%s attacks sharply out of its closure",
    (id) => {
      const frames = envelope(join(AUDIO_DIR, `${id}.webm`));
      let steepest = -99;
      for (let i = 0; i + 2 < Math.min(frames.length, 40); i += 1) {
        steepest = Math.max(steepest, frames[i + 2]! - frames[i]!);
      }
      expect(
        steepest,
        `${id} rises only ${steepest.toFixed(0)} dB at its steepest, so it fades in rather than arriving: no audible stop`,
      ).toBeGreaterThanOrEqual(40);
    },
  );

  it.each(allIds())("%s starts promptly, with no dead air in front", (id) => {
    const frames = envelope(join(AUDIO_DIR, `${id}.webm`));
    const peak = Math.max(...frames);
    const loudAt = frames.findIndex((value) => value > peak - 20);
    expect(
      loudAt * FRAME_SECONDS * 1000,
      `${id} waits ${(loudAt * FRAME_SECONDS * 1000).toFixed(0)} ms before its sound`,
    ).toBeLessThanOrEqual(200);
  });

  it.each(stops.filter((id) => !KNOWN_TRIMMED_ONSET.has(id)))(
    "%s begins with closure silence, not mid-vowel",
    (id) => {
      const reading = id.replace(/^hira_/, "");
      const frames = envelope(join(AUDIO_DIR, `${id}.webm`));
      expect(frames.length, `${id} decoded to nothing`).toBeGreaterThan(5);

      const onset = frames[0]!;
      const peak = Math.max(...frames);

      // A released stop starts quiet and then jumps. Both halves matter: a file that is
      // quiet throughout would pass the rise check alone, and a loud-but-flat file (the
      // original bug) would pass the onset check alone.
      expect(onset, `${reading} (${id}) starts at ${onset.toFixed(0)} dBFS, so its consonant onset was trimmed off`).toBeLessThan(-25);
      expect(peak - onset, `${reading} (${id}) never rises: no consonant release`).toBeGreaterThan(15);
    },
  );
});
