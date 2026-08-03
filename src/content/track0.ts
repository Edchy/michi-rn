import { SCRIPTS, type Script } from "./scripts";

/**
 * Station 1 — "The three scripts."
 *
 * A read-through orientation station. It teaches no kana and seeds no SRS items;
 * it exists so the learner knows what they are looking at before Station 2 starts
 * drilling あいうえお. Every step is a tap-to-continue beat (session-flow.md §1:
 * read-this steps wait for a tap).
 */
export type ScriptStep =
  | { kind: "welcome" }
  | { kind: "open" }
  | { kind: "controls" }
  | { kind: "script"; script: Script }
  | { kind: "romaji" } // named and set aside (P2) — deliberately NOT one of the scripts
  | { kind: "michi" } // the app's name, shown once in all three scripts
  // How Japanese sound works, before a single character is taught. Every piece takes
  // one even beat, and nothing is silent or irregular the way English spelling is. This
  // is fear-reduction: the learner is about to be shown 46 shapes, and the honest news
  // is that the sounds behind them are unusually regular.
  | { kind: "beats" }
  | { kind: "handoff" }; // "we start with hiragana, and with its five vowels"

export function buildTrack0(): ScriptStep[] {
  return [
    { kind: "welcome" },
    { kind: "controls" },
    { kind: "open" },
    ...SCRIPTS.map((script): ScriptStep => ({ kind: "script", script })),
    { kind: "michi" },
    { kind: "romaji" },
    // After romaji is set aside, so the learner hears the sounds as Japanese rather than
    // as respelled English, and immediately before the handoff into the first five.
    { kind: "beats" },
    { kind: "handoff" },
  ];
}
