import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Station copy has to stay short.
 *
 * Stepping through a station should feel like moving, not like reading. A slide carries
 * one idea; the moment it needs a third sentence, the idea belongs in a book stop instead
 * (long-form context is the Codex's job, not the path's).
 *
 * This reads the source rather than importing it because station copy is authored as
 * inline JSX inside the page components. That is worth keeping: the copy sits next to the
 * slide it belongs to. The tradeoff is that a test cannot import it, so it is extracted
 * textually here. If station content ever moves into plain data, delete the extraction
 * and assert over the real values.
 */

const WORD_LIMIT = 30;
const SENTENCE_LIMIT = 2;

const COPY_FILES = [
  "src/components/track1-page.tsx",
  "src/components/track0-page.tsx",
];

interface Copy {
  file: string;
  line: number;
  label: string;
  text: string;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Sentence-enders, ignoring the decimals and abbreviations that copy does not contain. */
function sentenceCount(text: string): number {
  return text.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim().length > 0).length;
}

function clean(raw: string): string {
  return raw
    .replace(/\{[^{}]*\}/g, " ") // JSX expressions: {word.meaning} and friends
    .replace(/<[^>]*>/g, " ") // nested markup: <strong>, <br />
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/** Prose authored as a JSX fragment: `body: (<>…</>)` and `introCopy: (<>…</>)`. */
function fragmentCopy(file: string, source: string): Copy[] {
  const found: Copy[] = [];
  const re = /(\w+):\s*\(?\s*<>([\s\S]*?)<\/>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const text = clean(match[2]!);
    if (text.length < 20) continue;
    found.push({ file, line: lineOf(source, match.index), label: match[1]!, text });
  }
  return found;
}

/** Prose authored as a plain string on a known copy field. */
function stringCopy(file: string, source: string): Copy[] {
  const found: Copy[] = [];
  const re = /(capability|next|headline|introCopy|body|note):\s*"([^"\\]{20,})"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    found.push({
      file,
      line: lineOf(source, match.index),
      label: match[1]!,
      text: clean(match[2]!),
    });
  }
  return found;
}

/**
 * Copy authored as an array of parts, used where a sentence mixes prose with kana that
 * must not be broken across lines: `capability: ["Today you read", { kana: "あ" }, "."]`.
 */
function partsCopy(file: string, source: string): Copy[] {
  const found: Copy[] = [];
  const re = /(capability):\s*\[([\s\S]*?)\],/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const text = [...match[2]!.matchAll(/"([^"\\]*)"/g)]
      .map((piece) => piece[1]!)
      .join(" ");
    const cleaned = clean(text).replace(/\s+([,.])/g, "$1");
    if (cleaned.length < 20) continue;
    found.push({ file, line: lineOf(source, match.index), label: match[1]!, text: cleaned });
  }
  return found;
}

function collectCopy(): Copy[] {
  return COPY_FILES.flatMap((file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    return [...fragmentCopy(file, source), ...stringCopy(file, source), ...partsCopy(file, source)];
  });
}

describe("station copy stays short", () => {
  const copy = collectCopy();

  it("finds the authored station copy", () => {
    // A guard on the extraction itself: if a refactor moves copy out of these files, the
    // limits below would silently pass over an empty list. Each label is checked on its
    // own because a change to one field's shape (string to array, say) hides only that
    // field, which a total count alone is too coarse to catch.
    expect(copy.length).toBeGreaterThan(10);
    for (const label of ["capability", "headline", "introCopy", "body"]) {
      expect(copy.filter((entry) => entry.label === label).length, label).toBeGreaterThan(0);
    }
  });

  it(`keeps every slide at or under ${WORD_LIMIT} words`, () => {
    const tooLong = copy
      .filter((entry) => wordCount(entry.text) > WORD_LIMIT)
      .map((entry) => `${entry.file}:${entry.line} [${entry.label}] ${wordCount(entry.text)}w: ${entry.text}`);

    expect(tooLong, `Move the detail into a book stop:\n${tooLong.join("\n")}`).toEqual([]);
  });

  it(`keeps every slide at or under ${SENTENCE_LIMIT} sentences`, () => {
    const tooMany = copy
      .filter((entry) => sentenceCount(entry.text) > SENTENCE_LIMIT)
      .map((entry) => `${entry.file}:${entry.line} [${entry.label}] ${sentenceCount(entry.text)} sentences: ${entry.text}`);

    expect(tooMany, `Split the idea or move it to a book stop:\n${tooMany.join("\n")}`).toEqual([]);
  });

  it("uses no em dashes in learner-facing copy", () => {
    // Already a CLAUDE.md rule; cheap to enforce where the copy actually lives.
    const withDashes = copy
      .filter((entry) => entry.text.includes("\u2014"))
      .map((entry) => `${entry.file}:${entry.line} [${entry.label}]`);

    expect(withDashes).toEqual([]);
  });
});
