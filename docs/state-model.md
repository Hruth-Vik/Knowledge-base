# FOUNDATION state model

The source of truth is `src/lib/state/schema.ts`. This document explains the
decisions behind it, the rules that are not expressible in a schema, and what
later stages must not change silently.

Stage 1 defines and tests the model. Stage 2 wires it into Zustand and browser
persistence, including corrupt-record recovery. Stage 3 adds the lesson
interactions: visits, done marks, recall attempts, exercise drafts, rubric
checks, and exercise passes. Stage 4 adds persisted map positions, notes, and
the staged lesson journey. Stage 5 adds SM-2 cards, the review queue, milestone
quizzes, persisted interview attempts, and rest-day tokens. Stage 6 adds the
L0–L2 curriculum and field-station presentation only; it introduces no new
persisted fields, and the chibi field run reads state without writing it. Every
Today count, node, edge, and activity square is derived from the existing
notebook and compiled catalog.

## Shape

One persisted object, normalized by stable ID:

```text
UserStateV1
├── schemaVersion, createdAt, updatedAt
├── settings        theme, active language, daily lesson goal
├── lessons         Record<lessonId, LessonProgress>
├── review          Record<questionId, SrsCard> + review log
├── quizzes         completed or in-progress quiz attempts
├── milestones      triggered five-lesson and level-end checks
├── notes           Record<noteId, Note>
├── map             custom nodes, edges, per-layout positions
├── activity        Record<localDate, ActivityDay>
└── streak          rest-day tokens, grant date, spent rest days
```

All timestamps are ISO-8601 UTC strings. Calendar data (`ActivityDay.date`,
`restDays`, the daily date key) uses the browser's local date in `YYYY-MM-DD`
form. This is deliberate: "today" and a streak are human calendar concepts.
If the user changes time zones, historical local dates remain historical
records; the app does not rewrite them.

Persisted user IDs (notes, quiz attempts, SRS review logs) are UUIDs. Content
IDs are lowercase stable IDs such as `java.l5.heap-generations` and
`java.l5.heap-generations.recall.q1`.

## Lesson progress and mastery

Lesson records are created when a lesson is opened or an exercise draft is
saved. Status is **derived**, not stored:

```text
no record                    => not-started
record, no doneAt            => in-progress
doneAt, missing recall/exercise evidence => done
doneAt + recall.passedAt + exercise.passedAt => mastered
```

`recall.passedAt` is set only when a recall attempt scores 3/3. A partial score
does not count, even if two of three answers were good. The user can retry after
reviewing the relevant sections. This is intentionally stricter than "read a
summary".

`exercise.passedAt` is set only after the user checks every `mustPass` rubric
criterion. The exercise draft, last save time, rubric checks, and pass time are
stored. Foundation does not claim to compile Java in the browser; the
verification instructions are explicitly manual. Unchecking a required rubric
item clears the pass mark and reopens the exercise.

Interview scores are persisted differently from lesson mastery. Each scored
prompt creates a `kind: 'interview'` quiz attempt with one outcome and a
`selfScore` from 0–5. These attempts drive the practice queue's weakest-first
ordering, but they do not create SRS cards, count as recall evidence, or match a
milestone quiz.

Mastery is historical evidence, not a claim of permanent recall. A later weak
review does not revoke `mastered`; it moves the concept into the review queue
and can make the map node decay. This distinction prevents a bad review day
from erasing the fact that a lesson was once completed under the rubric.

Level state is also derived:

- **unstarted**: no lesson records in the level.
- **in progress**: any started lesson, not all mastered.
- **mastered**: every published lesson in the level is mastered.
- **recommended next**: the first published lesson, in order, that is not
  mastered. Its level is marked on the roadmap; Today links directly to the
  lesson. When every published lesson is mastered, the roadmap drops the
  recommendation and says the published path is complete. If no lesson is
  published, the roadmap shows the level briefs with no recommendation.

There is no persisted `locked` flag. The roadmap may visually de-emphasize a
level far beyond the recommendation, but every route remains usable.

## Lesson journey position

The staged lesson UI saves its reading position separately from mastery evidence:

- key: `foundation.journey.<lessonId>` in `localStorage`;
- value: current stop index plus the set of visited stop indices;
- written when the reader advances, goes back, jumps from the route rail, or
  marks the lesson done;
- read on mount so a refresh returns to the same stop;
- cleared only by the lesson cover's explicit restart action or the notebook
  reset.

This is a convenience record, not proof of study. It never changes lesson
progress, recall, exercise state, or mastery. The notebook remains the only
source of truth for evidence.

## Recall attempts

Three answers are stored per attempt: question ID, correctness, and the user's
response text where applicable. An attempt carries a 0–3 score and a pass flag.
The schema rejects an attempt that claims `passed: true` with a lower score.

The same attempt records ID and timestamp so old mastery cannot be overwritten
by a retry. The latest pass time is kept separately for display. Every attempt
also creates or updates an SRS card for each question; the card is graded 4 for
a correct answer and 2 for a miss, so the first scheduled review lands at least
one day later. A recall attempt is not a scheduled review and does not append a
review log or `reviewsCompleted` activity.

## SRS contract

Spaced repetition is per **question**, not per lesson. A card has the question
ID, one or more concept IDs, SM-2 state (`easeFactor`, interval, repetitions,
lapses, due date), and review history. This means a question about
`HashMap resize` can become weak while the lesson "HashMap internals" remains
marked done.

The scheduler lives in `src/lib/srs/scheduler.ts` and follows SM-2 semantics:

- Quality is 0–5. Ratings 0–2 count as a failed recall; 3–5 count as success.
- A successful first repetition gets a 1-day interval; the second gets 6 days;
  later intervals use `round(previousInterval × easeFactor)`.
- A failed repetition resets repetitions to 0, sets the next interval to 1 day,
  and increments lapses.
- Ease is adjusted with the SM-2 formula and clamped to a minimum of 1.3.
- A card is due when `dueAt <= now`; the UI may impose a short grace period but
  the scheduler's data does not.

The scheduler is not allowed to change the interval or ease formula without a
test update and a state migration note. Review logs store the interval before
and after plus the rating, so a future scheduler change can be audited rather
than guessed.

### Derived concept state

Concept nodes do not store their visual state. It is derived from lesson
progress and the SRS cards that reference the concept. Precedence is explicit:

1. **decaying**: any linked card is in `relearning` or its latest rating was
   0–2. This wins over every lesson state.
2. **mastered**: the owning lesson is mastered.
3. **learned**: the owning lesson is started or done, but not mastered.
4. **unseen**: no progress record exists for the owning lesson.

A normal notebook with no cards runs on lesson evidence alone. Imported cards
and cards created by recall attempts affect the map without a schema change.

The schema reserves custom map nodes and edges, including their own
`unseen | learned | mastered` state and per-layout positions. The shipped map UI
uses authored concepts and persisted positions; creating custom nodes is not yet
exposed.

## Milestones

A milestone record is created when either condition is met:

- every five lessons marked **done** in a language;
- every published lesson in a level is marked **done** (level-end).

The record stores its scope (`lessonIds`), language, level when applicable,
status, and a link to the generated quiz attempt. It is persisted so the same
five-lesson boundary does not repeatedly trigger. A pending milestone is a
prompt, never a hard gate; the user can continue learning. Milestones are
created by `setLessonDone`, so a hand-edited lesson record does not fake one.

A quiz attempt stores its kind (`milestone`, `level-gate`, `interview`), scope,
question IDs, per-question correctness or self-score, duration, and status.
That history is the input for "previously wrong" weighting. In-progress
attempts are persisted so a refresh does not fabricate a clean slate. Completing
a milestone quiz links it to the milestone and records one quiz on the activity
day; interview attempts do neither.

## Quiz selection contract

The selector is implemented in `src/lib/review/selector.ts` as a pure function
over a compiled content catalog and persisted state. It does not read React or
browser storage directly.

Candidate pool:

1. Recall questions only from lessons in the milestone's completed scope.
2. Interview questions are excluded; they remain a separate practice mode.
3. Missing content IDs are skipped rather than crashing the quiz.

Each candidate gets a base weight of 1.0 plus:

- **+1.0** if its question card is due or its concept is decaying;
- **+0.8** if its latest recorded outcome was incorrect;
- **+0.6** if its concept is a prerequisite of the next lesson's concepts
  through the registry's `depends-on` edges;
- **+0.4** if it has not been seen for at least 14 days;
- **+0.2** if the concept has fewer than two prior exposures.

Selection is weighted sampling without replacement. The selector enforces:

- no more than two questions per concept;
- at least two distinct question types where the pool permits;
- an eight-question default for a five-lesson milestone and twelve for a
  level-end milestone, capped at the pool size;
- a deterministic output for a given milestone seed, so the same checkpoint
  presents the same question set.

After a quiz, the result screen groups outcomes into solid, decayed, and fix-it
material. A fix-it link currently opens the owning lesson at its recall stop
(`?stop=recall`); per-section anchors are a later refinement.

## Streak, daily goal, and rest tokens

Daily goal is lessons marked done per local day. "Activity" is broader: a
completed lesson, a review session, or a quiz can keep the day active.
Progress display is honest: opening the app does not count as study.

Streak policy:

- The streak is the run of consecutive calendar days that are either active or
  explicitly rest-covered.
- A new notebook starts with one rest-day token. The first weekly check marks the
  current ISO week without granting a second token, because the starting token is
  that week's grant.
- On later ISO weeks, a notebook with activity in the previous seven local days
  earns one token when the app starts. The bank holds at most two. The grant week
  is persisted so a reload cannot duplicate the grant.
- A token can be spent only on a missed day in the preceding seven local days,
  never on today. Spending is explicit. The app never silently spends a token.
- Removing rest coverage does not refund the token. The record stays honest.
- A rest day preserves continuity but is displayed as a hollow mark labeled
  "rest", never as study.
- If the missed run exceeds the available tokens, the streak breaks. The app
  does not rewrite history to protect a number.
- The longest streak is derived from recorded days; it is not a separate
  mutable score.

`ActivityDay` stores seconds, lesson IDs touched/completed, review count, and
quiz count. Time on lesson is foreground time only: count while the document is
visible, pause after 120 seconds of no input, and flush at most every 15
seconds. This is the only tracking the product performs, and it stays local.

## Notes and links

A note can be:

- a primary lesson note (`lessonId` set), or
- a loose page (`lessonId: null`).

When a note is linked to a lesson, the note stores that lesson's concept IDs so
the map and search can connect the note to the curriculum. Tags are freeform and
live on the note. The notebook filters on title, body, tags, and linked lesson
title. Notes are Markdown; Read mode renders the same Markdown component used by
lessons. Export writes one Markdown file containing every note in newest-first
order.

The schema reserves an optional `excerpt` field (text, source lesson, optional
section title) for a later capture flow. The current lesson notes dock saves a
whole lesson note; it does not yet capture a selected excerpt. `[[wiki links]]`
and backlinks are not implemented, so the UI does not pretend to resolve them.

If content is renamed or removed, notes keep their text and records. The UI
shows a "missing content" reference rather than dropping the note or inventing a
replacement. Import does not silently rewrite note bodies.

## Map data

- Built-in nodes and edges come from the compiled concept registry.
- Per-layout position overrides are stored by layout name (`radial`,
  `dependency`, `cluster`). Auto-layout remains the fallback for nodes without a
  position. Reset clears one layout at a time.
- The canonical "trace a concept" traversal uses authored `depends-on` edges
  only. Other relation types are shown in the side sheet but never traced.
- The schema reserves `user.*` custom nodes and edges. They are not exposed by
  the current map UI.
- Map selection, search dimming, trace mode, and the map/list toggle are
  transient UI state. Only positions are persisted.

## Search

Search has no persisted index. The command palette builds a MiniSearch instance
from three live sources each time its inputs change:

- the compiled catalog of lessons and concepts;
- the user's notes from the notebook;
- a small static list of pages and actions.

Lessons and concepts come from the same compiled registry as the map and lesson
pages. Notes are indexed by title, body, and tags. Nothing about a query,
result, or ranking is stored, so clearing the notebook cannot leave a stale
search index behind.

## Persistence

Implemented in Stages 2–5:

- One Zustand store holds the validated `UserStateV1` object. Feature slices can
  be split later without changing the persisted shape.
- Lesson interactions are pure functions in `lib/state/lesson.ts`; Zustand
  actions only apply them to the store. This keeps pass rules testable without
  React, IndexedDB, or a browser.
- `persist` middleware uses an asynchronous string-storage adapter.
- Primary key/value backend: IndexedDB via `idb-keyval`.
- Fallback: localStorage when IndexedDB is unavailable or fails to open.
- A backend choice is made once per app session. The app does not write to both
  and then have two divergent states. If neither backend works, the session runs
  in memory and the UI warns that changes will not persist.
- Hydration validates the saved object against `UserStateV1Schema` before
  exposing it to components. A schema-invalid or unreadable record pauses
  autosave, preserves the raw record, and offers a raw download or a deliberate
  fresh start. It is never silently replaced by a blank state.
- Theme is persisted in the notebook. A localStorage mirror is written only as a
  first-paint hint so a reload does not flash the wrong theme.
- Transient UI state is excluded with `partialize`.

The export file is:

```json
{
  "format": "foundation.backup",
  "formatVersion": 1,
  "exportedAt": "2026-01-02T10:00:00.000Z",
  "state": {}
}
```

Import validates this envelope and the complete state schema, then replaces
user state only after success. The UI confirms the import explicitly and
downloads a backup of the current notebook first. Notes can also be exported as
one Markdown file from the notebook. A zip export is not shipped. Neither note
export is a substitute for the complete JSON backup.

## Versioning and corruption

`UserStateV1Schema` is strict. Unknown keys fail import rather than being
silently discarded. Any shape change requires:

1. incrementing `schemaVersion`;
2. a migration from every supported prior version;
3. a fixture representing the old shape;
4. a note in this document explaining the semantic change.

Content reference checks are deliberately separate from state validation.
Content changes must never make a valid backup unreadable. Missing concept,
lesson, or question IDs are a display/review concern, not a reason to erase
user data.
