# FOUNDATION architecture

Status: Stage 6. The foundation, runnable shell, staged lesson engine, concept
map, notes notebook, command palette, SRS review, milestone quizzes, interview
practice, rest-day tokens, the full L0–L2 curriculum, the optional chibi field
run, and the field-station interface are delivered. Today the Java roadmap, level
briefs, language pack pages, Settings, persistence, JSON backup, and nineteen
published lessons are live. Each lesson includes build-time highlighting, a
mental-model figure, recall, an exercise editor and rubric, interview practice,
and persisted progress. The remaining curriculum is later stages.

## What the product is

A static, local-first learning site for working developers who can prompt their
way into a running application but cannot explain its internals or rebuild the
core idea without assistance.

The content teaches in a fixed shape: the problem, an analogy that maps to the
mechanism, a mental-model figure, a runtime walkthrough, annotated code, a
deliberate failure, AI failure modes, interview practice, a from-scratch
exercise, and a short recap. The schema enforces that shape.

There is no server, account system, or telemetry. User data lives in the
browser and can be exported as one JSON file.

## Non-negotiable boundaries

1. **Content is data, not UI.** Content modules cannot import React, design
   primitives, or feature code. The validator and later content compiler are
   the only consumers at build time; feature code consumes the compiled
   catalog.
2. **The core is language-agnostic.** Adding Python or JavaScript means adding
   a language manifest, level manifests, and content modules. It must not
   require a second lesson engine.
3. **Stable IDs are contracts.** Lesson, concept, and question IDs are stored
   in notes, progress, quizzes, and SRS cards. Renaming one is a migration.
4. **The build fails instead of publishing a bad lesson.** A missing section,
   duplicate concept, broken question, or unknown relation stops validation.
5. **No fake runtime.** Java exercises use a draft editor plus hidden
   reference solution and rubric self-check. Browser execution is reserved for
   language packs that can actually support it.
6. **Local-first means local-only data.** Export is a first-class feature, not
   an escape hatch bolted on later.

## Folder structure

```text
.
├── docs/
│   ├── architecture.md
│   ├── content-authoring.md
│   ├── design-direction.md
│   └── state-model.md
├── scripts/
│   ├── build-lesson-assets.ts       # build-time Shiki token generation
│   └── validate-content.ts
├── src/
│   ├── app/                         # shell, router, store, pages, UI primitives
│   │   ├── lesson/                  # journey, Markdown, code, figure, recall, exercise
│   │   ├── map/                     # concept node and layout helpers
│   │   ├── pages/                   # route-level screens, including quiz and interview
│   │   ├── review/                  # shared one-question practice component
│   │   ├── today/                   # specimen, atlas, code peek, tilt, magnetic link
│   │   └── ui/                      # shared primitives, search palette, notes dock
│   ├── design/                      # tokens and global foundation
│   │   ├── fonts.css
│   │   ├── global.css
│   │   └── tokens.css
│   ├── features/                    # intentionally empty; feature code stays in app/
│   ├── lib/
│   │   ├── concepts/                # compiled graph and trace traversal
│   │   ├── content/                 # compile, catalog, and cross-reference validation
│   │   ├── review/                  # answer grading, weighted selection, milestones, shuffle
│   │   ├── schema/                  # content and persisted-data schemas
│   │   ├── srs/                     # SM-2 scheduler and card schema
│   │   ├── state/                   # state types, derivations, activity, lesson progress
│   │   └── storage/                 # IndexedDB/localStorage adapter and backups
│   └── content/
│       ├── languages.ts             # Java available; Python/JS coming soon
│       ├── generated/               # emitted Shiki token JSON
│       ├── java/
│       │   ├── levels.ts            # all 11 levels
│       │   ├── l0/                  # five authored lessons
│       │   ├── l1/                  # six authored lessons
│       │   └── l5/                  # reference lesson and two incident stories
│       ├── python/
│       └── javascript/
├── tests/
│   ├── fixtures/
│   ├── activity.test.ts
│   ├── backup.test.ts
│   ├── concepts.test.ts
│   ├── content.test.ts
│   ├── lesson-state.test.ts
│   ├── quiz.test.ts
│   ├── srs.test.ts
│   └── state.test.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

The folder structure follows the requested layout. `features/` remains empty;
the shell and route composition stay under `app/`, while pure domain logic stays
under `lib/`. Lesson-specific presentation components live in `app/lesson/`,
map presentation lives in `app/map/`, and both load only with their routes.

## Dependency direction

```text
content -> lib/schema -> lib/content -> build catalog -> features -> app
                  \-> lib/concepts
lib/state -> lib/srs + lib/schema
app -> features -> lib/*
lib/* must not import from features or app
content must not import from features, app, or design
```

The diagram is a dependency rule. Stages 2–5 implement the `app -> lib/*` and
`app -> content` directions; `lib/*` still imports no React, feature, or app
code.

## Content format decision

Lessons are TypeScript modules under
`src/content/<language>/<level>/<lesson-slug>.lesson.ts`. Each exports one
`lesson` object. Prose fields contain Markdown strings; code is kept in explicit
code fields so the renderer can attach line annotations, output, and Shiki
highlighting without parsing prose for structure.

TypeScript was chosen over MDX because:

- the template is a strict contract, not an authoring suggestion;
- every code block needs adjacent annotations and metadata;
- content fields must be queryable by the concept registry, search builder, and
  quiz generator without evaluating React;
- MDX invites presentation decisions into content, which makes language packs
  depend on the UI.

The cost is verbosity. That is accepted: the build gate catches structural
mistakes before they reach a reader.

### Validation flow

```text
lesson module
    |
    v
Zod lesson schema  ── missing section / bad annotation / wrong recall count
    |
    v
cross-content compiler
    |── duplicate lesson, slug, sequence, or question ID
    |── chapter title conflict
    |── unknown level, language, or concept
    |── forward revisit or forward depends-on edge
    |── cross-language relation
    |── invalid file location or filename
    `── depends-on cycle
    |
    v
Compiled catalog + ConceptRegistry
```

`npm run validate:content` runs this against everything in `src/content`.
`tests/fixtures/sample-lesson.ts` is a complete test-only lesson used to prove
that a valid lesson passes and a missing section fails.

At build time the same compile result feeds the in-app catalog through Vite's
`import.meta.glob`. The catalog currently imports every authored lesson module
eagerly. With five published lessons the pass is small, and it keeps search,
the map, and quiz selection reading one compiled source. Splitting lesson bodies
into generated metadata plus lazy route chunks is a Stage 9 performance task,
not a second index.

### The concept registry is compiled, not hand-maintained

Each concept is authored exactly once in the lesson that introduces it. The
compiler collects those declarations into a single `ConceptRegistry`. It
validates every relation target, enforces a single language, and rejects cycles
in `depends-on` edges. Lessons that use an older concept list it in `revisits`.

This avoids the common failure mode of a hand-maintained graph: lessons and map
nodes drift apart until the map is decorative and wrong. The registry owns the
node summary, aliases, tags, and typed relationships; lessons own the teaching
context. Notes and custom map nodes reference the same stable concept ID.

The map's "trace a concept" operation follows transitive `depends-on` edges
only. Contrast and confusion edges are meaningful, but they are not
prerequisites and must not be presented as first principles.

### Build-time highlighting

`npm run generate:code` walks the authored lesson modules, collects every code
block, and runs Shiki once per unique `(language, code)` pair. It writes
`src/content/generated/highlighted-code.json`, keyed by the same
`codeBlockKey(language, code)` used by the renderer. The browser reads token
colors from that JSON; it never ships or invokes Shiki. The generated file is
required before typecheck and is refreshed by `predev`, `prebuild`,
`precheck`, and `pretypecheck`.

The token file stores both light and dark theme colors. The renderer chooses the
theme through CSS variables, so switching themes does not re-highlight code.

## Routing plan

The router uses route-level code splitting. Stages 2–6 implement the shell
routes, the lesson reader, the concept map, the notebook, SRS review, milestone
quizzes, interview practice, and the optional field run:

```text
/                          Today                              implemented
/java                      Java roadmap                       implemented
/java/:levelId             Level overview and chapter path    implemented
/java/:levelId/:lessonSlug Lesson reader                      implemented
/languages/:languageId     Language pack status               implemented
/map                       Knowledge map                      implemented
/notes                     Global notebook                    implemented
/review                    Review queue and session           implemented
/quiz/:milestoneId         Milestone or level-gate quiz       implemented
/interview                 Interview practice                 implemented
/play                      Optional chibi field run           implemented
/settings                  Theme, daily goal, data            implemented
*                          Not found                          implemented
```

A command palette overlays every route. It builds a MiniSearch index over
lessons, concepts, notes, and static actions from the compiled catalog and the
loaded notebook; it does not fetch from a server. The index is derived state, so
there is no second copy to keep in sync.

Level access is never hard-locked. A recommended next lesson is derived from
progress, but every lesson URL remains reachable. The UI may call a level "ahead
of recommendation"; it stores no lock bit.

## State and persistence

The persisted state contract is in `src/lib/state/schema.ts`; the reasoning and
policies are in `docs/state-model.md`.

- Zustand owns the application store; Stages 2–5 implement it.
- Persisted slices use `zustand/persist` with an async storage adapter.
- Lesson interactions are pure state mutations in `lib/state/lesson.ts` and
  Zustand actions in `app/store.ts`. The store records visits, done marks, recall
  attempts, exercise drafts, rubric checks, and exercise passes.
- Review, quiz, milestone, interview, and rest-day mutations are pure functions
  in `lib/state/review.ts`, `lib/state/streak.ts`, and `lib/review/milestones.ts`;
  the store only applies them. Scheduled reviews append a log, while recall
  attempts create or update cards without fake review history.
- The chibi field run reads the compiled catalog and derived notebook status. It
  has no mutations, no economy, and no completion signal of its own.
- Primary storage is IndexedDB via `idb-keyval`. If IndexedDB is unavailable,
  the adapter uses localStorage. One backend is chosen per session; the app
  does not silently write divergent copies to both. If both are unavailable, the
  session runs in memory and the UI warns that it will not persist.
- The persisted payload is versioned (`schemaVersion: 1`). A version change is
  passed through the Zod schema during hydration rather than silently discarded.
- A corrupt or schema-invalid record pauses writes, keeps the record intact, and
  offers a raw download or a deliberate fresh start. A blank session never
  overwrites unreadable data.
- Export is the complete user-data object wrapped in a
  `foundation.backup` envelope. Import validates the envelope and state before
  replacing anything, and downloads a pre-import backup first.
- Transient UI state (open drawers, map hover, command palette query) is never
  persisted.

The state model already distinguishes reading from mastery:

```text
marked done + recall 3/3 + exercise rubric passed => mastered
```

A lesson can remain "done" indefinitely while those conditions are incomplete.
No timer or scroll depth can manufacture mastery.

## SRS and quiz selection

SM-2 is implemented per question, not per lesson, in `lib/srs/scheduler.ts`.
Each recall question has its own card; each card records one or more concept IDs.
Concept decay is derived from the cards, so reviewing a question updates the map
without pretending the entire lesson was reviewed.

Success intervals are 1 day, 6 days, then
`round(previousInterval × easeFactor)`. A failed recall resets repetitions,
sets a 1-day interval, enters `relearning`, and increments lapses. Ease is
clamped to 1.3. Recall attempts grade a card with a fixed 4 (correct) or 2
(incorrect) so the first genuine review lands later; they do not count as
review activity. Only the review queue appends `ReviewLog` entries and
`reviewsCompleted` activity.

Milestone quizzes are pulled from previously completed lessons, weighted toward
overdue cards, prior wrong answers, decaying concepts, and prerequisite concepts
for what comes next. Selection is seeded by the milestone ID, caps each concept
at two questions, and prefers at least two question types. The default size is
eight for a five-lesson milestone and twelve for a level gate, capped by the
pool. The contract is documented in `docs/state-model.md` and covered by unit
tests before the UI consumes it.

Question IDs are the SRS identity. Interview questions have their own stable
IDs under the lesson's `interview` namespace. Interview practice stores
`kind: 'interview'` attempts with a 0–5 self-score; milestone matching ignores
those attempts, and they never create SRS cards.

## Search

Stage 4 builds the command palette on a MiniSearch index over lessons, concepts,
notes, and static actions. The index is derived from the content catalog, the
user's notes, and the route table; it is not another source of truth. Search
results link by stable ID and survive content changes as dangling references,
which the UI labels rather than silently discarding. Query text, results, and
ranking are never persisted.

## Performance

- Initial route does not import Shiki, React Flow, the lesson Markdown renderer,
  or the search component. Each route is lazy.
- Route chunks are warmed on link hover, focus, and press, plus once during idle
  time for the primary navigation. Navigation renders the new route immediately
  with a 160ms enter-only transition; there is no exit animation.
- Pointer tilt and magnetic links write motion values once per animation frame.
  They never set React state on pointer move, and the hero pauses its ambient
  drift when it is offscreen or the tab is hidden.
- Backdrop blur is limited to fixed chrome and the focal Today observation
  surface. Large scrolling cards use translucent vellum without a second blur;
  the mobile header and bottom nav fall back to near-opaque fills.
- The compiled catalog eagerly imports five lesson modules so metadata, search,
  the map, and future quiz selection share one source. Splitting lesson bodies
  out of the catalog is a Stage 9 task once the library grows.
- Shiki highlighting is generated at build time; the client does not run the
  highlighter on every page load.
- Fonts are self-hosted and subset by weight/usage via Fontsource.
- The knowledge map only receives visible graph data on first paint; layout and
  trace computation are memoized.
- Target: Lighthouse 95+ on the content pages at mobile settings, with 60 fps
  interactions for map pan/zoom where the hardware allows.

## Accessibility contract

- WCAG AA contrast for all text and interactive states.
- Color is never the sole carrier of status: labels, icons, and shape/line
  changes accompany semantic colors.
- Full keyboard path through navigation, lesson controls, quizzes, and map
  panels.
- The map has a parallel accessible list view; a canvas of nodes is not the
  only way to reach a concept.
- Focus is visible and follows document order; no focus traps except intentional
  modal dialogs.
- Diagram alt text is required by the content schema, not authored
  opportunistically.
- `prefers-reduced-motion` removes the route entrance, hero parallax, pointer
  tilt, map animation, and ambient motion.
- Responsive from 360px upward; the reading measure stays between 62 and 72ch.

## Tests and build gate

- `npm run typecheck`: strict TypeScript, including test fixtures.
- `npm test`: content schema, compiler, concept graph, state model, activity,
  streak, level derivation, lesson progress, backup, SM-2 scheduling, review
  cards, quiz selection, milestones, and interview records (45 tests).
- `npm run validate:content`: validation over every authored pack. The Stage 6
  catalog reports 3 declared languages, 19 lessons, 65 concepts, 114 recall
  questions, 57 interview prompts, and zero warnings.
- Stage 5 added the scheduler, review, selection, milestone, and rest-token tests
  before the UI consumed them. Review, quiz, interview, and rest-day flows were
  verified in the browser; responsive rules are defined down to 390px.
- Stage 6 added no new persistence. The field-station surfaces are derived from
  the existing notebook and compiled catalog. UI changes were checked with the
  Impeccable detector and browser captures at 1440px and 390px in both themes.

## Deliberate deferrals

Stages 3–6 publish the lesson engine, the complete L0–L2 curriculum, the L5
reference lesson and incident stories, the concept map, the notebook, search,
SRS review, milestone quizzes, interview practice, rest-day tokens, the
field-station Today screen, and the optional chibi field run. Fix-it links open
a lesson's recall stop; deeper per-section anchors are a later refinement. The
rest of the Java curriculum follows in Stages 7–8. No placeholder invents cards,
lessons, or review history to make a screen look finished.

## Requirement conflicts resolved

- The brief says content at `/content/...` and later specifies
  `/src/content/java/...`. The architecture requirement is more specific, so
  content lives under `src/content`. The boundary that matters is preserved:
  content never imports UI.
- "Build-time Shiki" and route-level code splitting are compatible if
  highlighted tokens are emitted per lesson in the build catalog. The highlighter
  will not be shipped to the client unnecessarily.
- Java browser compilation is not implemented and will not be faked. The
  exercise workflow uses manual verification and rubric self-assessment, as
  allowed by the brief.
