import { K_ROW, N_ROW, S_ROW, T_ROW, VOWELS } from "./hiragana";
import { EKI, FIRST_PASSAGE, type Passage } from "./track1";

export type StationType =
  | "orientation"
  | "acquisition"
  | "consolidation"
  | "application"
  | "assessment"
  /**
   * Connected reading. The learner reads several lines of real Japanese for meaning,
   * using only characters already introduced.
   *
   * It is its own type rather than a phase inside an acquisition station because its job
   * is understanding rather than establishing a review target. Rule 7 puts real use
   * outside graded evidence, so a narrative station introduces nothing, checks nothing,
   * and cannot be failed. `validateStationCourse` enforces that below.
   */
  | "narrative";

export type Capability = "sound-to-symbol" | "symbol-to-sound";

export interface ReviewTarget {
  itemId: string;
  capability: Capability;
}

export type StationPhase =
  | "prepare"
  | "review"
  | "orient"
  | "teach"
  | "connect"
  | "recall"
  | "use"
  | "checkpoint"
  | "close";

export interface StationApplication {
  description: string;
  /** Every learning item needed to perform the application. */
  itemIds: readonly string[];
}

export type CompletionContract =
  | {
      kind: "acknowledgement";
      evidence: string;
      message: string;
    }
  | {
      kind: "introduced-targets";
      targetKeys: readonly string[];
      mistakeRecovery: string;
      message: string;
    }
  | {
      kind: "mixed-items";
      itemIds: readonly string[];
      capabilities: readonly Capability[];
      mistakeRecovery: string;
      message: string;
    };

/**
 * The seven authored sections of a station. Runtime state, due dates, map position,
 * and React components deliberately do not belong here.
 */
export interface StationDefinition {
  identity: {
    id: string;
    type: StationType;
    title: string;
  };
  outcome: string;
  prerequisites: readonly ReviewTarget[];
  introducedCapabilities: readonly ReviewTarget[];
  learningSequence: readonly StationPhase[];
  application: StationApplication | null;
  completion: CompletionContract;
}

export function reviewTargetKey(target: ReviewTarget): string {
  return `${target.itemId}:${target.capability}`;
}

function targetsFor(itemIds: readonly string[]): ReviewTarget[] {
  return itemIds.flatMap((itemId) => [
    { itemId, capability: "sound-to-symbol" },
    { itemId, capability: "symbol-to-sound" },
  ] satisfies ReviewTarget[]);
}

const vowelIds = VOWELS.map((kana) => kana.id);
const kRowIds = K_ROW.map((kana) => kana.id);
const sRowIds = S_ROW.map((kana) => kana.id);
const tRowIds = T_ROW.map((kana) => kana.id);
const nRowIds = N_ROW.map((kana) => kana.id);
const firstTenIds = [...vowelIds, ...kRowIds];
const vowelTargets = targetsFor(vowelIds);
const kRowTargets = targetsFor(kRowIds);
const sRowTargets = targetsFor(sRowIds);
const tRowTargets = targetsFor(tRowIds);
const nRowTargets = targetsFor(nRowIds);

/** Every kana the course defines, indexed by the glyph a learner actually sees. */
const KANA_BY_GLYPH = new Map(
  [...VOWELS, ...K_ROW, ...S_ROW, ...T_ROW, ...N_ROW].map((kana) => [kana.glyph, kana.id]),
);

/**
 * The learning items a passage requires, derived from its own text.
 *
 * This is what makes rule 11 enforceable for connected reading: the validator receives
 * the real characters of every line, so a passage containing a character no earlier
 * station introduced fails the course check instead of reaching a learner. An unknown
 * glyph maps to a deliberately unmatchable id so it is reported rather than skipped.
 */
export function passageItemIds(passage: Passage): string[] {
  const ids = new Set<string>();
  for (const line of passage.lines) {
    for (const glyph of line.glyphs) {
      ids.add(KANA_BY_GLYPH.get(glyph) ?? `unknown-kana:${glyph}`);
    }
  }
  return [...ids];
}

/** The first four stations expressed as data, in course order. */
export const FIRST_STATIONS: readonly StationDefinition[] = [
  {
    identity: { id: "three-scripts", type: "orientation", title: "The three scripts" },
    outcome: "Understand the three-script map and why the course begins with hiragana.",
    prerequisites: [],
    introducedCapabilities: [],
    learningSequence: ["orient", "use", "close"],
    application: null,
    completion: {
      kind: "acknowledgement",
      evidence: "The learner reaches the end of the short orientation.",
      message: "You know what the three scripts do and why hiragana comes first.",
    },
  },
  {
    identity: { id: "vowels", type: "acquisition", title: "First sounds" },
    outcome: "Connect あいうえお to their sounds in both directions.",
    prerequisites: [],
    introducedCapabilities: vowelTargets,
    learningSequence: ["orient", "teach", "connect", "recall", "checkpoint", "close"],
    application: null,
    completion: {
      kind: "introduced-targets",
      targetKeys: vowelTargets.map(reviewTargetKey),
      mistakeRecovery: "Reteach and requeue only the missed target after other questions.",
      message: "You connected the five vowel sounds to あいうえお in both directions.",
    },
  },
  {
    identity: { id: "k-row", type: "acquisition", title: "The K row" },
    outcome: "Connect かきくけこ to their sounds in both directions and decode えき.",
    prerequisites: vowelTargets,
    introducedCapabilities: kRowTargets,
    learningSequence: [
      "prepare",
      "review",
      "orient",
      "teach",
      "connect",
      "recall",
      "checkpoint",
      "use",
      "close",
    ],
    application: {
      description: "Decode えき; its meaning is ungraded context.",
      // Taken from the word itself rather than retyped, so the validator checks the kana
      // the learner actually sees. A hand-written list can drift from the word and then
      // silently approves a station whose word contains an untaught character.
      itemIds: EKI.kana.map((kana) => kana.id),
    },
    completion: {
      kind: "introduced-targets",
      targetKeys: kRowTargets.map(reviewTargetKey),
      mistakeRecovery: "Reteach and requeue only the missed target after other questions.",
      message: "You connected the K-row sounds in both directions and decoded えき.",
    },
  },
  {
    identity: { id: "look-back-1", type: "consolidation", title: "A first look back" },
    outcome: "Retrieve the first ten hiragana from one mixed set and decode えき again.",
    prerequisites: [...vowelTargets, ...kRowTargets],
    introducedCapabilities: [],
    learningSequence: ["prepare", "review", "recall", "use", "close"],
    application: {
      description: "Decode えき again from the mixed first-ten set.",
      itemIds: EKI.kana.map((kana) => kana.id),
    },
    completion: {
      kind: "mixed-items",
      itemIds: firstTenIds,
      capabilities: ["sound-to-symbol", "symbol-to-sound"],
      mistakeRecovery: "Reveal the association and requeue only the missed target.",
      message: "You recalled the first ten hiragana together and read えき again.",
    },
  },
  {
    identity: { id: "s-row", type: "acquisition", title: "The S row" },
    outcome: "Connect さしすせそ to their sounds in both directions, including irregular し.",
    // The k-row only. The vowels are older and return through scheduled review; opening
    // every future station with every earlier row would grow without bound and blow the
    // five-prompt budget in rule 10 before the station begins.
    prerequisites: kRowTargets,
    introducedCapabilities: sRowTargets,
    learningSequence: [
      "prepare",
      "review",
      "orient",
      "teach",
      "connect",
      "recall",
      "checkpoint",
      "close",
    ],
    // No application step: さかな is readable now, but no recording exists for it. See
    // buildTrack4 in track1.ts.
    application: null,
    completion: {
      kind: "introduced-targets",
      targetKeys: sRowTargets.map(reviewTargetKey),
      mistakeRecovery: "Reteach and requeue only the missed target after other questions.",
      message: "You connected the five S-row sounds to さしすせそ in both directions.",
    },
  },
  {
    identity: { id: "t-row", type: "acquisition", title: "The T row" },
    outcome: "Connect たちつてと to their sounds in both directions, including ち and つ.",
    prerequisites: sRowTargets,
    introducedCapabilities: tRowTargets,
    learningSequence: [
      "prepare",
      "review",
      "orient",
      "teach",
      "connect",
      "recall",
      "checkpoint",
      "close",
    ],
    application: null,
    completion: {
      kind: "introduced-targets",
      targetKeys: tRowTargets.map(reviewTargetKey),
      mistakeRecovery: "Reteach and requeue only the missed target after other questions.",
      message: "You connected the five T-row sounds to たちつてと in both directions.",
    },
  },
  {
    identity: { id: "n-row", type: "acquisition", title: "The N row" },
    outcome: "Connect なにぬねの to their sounds in both directions.",
    prerequisites: tRowTargets,
    introducedCapabilities: nRowTargets,
    learningSequence: [
      "prepare",
      "review",
      "orient",
      "teach",
      "connect",
      "recall",
      "checkpoint",
      "close",
    ],
    application: null,
    completion: {
      kind: "introduced-targets",
      targetKeys: nRowTargets.map(reviewTargetKey),
      mistakeRecovery: "Reteach and requeue only the missed target after other questions.",
      message: "You connected the five N-row sounds to なにぬねの in both directions.",
    },
  },
  {
    identity: { id: "reading-on", type: "narrative", title: "Reading on" },
    outcome: "Read connected Japanese for meaning, using only characters already known.",
    // No prerequisites declared. Opening review exists to prepare the learner for new
    // material, and this station introduces none; the reading itself is the exposure.
    prerequisites: [],
    introducedCapabilities: [],
    learningSequence: ["orient", "use", "close"],
    application: {
      description: "Read four lines of connected Japanese; meanings are revealed, never tested.",
      // Derived from the passage, so the validator checks the characters the learner
      // actually sees rather than a hand-kept list that can drift from the content.
      itemIds: passageItemIds(FIRST_PASSAGE),
    },
    completion: {
      kind: "acknowledgement",
      evidence: "The learner reads each line and reveals its meaning.",
      message: "You read connected Japanese, not single characters.",
    },
  },
];

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

/**
 * The declared prerequisites for a station, by id.
 *
 * The runner uses this to plan opening review, so a new station gets prerequisite review
 * by declaring prerequisites here rather than by adding a branch to the page component.
 * An unknown id yields none, which is correct for a station that opens the curriculum.
 */
export function prerequisitesFor(stationId: string): readonly ReviewTarget[] {
  return (
    FIRST_STATIONS.find((station) => station.identity.id === stationId)?.prerequisites ?? []
  );
}

/**
 * Validate authored course order. Returns all actionable errors so content authors can
 * repair a station in one pass instead of discovering problems one at a time.
 */
export function validateStationCourse(stations: readonly StationDefinition[]): string[] {
  const errors: string[] = [];
  const stationIds = stations.map((station) => station.identity.id);
  for (const id of duplicates(stationIds)) errors.push(`Duplicate station id: ${id}.`);

  const introducedTargets = new Set<string>();
  const introducedItems = new Set<string>();

  for (const station of stations) {
    const label = `Station ${station.identity.id}`;
    const prerequisiteKeys = station.prerequisites.map(reviewTargetKey);
    const introducedKeys = station.introducedCapabilities.map(reviewTargetKey);

    for (const key of duplicates(prerequisiteKeys)) {
      errors.push(`${label} repeats prerequisite ${key}.`);
    }
    for (const key of prerequisiteKeys) {
      if (!introducedTargets.has(key)) {
        errors.push(`${label} requires ${key}, but no earlier station introduces it.`);
      }
    }
    for (const key of duplicates(introducedKeys)) {
      errors.push(`${label} introduces ${key} more than once.`);
    }
    for (const key of introducedKeys) {
      if (introducedTargets.has(key)) {
        errors.push(`${label} reintroduces existing target ${key}.`);
      }
    }

    const availableItems = new Set(introducedItems);
    for (const target of station.introducedCapabilities) availableItems.add(target.itemId);
    for (const itemId of station.application?.itemIds ?? []) {
      if (!availableItems.has(itemId)) {
        errors.push(`${label} uses unintroduced item ${itemId} in its application.`);
      }
    }

    // A narrative station's whole value is that reading is not being scored. If one ever
    // acquires a review target or a graded checkpoint, it has quietly become a test, and
    // the learner's reading becomes another thing to get wrong.
    if (station.identity.type === "narrative") {
      if (station.introducedCapabilities.length > 0) {
        errors.push(`${label} is narrative but introduces review targets.`);
      }
      if (station.completion.kind !== "acknowledgement") {
        errors.push(`${label} is narrative but has a graded completion contract.`);
      }
    }

    if (!station.outcome.trim()) errors.push(`${label} has no outcome.`);
    if (station.learningSequence.length === 0) errors.push(`${label} has no learning sequence.`);
    if (!station.completion.message.trim()) errors.push(`${label} has no completion message.`);

    if (station.completion.kind === "acknowledgement") {
      if (!station.completion.evidence.trim()) errors.push(`${label} has no completion evidence.`);
    } else {
      if (!station.completion.mistakeRecovery.trim()) {
        errors.push(`${label} does not explain how checkpoint mistakes recover.`);
      }
      if (station.completion.kind === "introduced-targets") {
        const expected = new Set(introducedKeys);
        const actual = new Set(station.completion.targetKeys);
        for (const key of expected) {
          if (!actual.has(key)) errors.push(`${label} completion omits introduced target ${key}.`);
        }
        for (const key of actual) {
          if (!expected.has(key)) errors.push(`${label} completion checks undeclared target ${key}.`);
        }
      } else {
        if (station.completion.itemIds.length === 0) {
          errors.push(`${label} mixed completion has no item coverage.`);
        }
        if (station.completion.capabilities.length === 0) {
          errors.push(`${label} mixed completion has no capability coverage.`);
        }
        for (const itemId of station.completion.itemIds) {
          if (!availableItems.has(itemId)) {
            errors.push(`${label} completion checks unintroduced item ${itemId}.`);
          }
        }
      }
    }

    for (const target of station.introducedCapabilities) {
      introducedTargets.add(reviewTargetKey(target));
      introducedItems.add(target.itemId);
    }
  }

  return errors;
}
