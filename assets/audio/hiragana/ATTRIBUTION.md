# Hiragana audio — attribution & provenance

All 46 clips in this folder are human recordings from
**[Learn-Japanese-Adventure.com](https://www.learn-japanese-adventure.com/)**, by
Kia Leng Koh. One speaker across the whole set. Credited in-app on the Codex page
(`src/app/codex/page.tsx`).

This replaces the older mixed set, which paired five human-recorded vowels with 41
macOS `say` (Kyoko) clips. That older set and the generated-audio script are not kept
in the current tree; `src/lib/audio.ts` points to this folder.

**Permission granted, 25 July 2026.** Kia Leng Koh was asked by email and replied:

> You can use them in your application so long you give credit and link to my
> website.

The request asked about "the hiragana sounds" as a set, and the reply grants "them"
without narrowing to the vowels, so all 46 sit under the same grant. The site carries
"Copyright © 2010– by Kia Leng Koh, Learn-Japanese-Adventure.com. All Rights
Reserved." with no blanket public license, so this is a **specific, conditional grant
to Michi**, not a general licence.

**The two conditions are credit and a link back**, both met by the Credits footer on
the Codex page. They are load-bearing: removing the credit, or keeping the text while
dropping the `href`, breaks the terms. Do not "tidy" that footer away.

The request described Michi as "just a personal project and will likely remain that
way", and the permission was given against that description. **If Michi is ever
published commercially, ask again** rather than assuming this carries over.

The full exchange is archived in [`PERMISSION.md`](./PERMISSION.md).

## Processing

The source clips carry up to 0.6 s of silence before the voice, which reads as broken
latency when the glyph is tapped, and their levels drift by ~13 dB across the set, so
quiet kana (ん, く) sound faint next to loud ones (か, ま). Both are fixed here.

Each clip is, in one pass from the untrimmed originals:

1. **Head trimmed** to its speech (`silenceremove`, −50 dBFS peak threshold).
2. **Tail trimmed** the same way, leaving 30 ms of room.
3. **Loudness-normalized** to `I=-18 LUFS, TP=-1.5 dB, LRA=11`.
4. **Padded 15 ms** at the head so no onset is clipped by the trim.
5. **Faded out over 40 ms** at the true end of the clip.

Result across all 46: lead-in a uniform 15 ms (a few soft-onset kana — h/m/r/y —
measure 37–64 ms because the attack itself ramps in under the threshold), RMS spread
narrowed from ~13 dB to ~6 dB (−19.8 to −25.6), every peak under −2.4 dBFS.

Voiced span was compared before and after for every file; none lost speech. The
largest duration drop is ろ (1.52 s → 0.83 s), which was 0.57 s of leading and 0.16 s
of trailing silence — its 0.79 s of voice is intact.

### Correction: the trim removed stop-consonant onsets

The claim above is wrong for stop consonants. A k or t is produced by closing the vocal
tract and releasing it, so the recording legitimately begins with a near-silent closure
before the burst. The −50 dBFS threshold in step 1 sat above that closure, so the trim
cut into the consonant itself and the 15 ms pad in step 4 did not restore it. The result
was files that begin partway into the vowel.

Found by ear on the K-row station: き く け こ played as い う え お. か survived because
its burst is loud enough that more of the onset stayed above the threshold.

- **Repaired (1 August 2026):** か き く け こ, from newly supplied recordings. Trimmed
  with a −38 dBFS threshold and 40 ms of pre-roll so the closure and burst are kept,
  then peak-normalized to −3 dBFS to sit with the rest of the set.
- **Repaired (3 August 2026):** た and て, the last two affected clips, from fresh
  recordings using the same recipe. Both now open on three frames of true silence before
  the burst, matching the K row's profile, and `KNOWN_TRIMMED_ONSET` in
  `src/content/kana-audio.test.ts` is empty as a result.

No clip in the set now carries the defect. `src/content/kana-audio.test.ts` checks every
stop-consonant recording, so it cannot return unnoticed.

### Correction: ち and つ carried the opposite defect

Found by ear on 3 August 2026: both felt slow to respond when tapped. They were not
trimmed too tightly but not trimmed at all, carrying ~410 ms of room tone at −35 to
−55 dBFS in front of the voice. The −38 dBFS threshold in step 1 sat inside that noise
band, so the trim never fired on them.

The rest of the set reaches its sound within 110 ms. These two took 410 ms, which reads
as the app being slow rather than as a bad recording, and that is why listening to a
single clip never caught it.

- **First attempt (3 August 2026), wrong:** trimmed with a −30 dBFS head threshold. That
  threshold is above the affricate friction, not below it, so it removed ~60 ms of the
  consonant and つ played as "tu". The claim that it sat "below the affricate friction"
  was simply false, and the voiced-span check used to justify it measured energy above
  −30 dBFS, which is the vowel. It could not see the friction it was destroying.
- **Repaired (3 August 2026):** cut at a fixed offset just before the measured speech
  start instead (つ at 310 ms, ち at 360 ms), found by locating where energy first rises
  8 dB above the room-tone floor and stays there. A fixed cut is auditable; a threshold
  has to guess where friction begins, and guessed wrong. Tail trimmed at −55 dBFS.
  Energy above −30 dBFS now matches the originals exactly (つ 340 ms, ち 320 ms).

`src/content/kana-audio.test.ts` now measures time-to-sound on all 46 clips and fails
above 200 ms, so dead air cannot ship again. That check is per file rather than per sound
type: a vowel with 400 ms of hiss in front is just as late as an affricate with the same.

It also measures the friction ahead of the vowel in ち and つ, and fails under 60 ms. That
check exists because time-to-sound alone passed a broken repair: sound did start promptly,
it was simply the wrong sound.

### Correction: re-encoding at half the set's bitrate destroyed the friction

Found by ear, 3 August 2026: ち sounded like "gee" and つ like "du" even after the trim was
correct. The trims were fine. The re-encodes were not.

Every clip replaced that day was written at **48 kbps Opus**, against the set's ~100 kbps,
and mp3 `-q:a 4` against roughly `-q:a 2`. Opus spends its bits where they are
perceptually dominant, which is the vowel, so the high-frequency noise that distinguishes
an affricate from a plain stop was smeared away. Envelope measurements could not see this:
loudness was unchanged, and the defect is entirely spectral.

- **Repaired (3 August 2026):** た て ち つ re-encoded from the WAV masters at
  `libopus -b:a 96k -vbr on -compression_level 10` and `libmp3lame -q:a 2`, putting all
  four in the set's normal 100–128 kbps range. Decoded friction now matches the untouched
  originals frame for frame (つ peak +4.0 dB vs +4.2; ち +13.4 vs +13.5).

**When replacing any clip, check the output bitrate against a neighbour.** The trim recipe
above is only half the job; an encode at half the set's rate will pass every loudness check
and still teach the wrong consonant.

`kana-audio.test.ts` now measures the decoded spectrum for ち and つ, requiring 60 ms where
energy above 3 kHz exceeds energy below 1 kHz. Verified by re-encoding at 48 kbps, which
fails it. Every check in that file was confirmed against a defective file rather than
assumed to work.

### The real defect in ち and つ: no attack, and it is in the source

The trims and encodes above were all downstream of the actual problem. Comparing the
shipped つ against the untouched source gave a correlation of 0.9986 and identical energy
in every band: the processing was faithful, and the source recording is what sounds wrong.

Both clips have their friction. つ carries 105 ms of it, peaking 22 dB above the vowel
band. What they lack is an **attack**. The friction fades in gradually rather than being
released, so no stop is audible, and the ear hears つ as "tu" and ち as "gee". Measured as
the steepest rise over 15 ms: た, a plain stop, reaches ~55 dB. ち and つ managed 17 and 18.

New recordings were not available, so both were reshaped from their own material:

1. Cut to the measured friction onset, discarding the gradual fade-in (つ 40 ms, ち 20 ms).
2. Prepend 60 ms of true silence, supplying the stop closure.
3. Apply an 8 ms square-root attack ramp so the friction arrives rather than creeps.

No audio was borrowed or synthesised; た has no isolable burst to graft, and none was used.
The result rises 62 dB (つ) and 63 dB (ち), above た's 55 dB, with friction unchanged at
105 ms and 85 ms. Confirmed by ear before shipping.

`kana-audio.test.ts` checks this too, requiring a 40 dB rise for affricates. Verified
against the fade-in versions, which fail at 17 and 18 dB.

**These two clips are reshaped, not original.** If replacement recordings ever become
available, prefer them: the closure here is silence rather than a real one.

### Measured state of the full set, 3 August 2026

All 46 clips were decoded and their onset, peak and rise measured. Summarised so a future
reader does not have to redo it:

| Group | Onset | Reading |
|---|---|---|
| か き く け こ, た て | −99 dBFS | Repaired. True closure silence, then a burst. |
| と | −51 dBFS | Original, and correct: quiet then rising. |
| さ し す せ そ, ち, つ | −29 to −43 dBFS | Fricatives and affricates. Correct for their type. |
| な行, ま行, ら行, わ, ん | −17 to −26 dBFS | Nasals and liquids. They have no closure burst to lose. |
| あいうえお, は行, や ゆ よ, を | −5 to −19 dBFS | Legitimately start loud. Nothing to trim off. |

The processed clips are committed here, but the downloaded untrimmed source files are
not kept in the repository. The following command records the processing recipe; it
requires separately restoring those source files into `../5-vowels/` and `../rows/`:

```sh
TRIM="silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0:detection=peak,\
areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03:detection=peak,areverse,\
loudnorm=I=-18:TP=-1.5:LRA=11"

for f in ../5-vowels/kanasound-*.mp3 ../rows/kanasound-*.mp3; do
  b=$(basename "$f" .mp3); id="hira_${b#kanasound-}"
  ffmpeg -v error -y -i "$f" -af "$TRIM" -ar 44100 -ac 1 "/tmp/$id.wav"
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "/tmp/$id.wav")
  st=$(python3 -c "print(max(0,$d-0.04))")
  ffmpeg -v error -y -i "/tmp/$id.wav" \
    -af "afade=t=out:st=$st:d=0.04:curve=tri,adelay=15" \
    -ar 44100 -ac 1 -b:a 128k "$id.mp3"
done
```

> Anchor the fade at `duration - 0.04`, not at `st=0`. Fading from zero attenuates the
> whole clip; it silently drops peaks to around −53 dBFS and the files still play.

### Then: Opus, because mp3 cannot start at zero

mp3 pads its first frame, so every clip above still sits behind ~25 ms of silence that
the decoder dutifully plays. Combined with the 15 ms head pad, that put 40 ms in front
of every tap, which reads as lag on a tap-the-glyph interaction. Re-encoding does not
help: the padding is structural, and `start_time` stays 0.025 whatever you do.

Opus carries exact priming metadata, so `start_time` is 0 and the voice begins on the
first sample. The `.webm` files are the shipped set; the `.mp3`s stay as the fallback
for Safari older than 15 (`src/lib/audio.ts` picks per browser via `canPlayType`).
Both formats must exist for every id — the tests assert each separately.

```sh
for f in *.mp3; do
  ffmpeg -v error -y -i "$f" -af "atrim=start=0.015,asetpts=PTS-STARTPTS" \
    -c:a libopus -b:a 64k -vbr on -application audio "${f%.mp3}.webm"
done
```

`atrim=start=0.015` removes the 15 ms head pad added above; keeping it would just move
the delay into the new format. Use `-application audio`, not `voip` — voip is tuned for
intelligibility at low bitrate and colors the timbre. Checked against the mp3 sources by
waveform correlation: 0.97–0.99, transparent for speech. The set is 552 KB vs 1.1 MB.

## If Michi stops being free

The grant assumes non-commercial use. If that changes, re-ask Kia Leng Koh, or
replace the files from a source with explicit commercial rights — Google Cloud TTS (1M
chars/month free; the whole gojūon is ~50 characters) or a native voice actor
(see [docs/design/audio.md](../../../docs/design/audio.md)).

Because every file is keyed to the `id` in `src/content/hiragana.ts`, swapping the
source is a file-replacement operation. No code changes — `src/lib/audio.ts` is
deliberately agnostic about where the mp3s came from.
