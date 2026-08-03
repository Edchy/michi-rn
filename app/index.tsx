import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VOWELS, K_ROW } from "@/content/hiragana";
import { play, playRecording, primeAudio } from "@/lib/audio";

/**
 * Audio spike, not a design.
 *
 * The scaffold's one open question is whether the clip timing survives on-device output
 * latency. The web build tuned these recordings by ear against a browser's audio clock,
 * and ち and つ in particular had their attack transients reshaped. This screen exists to
 * answer that on real hardware, nothing more.
 *
 * What to listen for:
 *  - a tap should sound immediately, with no perceptible gap after the finger
 *  - ち should not sound like "gee", つ should not sound like "du"
 *  - spamming one glyph should retrigger instantly and overlap, never queue
 *  - the word recording should play as one utterance
 *
 * The Learning Line design system is deliberately NOT applied here. Styling this screen
 * would invite treating it as the start of the UI, and the UI is a clean-slate decision
 * that has not been made yet.
 */
export default function AudioSpike() {
  const kana = [...VOWELS, ...K_ROW];
  const [lastTap, setLastTap] = useState<string | null>(null);

  useEffect(() => {
    primeAudio(kana);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.heading}>Audio spike</Text>
        <Text style={styles.note}>
          Tap a kana. It should sound the instant your finger lands. Check ち and つ keep
          their consonant.
        </Text>

        <View style={styles.grid}>
          {kana.map((k) => (
            <Pressable
              key={k.id}
              style={styles.cell}
              onPress={() => {
                setLastTap(k.id);
                play(k);
              }}
            >
              <Text style={styles.glyph}>{k.glyph}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.wordButton}
          onPress={() => {
            setLastTap("えき");
            playRecording("/audio/words/eki-station.mp3");
          }}
        >
          <Text style={styles.wordLabel}>Play えき (whole word)</Text>
        </Pressable>

        <Text style={styles.status}>{lastTap ? `Last played: ${lastTap}` : " "}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAF7" },
  page: { padding: 24, gap: 16 },
  heading: { fontSize: 22, fontWeight: "600", color: "#111318" },
  note: { fontSize: 14, lineHeight: 21, color: "#555960" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  cell: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#111318",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  glyph: { fontSize: 30, color: "#111318" },
  wordButton: {
    marginTop: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#111318",
    borderRadius: 6,
    backgroundColor: "#FFD43B",
  },
  wordLabel: { fontSize: 15, fontWeight: "700", color: "#111318" },
  status: { fontSize: 13, color: "#555960" },
});
