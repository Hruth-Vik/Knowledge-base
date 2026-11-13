# FOUNDATION

A free, local-first learning platform for developers who can ship with AI but
want to understand and rebuild the machinery underneath.

Java is the first content pack. Python and JavaScript/TypeScript are declared
as coming-soon slots on the same engine.

## Run it now

```bash
npm install
npm run dev
```

Open the URL Vite prints, normally **http://localhost:5173**.

The app starts with an empty notebook. That is deliberate: reading a lesson does
not mark it done, and no lesson, concept, note, or review card is faked to make
the screens look busier. Fourteen lessons are published: five in Level 00, six in
Level 01, and three in Level 05. They exercise the whole lesson contract while
the rest of the curriculum is written.

### Build and verify

```bash
npm run check     # strict TypeScript, unit tests, content validation
npm run build     # content validation + typecheck + production bundle
npm run preview   # serve the production build, normally at :4173
```

Individual commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run typecheck` | Strict TypeScript over source, scripts, and fixtures |
| `npm run generate:code` | Highlight every authored code block with Shiki at build time |
| `npm test` | Schema, compiler, concept graph, state, lesson progress, SRS, review, milestones, activity, and backup tests |
| `npm run validate:content` | Validate every authored language, level, lesson, and concept |
| `npm run check` | Typecheck, tests, and content validation, in that order |
| `npm run build` | Validate content, typecheck, and emit the production bundle |
| `npm run preview` | Serve the built site locally |

Current verified state: **45 tests passing**, **0 TypeScript errors**, **0 npm
audit vulnerabilities**, and a clean production build.

## What you can inspect

| Route | What it shows |
| --- | --- |
| `/` | Today as a field station: live lesson specimen, notebook pulse, bench, concept atlas, trail, field kit, and activity record |
| `/java` | All 11 Java levels, recommended lesson, derived level status |
| `/java/java.l0` … `/java/java.l10` | Level brief, outcome, chapter state, published lesson links, adjacent levels |
| `/java/java.l0/source-to-process` | L0 lesson: source, bytecode, class loading, and the stack/heap split |
| `/java/java.l0/stale-class` | L0 incident story: a stale build artifact that survives a deploy |
| `/java/java.l1/equality-contracts` | L1 lesson: identity, equals, hashCode, and mutable map keys |
| `/java/java.l1/swallowed-exception` | L1 incident story: a stack trace that disappears into a catch block |
| `/java/java.l5/class-loading` | L5 reference lesson: class loading, linking, and static initialization |
| `/java/java.l5/classloader-leak` | L5 incident story: a redeploy that pins old class loaders and Metaspace |
| `/java/java.l5/gc-pressure` | L5 incident story: allocation rate, live set, and GC pauses |
| `/languages/python` and `/languages/javascript` | Honest coming-soon pack pages |
| `/map` | Concept map with rings, flow, and field layouts, trace mode, and an accessible list |
| `/notes` | Markdown notebook with lesson links, tags, filtering, and Markdown export |
| `/review` | Due queue with one-question practice, honest SM-2 ratings, and a session summary |
| `/quiz/:milestoneId` | Five-lesson checkpoint or level gate, one question at a time |
| `/interview` | Interview prompts with weak, strong, and model answers plus a 0–5 self-score |
| `/play` | Optional chibi field run over the real curriculum; lazy-loaded, reads the notebook, writes nothing |
| `/settings` | Theme, daily goal, rest-day tokens, storage backend, export, import, reset, about |

The command palette (**⌘K** / **Ctrl+K**) searches lessons, concepts, notes, and
static actions from every route.

Working behaviors:

- Today is a field station, not a feed. The recommended lesson is drawn as a
  live specimen with its authored concept links; the atlas is navigable by
  mouse, keyboard, and touch; and the bench shows a real highlighted snippet
  from the lesson rather than invented sample code.
- Light, dark, and system themes; choice persists across reloads.
- IndexedDB primary storage with localStorage fallback and a memory-only warning.
- Corrupt saved records pause autosave and offer a raw download instead of
  overwriting the record.
- Full JSON backup export; import validates first and downloads a pre-import
  backup.
- Daily goal, activity heatmap, rest-day coverage, earned rest-day tokens, and a
  derived streak. Tokens are granted weekly to active notebooks, capped at two,
  and spent only by an explicit action.
- Lesson visits, done marks, recall passes, exercise drafts, rubric checks, and
  exercise pass state persist locally.
- Recall passes only at 3/3. All six question types render in the lesson recall
  check: multiple choice, predict output, spot the bug, order the steps, fill the
  code, and self-marked explanation. Exercise completion requires every
  `mustPass` rubric item.
- Every recall attempt creates or updates a per-question SM-2 card. A correct
  answer schedules the first review tomorrow; a miss schedules it one day out in
  relearning. The review session rates one card at a time and records interval,
  ease, and was-due history.
- Milestones are created only from real completed lessons: every fifth done
  lesson and every fully done level. The quiz samples recall questions with
  weighted, seeded selection, persists each answer, and survives a refresh.
- Quiz results group outcomes into solid, decayed, and fix-it; every fix-it link
  opens the owning lesson's recall stop.
- Interview practice persists a scored attempt per prompt, queues the weakest
  last score first, and never changes the recall schedule.
- Lessons run as a staged journey: cover, 15–16 stops across seven acts, then a
  finish panel. One idea and one code example are visible at a time.
- Journey position, visited stops, and the done mark persist locally under
  `foundation.journey.<lessonId>`.
- The concept map supports rings, dependency flow, and topic fields, remembers
  drag positions per layout, traces authored prerequisites, and has a list view.
- Notes are local Markdown with lesson links, tags, filtering, and a one-file
  Markdown export. The floating notes dock follows the current lesson.
- The Today specimen, atlas, and trail are driven by the compiled catalog. No
  node, count, link, or activity square is generated as decoration.
- Pointer tilt, hero parallax, magnetic primary actions, and count-ups are
  limited to surfaces where they clarify an interaction. Reduced motion removes
  ambient loops and parallax without hiding content.
- The optional chibi field run at `/play` is a lazy route over the same compiled
  catalog. It reads notebook state for its map, writes no fields, and is offered
  from the field kit and lesson finish without replacing the next lesson action.
- Search is a MiniSearch palette over lessons, concepts, notes, and static
  actions, with keyboard navigation and highlighted matches.
- Interview answers are self-scored 0–5 and stored as local attempts. They do
  not create SRS cards or inflate review history.
- Keyboard skip link, visible focus, route-level code splitting, and layouts
  checked from 390px upward without horizontal overflow.

## Stage checklist

This is the live build record. Items are marked done only after the code,
validation, and a browser check pass.

### Stage 1 — foundation · DONE

- [x] Vite + React 18 + strict TypeScript scaffold with `@` path alias
- [x] Zod schemas for languages, levels, lessons, concepts, questions, and persisted state
- [x] Content compiler with identity, placement, cross-reference, and cycle checks
- [x] Compiled concept registry with typed relations and transitive `depends-on` tracing
- [x] State model: lesson progress, mastery, review cards, notes, map, activity, streak
- [x] Design tokens for warm paper light mode and blue-ink dark mode
- [x] Build-time content validator and complete lesson fixture
- [x] Initial unit suite (18 tests at the end of Stage 1)

### Stage 2 — runnable app shell · DONE

- [x] `index.html`, React mount, first-paint theme hint, favicon, and noscript copy
- [x] Lazy router with error boundary, 404 page, and keyboard skip link
- [x] App shell: header, primary navigation, route focus management, footer counts
- [x] Today screen with date, goal marks, review count, streak, and activity heatmap
- [x] Java roadmap with all 11 levels and recommended-start bracket
- [x] Level brief pages with outcome, honest empty chapter state, adjacent navigation
- [x] Language pack pages with available and coming-soon states
- [x] Map, Notes, and Review placeholders that name the stage that implements them
- [x] Settings: theme, daily goal, storage backend, about
- [x] Zustand store with async IndexedDB/localStorage/memory persistence
- [x] Hydration gate, schema-validated merge, corrupt-record recovery mode
- [x] Complete JSON export, validated import, pre-import backup, confirmed reset
- [x] Backup, activity, streak, level-status, and derivation tests (28 total)
- [x] Production build passes; desktop, mobile, light, and dark checked in Chrome

### Stage 3 — lesson engine and L5 reference lesson · DONE

- [x] Write the complete L5 reference lesson: problem, analogy, mental model,
      runtime walkthrough, annotated code, deliberate failure, AI failure modes,
      interview corner, exercise, recap, and three recall questions
- [x] Add build-time Shiki highlighting with line annotations and emitted tokens
- [x] Build the lesson route `/java/:levelId/:lessonSlug` with a lazy lesson chunk
- [x] Build the typeset lesson renderer with section index, figures, and margin notes
- [x] Add custom mental-model diagram primitives with captions and required alt text
- [x] Add the three-question recall check; passing requires 3/3
- [x] Add the exercise draft editor and rubric self-check; persist draft and pass state
- [x] Add the interview corner with folded answers and self-scored rubric
- [x] Record lesson open, done, recall pass, and exercise pass in the notebook
- [x] Replace level-page lesson metadata with working lesson links
- [x] Add tests for lesson loading, recall pass rules, exercise pass rules, and progress
      (32 tests total)
- [x] Verify the complete lesson at desktop and mobile in both themes

### Stage 4 — map, notes, and search · DONE

- [x] Compile the lesson metadata, concepts, questions, and highlighted code from typed modules at build time
- [x] Split every page and feature surface into a lazy route chunk
- [x] Build the concept map with radial, dependency-flow, and cluster layouts
- [x] Add trace mode over authored `depends-on` edges only
- [x] Add the concept side sheet, learned/decaying/mastered states, and an accessible list view
- [x] Persist per-layout node positions and reset a layout without touching the others
- [x] Build the notes editor with Markdown preview in the reading style
- [x] Link notes to lessons and concepts, filter the notebook, and export all notes to one Markdown file
- [x] Add MiniSearch indexes over lessons, concepts, notes, and static actions
- [x] Add the command palette with keyboard navigation and highlighted matches
- [x] Add the floating notes dock with lesson context on every route
- [x] Verify map, notes, search, and export at desktop, 390px, keyboard-only, and reduced motion

The original brief also proposed `[[wiki links]]`, backlinks, captured lesson
excerpts, and a zip export. Those are recorded under “Later, not scheduled”
rather than claimed as shipped; the notebook links notes to a whole lesson and
exports one Markdown file.

### Stage 5 — review, assessment, and interview practice · DONE

- [x] Implement the SM-2 scheduler as a pure, tested function per recall question
- [x] Create and update SRS cards from recall attempts without counting them as scheduled reviews
- [x] Build the review queue with due reason, concept, one-question practice, and honest ratings
- [x] Add review result states without revoking historical mastery
- [x] Derive concept decay from cards and reflect it on the map
- [x] Implement five-lesson and level-end milestone detection from done lessons only
- [x] Implement weighted, seeded quiz selection from completed lessons
- [x] Build milestone and level-end quiz screens with persisted in-progress attempts
- [x] Build the result breakdown: solid, decayed, and fix-it with links to the owning recall stop
- [x] Build interview practice mode: one question, folded answer, 0–5 self-score, persisted attempts
- [x] Implement rest-day token earning and explicit spending
- [x] Add scheduler, selector, milestone, review, and rest-token tests before UI wiring (45 tests)
- [x] Verify review, quiz, and interview flows in the browser and check the responsive rules at 390px

The fix-it links open the owning lesson at its recall stop rather than a deep
anchor to an individual section. The journey exposes one stable `?stop=recall`
entry point; per-section anchors are a later refinement, not a claim in this
stage.

### Stage 6 — complete L0, L1, and L2 · DONE

- [x] Author the first L0 lesson, “What Actually Runs When You Press Run”
- [x] Author the first L1 lesson, “Why Equal Objects Still Go Missing”
- [x] Declare concepts, aliases, relations, and revisit links for both levels
- [x] Add recall questions, interview questions, exercises, and rubrics
- [x] Add figures with captions and alt text
- [x] Author all five L0 lessons for “How a Computer Runs Your Code”
- [x] Author all six L1 lessons for “The Language Core”
- [x] Author all five L2 lessons for “Objects Built Properly”
- [x] Add two incident-story lessons to each of L0 and L1 (stale-class,
      nano-overflow, rounding-refund, swallowed-exception)
- [x] Validate the full L0–L2 catalog: 19 lessons, 65 concepts, 114 recall
      questions, 57 interview prompts, zero warnings
- [x] Read every L0–L2 lesson in the browser at desktop and mobile in both themes
- [x] Confirm level mastery and roadmap status update from real evidence

### Stage 6b — field-station interface rewrite · DONE

- [x] Rebuild Today around a live lesson specimen, notebook pulse bento, bench,
      concept atlas, horizontal trail, field kit, and activity record
- [x] Add an interactive atlas with level tabs, keyboard navigation, authored
      edges, trace mode, a concept index, and mobile scroll-centering
- [x] Add pointer tilt, capped hero parallax, magnetic CTAs, count-ups, and
      spring entrances with a complete reduced-motion path
- [x] Add shared glass chrome: fixed paper wash, translucent header and mobile
      bottom nav, notes dock, page headers, and section rules
- [x] Add a 160ms enter-only route transition and warm lazy route chunks on
      link intent and idle time, with no exit animation blocking navigation
- [x] Keep blur on fixed chrome and the focal observation surface; large
      scrolling cards use opaque vellum, and mobile chrome drops blur entirely
- [x] Coalesce tilt, magnetic, and trail pointer work into animation frames, and
      pause ambient motion when the hero is offscreen or the tab is hidden
- [x] Review the build with Impeccable, fix detector findings, and verify at
      1440px and 390px in light and dark themes
- [x] Record the rewrite in the README, architecture, state model, and design
      direction

### Stage 7 — Java levels L3–L4 · TODO

- [ ] Author L3 “Data, Generics, and Streams”
- [ ] Author L4 “Concurrency and the Java Memory Model”
- [ ] Add concepts, questions, exercises, rubrics, and figures for both levels
- [ ] Validate, test, and read through both levels in the browser

### Stage 8 — Java levels L6–L10 · TODO

- [ ] Author L6 “Concurrency and the Memory Model”
- [ ] Author L7 “The JVM in Depth”
- [ ] Author L8 “Spring and the Web”
- [ ] Author L9 “Databases and Persistence”
- [ ] Author L10 “Production: Observability, Performance, and Incidents”
- [ ] Add concepts, questions, exercises, rubrics, and figures for these levels
- [ ] Validate, test, and read through all five levels in the browser

### Stage 9 — release quality · TODO

- [ ] Full WCAG AA contrast and keyboard audit across every route
- [ ] Screen-reader pass over navigation, lessons, figures, map list, and review
- [ ] Performance pass: route chunks, font loading, highlighting, map interactions
- [ ] Split lesson bodies out of the eager metadata catalog when the library grows
- [ ] Offline behavior check and storage-failure recovery walkthrough
- [ ] Backup round-trip test with a populated notebook
- [ ] Print/read-on-paper stylesheet for lessons
- [ ] Final content accuracy review of all Java levels
- [ ] Tag the first complete release

### Later, not scheduled

- [ ] Resolve `[[wiki links]]` and show backlinks in notes
- [ ] Capture lesson excerpts with source and section metadata from the notes dock
- [ ] Add a zip/Markdown note export alongside the JSON backup
- [ ] Python pack on the same engine
- [ ] JavaScript/TypeScript pack on the same engine

## Why most levels are still empty

Content is data, not UI. The catalog is compiled from lesson modules at build
time, and every page reads that catalog rather than inventing placeholder
lessons. Today the compiled catalog contains **11 levels, 19 lessons, 65
concepts, 114 recall questions, and 57 interview prompts**. Level 00 has five
lessons, Level 01 has six, Level 02 has five, and Level 05 has the reference
lesson plus two incident stories. The other chapters remain briefs.

Adding filler lessons would make the roadmap and map look finished while making
progress, review, and search dishonest. The next content milestone moves into
L3 and L4. The map, notes, and search are already wired against the real
registry, so new lessons appear without a second index to maintain. Content
validation currently reports zero warnings.

## Design process

The Stage 6 rewrite used the project-scoped Impeccable skill. `PRODUCT.md`
records product truth (what exists, who it is for, and what must not be faked);
`docs/design-direction.md` records the visual system. Read both before changing a
screen.

After UI work, run the detector against the touched surfaces:

```bash
.opencode/skills/impeccable/scripts/impeccable.cmd detect src/
```

Then inspect Today at 1440px and 390px in light and dark, including an atlas
interaction and the open notes dock. A detector pass is a floor, not a visual
review.

## Read the decisions

- [`docs/architecture.md`](docs/architecture.md): boundaries, content pipeline,
  concept registry, routes, persistence, performance, and trade-offs.
- [`docs/design-direction.md`](docs/design-direction.md): the warm field-lab
  visual direction, palette, typography, staged lesson journey, map, notes,
  search, motion, voice, and bans.
- [`docs/state-model.md`](docs/state-model.md): mastery, SRS, milestones,
  streaks, notes, map state, corruption handling, and export format.
- [`docs/content-authoring.md`](docs/content-authoring.md): the complete lesson
  contract, concept rules, question types, accuracy policy, and pack extension.

## Data and backup

Everything lives in this browser. There is no account, server copy, or
telemetry. Settings → Data exports one complete `foundation.backup` JSON file.
Import validates the envelope and state, then downloads a backup of the current
notebook before replacing it. Clearing browser storage without an export removes
the record.

## Current version

`0.6.0` — Stage 6: the full L0–L2 curriculum, the optional chibi field run, and
the field-station interface. The stage label is also shown in Settings and the
header.
