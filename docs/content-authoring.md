# Content authoring and validation

This is the contract for anyone adding lessons to FOUNDATION, including the
person writing the next Java content stage.

The content pipeline is intentionally rigid. The reader should be able to open
any lesson at any level and know exactly where the problem, analogy, runtime
walkthrough, failure, AI review, interview practice, and hand-written exercise
are.

## File layout

```text
src/content/java/levels.ts
src/content/java/l0/why-the-jvm.lesson.ts
src/content/java/l1/string-pool.lesson.ts
src/content/python/levels.ts                  # when that pack is funded
src/content/javascript/levels.ts              # when that pack is funded
```

Rules enforced by the compiler:

- The file must end with `<slug>.lesson.ts`.
- The lesson must live under `src/content/<language>/`.
- The module must export `lesson`.
- All lesson, concept, and question IDs must be unique in their scope.
- Lesson IDs start with the language ID, for example `java.l5.heap-generations`.
- Concept IDs start with the language ID.
- A lesson's sequence is unique within its level.
- A chapter ID has one title across a level.
- A lesson slug is unique within a language.
- The level must exist and belong to the same language.
- A coming-soon pack cannot ship lessons.

The module shape is:

```ts
import { defineLesson } from '../../../lib/schema/lesson.js';

export const lesson = defineLesson({
  // Required fields are enumerated below.
});
```

`defineLesson` is an identity helper for editor inference. The real gate is the
Zod schema and the cross-content compiler:

```bash
npm run validate:content
```

`npm test` exercises a complete fixture at
`tests/fixtures/sample-lesson.ts`. It proves that the schema accepts a valid
lesson and rejects missing sections. When a new constraint is added to the
schema, add a fixture test that fails for the right reason.

## Identity rules

Stable IDs are persisted in notes, user progress, quiz history, and SRS cards.
Do not change an existing ID to improve wording. Add an alias or a migration.

Recommended patterns:

```text
lesson:             java.l5.heap-generations
concept:            java.l5.heap-generations
                    java.l5.heap-generations.young-eden
recall question:    java.l5.heap-generations.recall.q1
interview question: java.l5.heap-generations.interview.q1
chapter ID:         jvm-memory
slug:               heap-generations
```

Question IDs must start with the lesson ID. Interview question IDs must start
with `<lessonId>.interview.`. Recall question IDs must start with
`<lessonId>.`.

Concept IDs can use dots. They should read as paths through the subject, not as
database keys. Keep them lowercase. No random suffix unless a collision is
genuinely unavoidable.

## Level metadata

Level metadata lives in the language's `levels.ts`, one entry per level. It
contains only stable curriculum structure:

```ts
{
  id: 'java.l5',
  language: 'java',
  index: 5,
  title: 'Inside the JVM',
  deck: '...',
  outcome: '...'
}
```

Chapters and lesson order are derived from lesson modules. Do not add a lesson
list to the level manifest; it will drift. The lesson sequence determines the
order within a level. Chapter order is the first lesson appearance in that
sequence.

Every Java level must eventually contain at least two `kind: 'incident-story'`
lessons. The validator currently warns when a populated level lacks them; it
becomes a hard error when the content pack is declared complete in a later
stage.

## Required lesson fields

Every field below is required. Strict objects reject unknown keys so a typo
cannot be ignored.

| Field | Contract |
| --- | --- |
| `formatVersion` | `1` |
| `id`, `language`, `levelId`, `slug`, `sequence` | identity and ordering |
| `chapter.id`, `chapter.title` | stable grouping; title consistent per level |
| `title`, `deck` | reader-facing naming |
| `kind` | `standard` or `incident-story` |
| `estimatedMinutes` | integer 10–20 |
| `tags` | 1–8 unique tags |
| `concepts` | 2–6 concepts introduced in this lesson |
| `revisits` | existing concepts referenced but not redefined |
| `versionCaveats` | optional; use for "Java 21+", preview status, or platform caveats |
| `references` | optional public references; do not use as a substitute for accuracy |
| `recallCheck` | exactly three questions |
| `sections` | all ten sections, described below |

## The ten sections

### a. Problem

`problem` is one concrete paragraph. It states the pain that existed before
this concept, or the specific confusion the concept removes. No history for its
own sake. If the reader could not have experienced the problem, rewrite it.

### b. Analogy

`analogy` contains:

- `title`;
- a vivid but unsentimental `body`;
- `mapping`: 3–7 pairs of technical part to analogue part;
- `whereItBreaks`: a mandatory paragraph naming the places the analogy is
  inaccurate.

The mapping is the teaching. Do not use an analogy that only conveys vibes.
"JVM heap generations as hospital triage" is allowed only if admission, length
of stay, promotion, and discharge map to Eden, survivor spaces, tenuring, and
collection. If the analogy breaks at a key mechanism, say so in the lesson.

### c. Mental model

`mentalModel.figure` is a typed vector figure, not an image. It contains:

- viewport `width` and `height`;
- a short `caption`;
- required `alt` text describing the relationships, not just the labels;
- 2–12 nodes with explicit coordinates, shape, and tone;
- up to 16 edges with an optional label and a typed kind;
- up to 6 annotations with coordinates.

The renderer will draw the consistency of nodes in the site's hand-built vector
style. Node coordinates are content, so a new language pack does not require
new diagram components. If a concept needs a visual the generic node renderer
cannot express, propose a reusable figure primitive rather than embedding
service-specific React in content.

### d. Under the Hood

`underTheHood.intro` prepares the reader. It must contain 3–8 `steps`. Each
step has:

- a title;
- a body that describes what the runtime actually does;
- optional annotated code.

This is the stepper. Steps must be causal and ordered. "The JVM loads the
class" is not enough; say when it loads it, what triggers loading, and what
state changes. Mention memory, bytecode, threads, network, or the framework
boundary as appropriate.

### e. Code, minimal then real

`code.intro` then:

- `minimal`: <= 14 lines, at least two annotations;
- `realistic`: a plausible program, at least three annotations.

Each code block has filename, language, code, annotations, and optional output.
Annotation line numbers must exist in the snippet. Annotate the lines that
carry the concept, not every brace. This is a 10–20 minute lesson, not a code
review.

The minimal example should be small enough to predict. The realistic example
should show the concept under a constraint a working developer recognises:
time, memory, concurrency, network, configuration, or a framework lifecycle.

### f. Break It On Purpose

`breakIt` contains the scenario, a broken code fragment, a prediction prompt,
the failure kind, and a hidden reveal:

- `observed`: the actual stack trace, output, leak symptom, or deadlock
  evidence;
- `explanation`: why it happened;
- `repair`: how to fix it;
- optional corrected code.

The user must be able to form a prediction before the reveal is shown. Do not
put the answer in the scenario or the title.

### g. What AI Gets Wrong Here

`aiMistakes.mistakes` contains 2–5 specific patterns. Each entry has:

- `title`;
- `generatedPattern`: what a model typically emits or claims;
- `whyItFails`: the concrete consequence;
- `correction`: the accurate alternative;
- `telltale`: a review signal the reader can check quickly.

`reviewChecklist` has 3–8 yes/no checks. It should be usable while reviewing a
diff, not vague advice. This is the product's differentiator; generic warnings
such as "be careful with concurrency" do not belong here.

### h. Interview Corner

`interviewCorner.questions` has 3–6 questions. At least one must be tagged
`junior`, one `mid`, and one `senior`. Every question has:

- stable ID under the lesson's `interview` namespace;
- difficulty;
- question and optional code;
- model answer;
- a weak answer;
- a strong answer;
- a likely follow-up.

The weak/strong contrast is the teaching content. Do not make the weak answer a
strawman. It should be the plausible answer a capable but under-taught developer
would give.

### i. Write It From Scratch

`writeFromScratch` includes:

- title, brief, and 3–7 constraints;
- filename, language, and starting code (the editor may start empty);
- a hidden reference solution with at least two annotations;
- 3–8 rubric items, each with a yes/no `check`, explanatory detail, and
  `mustPass` flag; at least two items must be mandatory;
- one or more honest verification instructions.

Java exercises are not compiled in the browser. The reference solution and
rubric are revealed only after the user has attempted the exercise. The
self-grade is a teaching ritual, not a remote code runner. If a language later
supports real browser tests, the language manifest's `exerciseMode` switches
the renderer to that mode; content does not lie about execution.

### j. Recap and map contribution

`recap` has 3–5 bullets. The map does not read recap text. Map nodes are created
from `concepts`; this is why concepts need a three-line summary, aliases, tags,
and typed relations. Do not create map edges by hand in a different file.

## Concept authoring

Each concept is declared exactly once, in the lesson that first teaches it.
Other lessons reference it through `revisits`.

A concept has:

- `id`;
- `title`;
- `kind`: `mechanism`, `principle`, `term`, or `failure-mode`;
- exactly three summary lines for the map side panel;
- aliases for search;
- 1–4 tags for topic clustering;
- 0–8 typed relationships.

Relationship types:

- `depends-on`: prerequisites. This graph must be acyclic and must not point
  forward. If a concept genuinely is not needed yet, remove the edge.
- `causes`: a mechanism causing a failure or consequence.
- `contrasts-with`: a meaningful alternative.
- `implemented-by`: the concrete mechanism behind an abstraction.
- `commonly-confused-with`: a distinction worth surfacing.

Keep dependencies genuinely foundational. A trace from a high-level concept to
the machine should be short enough to explain, not a graph of every related
term.

The validator checks:

- duplicate concept IDs;
- relation targets exist and stay in the same language;
- `depends-on` cycles;
- `depends-on` targets are not taught later;
- `revisits` targets exist and were taught earlier;
- each recall question only references concepts introduced or revisited in its
  lesson.

## Question authoring

Every lesson has exactly three recall questions. Supported types:

- `multiple-choice`;
- `predict-output`;
- `spot-the-bug`;
- `order-the-steps`;
- `explain` (self-graded against key points);
- `fill-the-code`.

Every question has a stable ID, at least one concept, a prompt, and an
explanation. Type-specific rules:

- multiple choice: 3–6 options, unique IDs, a correct option that exists;
- predict output: code, language, expected output; optional accepted variants;
- spot the bug: code and a real line number;
- order steps: 3–8 items; correct order contains every item exactly once;
- explain: 3–6 key points and a model answer;
- fill code: placeholders `{{blank-id}}`, matching declared blanks, accepted
  answers, and a hint.

Questions should test mechanism, prediction, and transfer. A recall check made
of three definition questions is a reading quiz, not mastery.

Milestone and interview modes add interview questions from the lesson's
Interview Corner, but those have their own schema and ID namespace. SRS cards
belong to recall questions.

## Factual accuracy

- Java content targets Java 21 LTS as the baseline. Mark newer behavior with
  `versionCaveats`.
- Prefer primary sources: the Java Language Specification, JVM Specification,
  `java.base` Javadocs, JEPs, and official Spring/Hibernate documentation.
- Do not state GC defaults, resize thresholds, proxy choices, or isolation
  defaults without checking the exact version and configuration. A plausible
  internals claim is worse than no claim.
- Code must compile in the version you claim. The sample must be minimal enough
  that its imports and context are obvious; if a fragment intentionally omits
  an enclosing class, say so in the annotation, not in a hidden note.
- If an implementation detail is unspecified by the platform, say it is
  implementation-specific instead of inventing certainty.

`references` is for reader follow-up, not a shield for an unchecked claim.

## Adding a language pack

The engine is language-agnostic. To add a pack:

1. Change its manifest entry in `src/content/languages.ts` from `coming-soon` to
   `available`.
2. Add a non-null `baseline`.
3. Set the correct `exerciseMode` only if the execution adapter actually
   exists.
4. Add `src/content/<language>/levels.ts`.
5. Add lesson modules and their concepts/questions.
6. Run `npm run check`.

No feature component should need a language-specific branch. If it does, the
engine boundary is wrong.

## Incident stories

At least two lessons per level are written as `kind: 'incident-story'`. They
use the same template but start from a realistic production symptom and end
with the concept rebuilt by hand. The failure must be technically possible and
the evidence plausible: heap growth, latency percentiles, thread states, query
counts, connection exhaustion, a chart that looked fine until it did not. Do
not fabricate a dramatic outage for a concept that does not explain it.

## Publication checklist

Before a lesson is ready:

- [ ] All ten sections pass `npm run validate:content`.
- [ ] Every code line reference is correct.
- [ ] The analogy states where it breaks.
- [ ] The "What AI Gets Wrong" items are specific to this topic.
- [ ] Interview Corner has junior, mid, and senior coverage.
- [ ] The exercise's must-pass rubric criteria could actually catch a bad
      solution.
- [ ] The map concepts have three useful lines, not marketing summaries.
- [ ] The lesson has no unsupported version-specific claim.
- [ ] `npm run test` passes.
