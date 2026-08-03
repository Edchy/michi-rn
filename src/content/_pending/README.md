# Pending tests

Tests that were green in the web build and are **not** running here yet. They are parked
rather than deleted: each one guards a real rule, and each needs a counterpart in the RN
UI before it can run again. Restore one by renaming off the `.pending` suffix and
repointing it at the new components.

## `station-copy.test.ts.pending`

Enforces the station copy limit from `CLAUDE.md`: at most 30 words and 2 sentences per
slide, so stepping through a station feels like moving rather than reading.

It works by reading the authored copy straight out of the station components
(`src/components/track1-page.tsx`, `track0-page.tsx` in the web build) and measuring every
string it finds. Those components do not exist here yet, so the test has nothing to scan.

**Restore when:** the RN station components exist and carry authored copy. Point
`COPY_FILES` at them.

**Better still:** if the rebuild moves station copy out of components and into content
files, this test gets simpler and stops being coupled to the UI at all. That is the
preferred fix, and the reason this is parked instead of stubbed.
