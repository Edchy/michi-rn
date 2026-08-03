import { describe, expect, it } from "vitest";
import {
  FIRST_STATIONS,
  validateStationCourse,
  type StationDefinition,
} from "./station-spec";

function replaceStation(
  id: string,
  change: (station: StationDefinition) => StationDefinition,
): StationDefinition[] {
  return FIRST_STATIONS.map((station) =>
    station.identity.id === id ? change(station) : station,
  );
}

describe("validateStationCourse", () => {
  it("accepts the approved station definitions", () => {
    expect(validateStationCourse(FIRST_STATIONS)).toEqual([]);
  });

  // A narrative station exists so reading is not scored. These two checks are what stop
  // it drifting back into a test once someone wants "just a quick comprehension check."
  it("catches a narrative station that introduces review targets", () => {
    const stations = replaceStation("reading-on", (station) => ({
      ...station,
      introducedCapabilities: [{ itemId: "hira_no", capability: "symbol-to-sound" }],
    }));

    expect(validateStationCourse(stations)).toContain(
      "Station reading-on is narrative but introduces review targets.",
    );
  });

  it("catches a narrative station given a graded completion contract", () => {
    const stations = replaceStation("reading-on", (station) => ({
      ...station,
      completion: {
        kind: "mixed-items",
        itemIds: ["hira_no"],
        capabilities: ["symbol-to-sound"],
        mistakeRecovery: "Requeue the missed line.",
        message: "You read the passage correctly.",
      },
    }));

    expect(validateStationCourse(stations)).toContain(
      "Station reading-on is narrative but has a graded completion contract.",
    );
  });

  // Rule 11 applied to connected text: one untaught character turns reading for meaning
  // back into guessing, and natural Japanese makes it easy to introduce one by accident.
  it("catches a passage line containing an untaught character", () => {
    const stations = replaceStation("reading-on", (station) => ({
      ...station,
      application: {
        description: "A line with an H-row character in it.",
        itemIds: [...(station.application?.itemIds ?? []), "hira_ha"],
      },
    }));

    expect(validateStationCourse(stations)).toContain(
      "Station reading-on uses unintroduced item hira_ha in its application.",
    );
  });

  it("catches a prerequisite that no earlier station introduces", () => {
    const stations = replaceStation("k-row", (station) => ({
      ...station,
      prerequisites: [
        ...station.prerequisites,
        { itemId: "hira_sa", capability: "symbol-to-sound" },
      ],
    }));

    expect(validateStationCourse(stations)).toContain(
      "Station k-row requires hira_sa:symbol-to-sound, but no earlier station introduces it.",
    );
  });

  it("catches application material the learner has not met", () => {
    const stations = replaceStation("k-row", (station) => ({
      ...station,
      application: { description: "Too early.", itemIds: ["hira_sa"] },
    }));

    expect(validateStationCourse(stations)).toContain(
      "Station k-row uses unintroduced item hira_sa in its application.",
    );
  });

  it("catches an incomplete acquisition checkpoint", () => {
    const stations = replaceStation("vowels", (station) => {
      if (station.completion.kind !== "introduced-targets") throw new Error("wrong fixture");
      return {
        ...station,
        completion: {
          ...station.completion,
          targetKeys: station.completion.targetKeys.filter(
            (key) => key !== "hira_a:sound-to-symbol",
          ),
        },
      };
    });

    expect(validateStationCourse(stations)).toContain(
      "Station vowels completion omits introduced target hira_a:sound-to-symbol.",
    );
  });

  it("catches an ambiguous mixed checkpoint and missing mistake recovery", () => {
    const stations = replaceStation("look-back-1", (station) => {
      if (station.completion.kind !== "mixed-items") throw new Error("wrong fixture");
      return {
        ...station,
        completion: {
          ...station.completion,
          itemIds: [],
          capabilities: [],
          mistakeRecovery: "",
        },
      };
    });

    expect(validateStationCourse(stations)).toEqual(
      expect.arrayContaining([
        "Station look-back-1 mixed completion has no item coverage.",
        "Station look-back-1 mixed completion has no capability coverage.",
        "Station look-back-1 does not explain how checkpoint mistakes recover.",
      ]),
    );
  });
});
