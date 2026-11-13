# FOUNDATION design direction

## The identity in one sentence

A warm field station for taking software apart: cream paper, deep ink,
saturated specimen colors, labeled surfaces, and motion that makes progress
feel physical.

That is not a mood board. It decides how much ink an edge gets, when a card is
allowed to lift, how a lesson advances, and what celebration is allowed to look
like. FOUNDATION should feel like a place where mechanisms are opened, labeled,
and rebuilt, not like a book, a blog, a docs site, or a productivity dashboard.

## Why this direction

The product is about internal understanding. A growth-product shell would make
the wrong promise: streaks as a game, content as a feed, progress as a number to
protect. A literary notebook would make the opposite mistake: it would suggest
that reading carefully is the same as building evidence.

The field-station identity sits between those failures. It borrows from:

- field guides: specimen labels, diagram callouts, short factual captions;
- repair manuals: numbered procedures, warnings, and visible failure states;
- lab notebooks: dated records, compact metadata, taped-in observations;
- physical workbenches: tools laid out, parts labeled, a place for everything.

It does not borrow from SaaS landing pages, generic documentation themes, or
terminal cosplay. The interface is colorful because the material is alive, not
because the product is trying to entertain.

## Palette

All values live in `src/design/tokens.css`. Feature code consumes semantic
tokens, never raw hex values or arbitrary shadows.

### Light mode

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#F1EBDE` | warm paper, page field |
| `--color-bg-raised` | `#FBF7ED` | sheets, cards, selected surfaces |
| `--color-bg-sunken` | `#E7DFCD` | inset fields, code gutters |
| `--color-bg-strong` | `#D9CDB6` | pressed and deep inset surfaces |
| `--color-ink` | `#191813` | primary text and outlines |
| `--color-ink-secondary` | `#45433A` | secondary prose |
| `--color-ink-muted` | `#696458` | metadata and captions |
| `--color-rule` | `#D3C7B1` | hairlines |
| `--color-rule-strong` | `#998D77` | stronger dividers and borders |
| `--color-accent` | `#B23B17` | actions, links, focus, active controls |
| `--color-correct` | `#2C5C3E` | correct recall, mastered |
| `--color-incorrect` | `#9D2B24` | wrong answer, destructive action |
| `--color-decaying` | `#77530C` | review due, fading concept |

Primary text, muted metadata, accent links, and state colors all meet WCAG AA on
the paper field. Paper text on the accent fill uses `--color-on-accent`.

### Dark mode

Dark mode is a low-glare workbench, not a pure-black terminal and not a simple
inversion. Cream turns to smoked paper; the specimen colors brighten enough to
keep their identities.

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#14130F` | page field |
| `--color-bg-raised` | `#1C1A14` | sheets and controls |
| `--color-bg-sunken` | `#0E0D0A` | inset fields |
| `--color-ink` | `#F2EBDB` | primary text |
| `--color-ink-muted` | `#A8A091` | metadata |
| `--color-rule` | `#3A362B` | hairlines |
| `--color-accent` | `#FF9C73` | actions, links, focus |
| `--color-correct` | `#8FD0AA` | correct/mastered |
| `--color-incorrect` | `#FF9D91` | incorrect |
| `--color-decaying` | `#E6C477` | review due |

### Specimen tones

A second palette gives sections, figures, and states an identity. Rust remains
the only action color. The other tones are labels, not affordances.

| Tone | Light | Dark | Used for |
| --- | --- | --- | --- |
| rust | `#B23B17` | `#FF9C73` | problem, actions, active navigation |
| ochre | `#77530C` | `#E6C477` | analogy, recap, decaying state |
| teal | `#14655D` | `#6FD3C7` | mental model, build-it |
| indigo | `#3A4C9E` | `#A4B3F5` | under the hood, concepts |
| plum | `#6F3A72` | `#D5A6D8` | AI failure modes |
| oxide | `#9D2B24` | `#FF9D91` | break-it, incorrect state |
| moss | `#2C5C3E` | `#8FD0AA` | interview corner, finish, correct |
| sun | `#C58C13` | `#F2BE4E` | achievement, daily marks |
| sky | `#2F6FA0` | `#8CC0E9` | reference and secondary links |
| rose | `#A83761` | `#ECA0BF` | notes and personal material |

Rules:

- Rust is reserved for the next action and current location.
- Tones may color an edge, a stamp, a wash, a diagram node, or a small label.
  They must not become a large solid fill behind body text.
- Correct, incorrect, and decaying always pair color with a word, icon, or
  shape. A colorblind reader never has to infer state from hue alone.
- The fixed page glow and grain are atmosphere. They never carry meaning.

## Typography

- **Display and UI: Archivo Variable.** Compact grotesque bones. It carries
  page titles, lesson-stop titles, navigation, buttons, forms, and dense
  metadata. Display headings use heavy weights, tight leading, and negative
  tracking.
- **Long-form reading: Newsreader Variable.** The serif is reserved for prose
  that deserves a slower pace: lesson bodies, hero decks, notes previews, and
  quiet explanatory copy.
- **Code and metadata: IBM Plex Mono.** Used for code, timestamps, figure
  numbers, section labels, and keyboard hints.

Rules:

- Reading measure is capped at 68ch; lesson prose sits closer to 62ch.
- Body text is 17–19px with 1.7 leading. UI text is 14–15px with 1.4–1.55.
- Display headings are allowed to wrap into three or four lines and should feel
  placed, not floated.
- Section labels are uppercase mono at 11–12px with 0.12em tracking.
- Interactive text never drops below 12px, and touch targets stay at least
  44×44 CSS pixels.
- Fonts are self-hosted through Fontsource. There is no runtime font request.

## Surface grammar

- Pages are composed from labeled panels, not an endless grid of identical
  cards. A panel has a 1px ink-mixed border, a generous tile radius, a wash tied
  to its tone, and a physical shadow.
- `--radius-xs` is 2px, `--radius-lg` is 8px, `--radius-tile` is 18px, and
  `--radius-tile-lg` is 26px. Pills are reserved for compact state labels and
  progress chips, not buttons.
- Elevation is physical, not generic. `--shadow-sticker` is a hard offset used
  for badges and callouts; `--shadow-lift` and the glass shadows are soft
  contact shadows, not floating UI clouds.
- Buttons have visible borders, a pressed state, and a small translate on
  press. Primary actions use the accent fill; secondary actions stay on paper.
- Focus is a 2px accent outline with a 3px offset, visible in both themes.
- The page uses a warm wash, a section index, and a clear reading order.
  Decorative rings, orbit dots, spectrum rules, and corner stamps are drawn with
  CSS, not images.

### Glass grammar

Glass is vellum over the workbench, not a filter applied to everything.

- `--glass-bg`, `--glass-bg-strong`, and `--glass-bg-soft` are translucent
  vellum fills. `--glass-border` and `--glass-border-strong` keep edges legible.
- `backdrop-filter` is reserved for **fixed chrome** (sticky header, notes dock,
  command overlay) and the **focal observation surface** on Today. Large
  scrolling cards use `--glass-bg-strong` without a backdrop blur; the wash,
  hairline, and shadow already carry the material.
- Never nest one blurred surface inside another. Small labels over a blurred
  surface use a near-opaque fill instead of a second blur.
- On phones, the header and bottom navigation drop backdrop blur for a
  near-opaque vellum fill. The visual read is the same and every scroll frame
  keeps its budget.
- A blur should change the read. If the surface behind the card is a soft page
  wash, the blur is removed.

## Motion system

Motion is the difference between a page and a place. It must always explain a
change or mark an accomplishment.

| Token | Value | Use |
| --- | --- | --- |
| `--motion-instant` | 80ms | press and selection feedback |
| `--motion-fast` | 150ms | hover, tab, and toggle changes |
| `--motion-base` | 240ms | panel entrance, reveal, step change |
| `--motion-slow` | 400ms | progress fills and larger state changes |
| `--motion-map` | 520ms | map layout and trace transitions |
| `--motion-ambient` | 18s | slow orbit, glow, and spectrum drift |

Easing:

- `--ease-standard` for UI state.
- `--ease-exit` for dismissals.
- `--ease-spring` for emphasis arrivals: a fast deceleration, not a bounce.
- `--ease-map` for graph transitions.

The motion vocabulary:

- **Route enter**: a 160ms opacity and 8px rise when a route mounts. There is no
  exit animation and navigation never waits for the old page. Lazy chunks are
  warmed on link hover, focus, press, and during idle time.
- **Reveal**: content rises and fades in when it enters the viewport. Content is
  visible without JavaScript; the animation is an entrance, not a gate.
- **Stamp**: progress rings, stepped bars, and done marks arrive with a spring.
- **Confetti**: square paper chips fire at the halfway point, the finish, and
  when a lesson is marked done. It is celebratory, brief, and never blocks input.
- **Signal**: small status dots pulse slowly on live or in-progress panels.
- **Cheer**: a short line near the lesson controls acknowledges each stop and
  marks quarter/midpoint milestones.
- **Trace**: map edges draw and unrelated nodes dim when trace mode is active.
- **Depth**: the Today hero drifts at a different rate from the page as it
  scrolls out of view. The depth is confined to the hero, driven by motion
  values, and disabled for reduced motion.
- **Tilt and magnet**: the bench card tilts a few degrees under a mouse and the
  primary action leans toward the pointer. Both are motion-value only, sampled
  once per animation frame, and disabled for touch and reduced motion.

Rules:

- Animation never delays access to content or the next route.
- No scroll-jacking, no permanent `will-change`, and no decorative float on
  static text. Ambient drift is confined to the hero and pauses when the hero
  is offscreen or the tab is hidden.
- Pointer response never sets React state per event or per frame. Transforms are
  written through motion values; layout reads happen at most once per frame.
- `prefers-reduced-motion: reduce` disables ambient loops, confetti, reveals,
  parallax, tilt, and route motion. The interface becomes near-instant, not
  broken.
- No essential information exists only in motion or color.

## Screen briefs

### Shell

The header is a lab shelf: a stamped FOUNDATION mark, a compact primary nav with
numbered links, the current rank and XP, search, and theme controls. On mobile the
nav becomes a bottom bar and the notes action becomes a compact circular FAB.
The skip link, route focus, and active-route state are always present.

### Today

Today is a field station, not a dashboard. It opens with a hero that names one
mechanism to take apart, pairs it with a live observation surface, and keeps the
route into the next lesson visible. Below the hero:

- **Notebook pulse**: a bento grid of real signals — today's goal, minutes,
  streak, rank, and mastery. Empty values are written as zero, not decorated.
- **On the bench**: the recommended lesson with its real code window, level,
  sequence, completion state, and a single primary action.
- **The concept atlas**: an authored relationship map with level tabs, a concept
  index, hover/focus labels, a map legend, and a lesson link in the inspector.
  Edges are authored dependencies, never inferred.
- **The trail**: a horizontally scrollable stack of every level with real lesson
  counts and derived status.
- **Field kit**: five honest ways into the work — notes, map, search, review, and
  interview — plus earned evidence and notebook settings.
- **Field record**: a twelve-week activity heatmap and the local-first promise.

The station is allowed to be tall, but not to fake activity. A new notebook
shows zero minutes, an empty heatmap, and the first real lesson.

### Roadmap, Level, and Language

Roadmap levels are vertical specimen rows with a numbered stamp, a level tone, a
derived state, and real lesson links. Level pages carry the outcome, chapter
state, and adjacent levels. Language pages show the pack status, a colored level
strip, and honest coming-soon copy.

### Lesson journey

A lesson is a staged journey, not a long article. The route is:

```text
cover → Frame it → See it → Read it → Stress it → Say it → Build it → Prove it → finish
```

A typical lesson produces 15–16 stops. Each stop is one idea:

- **Frame it**: the problem, the analogy, and the mapping back to the machine.
- **See it**: the mental-model figure, then each under-the-hood step as its own
  stop. One code block and one explanation at a time.
- **Read it**: the annotated minimal and realistic code examples in a tab deck.
- **Stress it**: break-it-on-purpose, then the AI failure-mode deck.
- **Say it**: interview corner with folded answers.
- **Build it**: the exercise brief, starter, rubric, and verification.
- **Prove it**: recap, recall check, and finish.

The screen has three progress instruments: a left route rail with stop stamps, a
top segmented bar, and a circular percentage ring. Visited stops are checked;
the current stop is filled; future stops stay quiet. The primary control names
the next stop. Position and visited state persist per lesson in
`localStorage` under `foundation.journey.<lessonId>`.

The cover is a title card, not a table of contents. The finish panel is the
celebration and the handoff: mark done, see the level's next lesson, return to
the roadmap, or open the optional expedition game. Marking done is separate from
recall and exercise evidence.

### Knowledge map

A labeled specimen board, not a neon graph. Nodes are compact paper labels with
a concept tone and a one-line summary. Three layouts are genuinely different:

- **Rings** orbit concepts by level.
- **Flow** reads left to right along prerequisite depth.
- **Fields** group concepts into topic clusters with visible field boundaries.

Selecting a node opens a side sheet with the concept's summary, lesson link,
prerequisites, related concepts, and note action. Search dims non-matches. Trace
mode walks authored `depends-on` edges only and dims everything unrelated. Drag
positions persist per layout, and a reset restores that layout only. The list
view is a fully accessible alternative with the same state labels.

### Notes

A working notebook that happens to have a Markdown editor. Write and Read are
explicit modes; Read uses the serif reading style. Notes can link to a lesson and
inherit its concepts, carry freeform tags, and be filtered by text. The sidebar
is a real index, not a wall of cards. Export writes one Markdown file with every
note in newest-first order.

The floating **Hop on** action appears on every route. On a lesson it opens the
notes dock with that lesson's context and recent notes; on other routes it opens
the notebook. On mobile it is a compact icon-only circle with an accessible
label so it never covers the primary lesson action.

### Search

The command palette is a lab index: lessons, concepts, notes, and static pages in
one list, grouped by kind and searched with MiniSearch. Title matches rank above
body matches; prefix and fuzzy matching are enabled. Arrow keys move, Enter
opens, Escape closes, and the active row stays scrolled into view. Notes are
indexed live as they change.

### Review

Review is one appointment with what is fading: the real due count, one card at a
time, and four honest ratings. The rating panel appears only after the answer is
checked. The session summary names recalled and missed cards without inventing a
score or a streak. Milestone quizzes and interview practice reuse the same
one-question practice surface, so a question looks and behaves the same wherever
it appears.

### Play

The expedition game is a standalone, lazy `/play` route. It reads the real
notebook for its map state and never writes fake XP, completion, or grades. It is
an optional way to rehearse a mechanism, not a gate in front of lessons. The
entry point sits in the field kit and lesson finish, never in place of the next
lesson action.

### Settings and not-found

Settings keeps the same surface language: labeled control groups, a data panel
with storage/backend facts, an import preview panel, a confirmed reset, and an
about block with build and stage. The 404 page uses the shared animated
placeholder rather than a dead end.

### Coming-soon language slots

Python and JavaScript/TypeScript are declared but not written. Their pages name
what the pack will cover and say plainly that it is not available. No disabled
fake lessons, no progress rings, no “notify me” funnel.

## Copy voice

Write like a senior engineer who respects the reader's time. Name the thing, say
why it matters, give the consequence. Warm is fine. Cute is not.

Use:

- “The JVM does not run your source file. It runs class files.”
- “Marking a lesson done is not mastery. Recall and the exercise are separate.”
- “No cards are due. The next one is scheduled for tomorrow.”
- “This pack is not written yet.”

Avoid:

- “Unlock your potential”, “Supercharge”, “Master X in 30 days”;
- exclamation marks in system messages;
- fake urgency, streak shaming, or confetti that punishes a missed day;
- emoji as iconography;
- claims like “compiles in your browser” unless that execution path exists.

## Accessibility and performance

- Focus order follows reading order; skip links reach content and controls.
  Route changes move focus to the main region without scrolling it.
- Code blocks scroll horizontally and never wrap silently. Line numbers are
  decorative and hidden from screen readers.
- Every figure has a caption and alt text; the map has a list alternative.
- State is always written as well as colored: “correct”, “incorrect”, “needs
  review”, “mastered”, “fading”.
- Touch targets are at least 44×44 CSS pixels on mobile.
- At 390px there is no page-level horizontal overflow. Figures may scroll inside
  their own frame, and the caption says so.
- Reduced motion is a first-class mode, tested on the Today station, lesson
  journey, atlas, map, and notes dock.
- Route changes stay within a short entrance and must not produce a long task
  over 50ms. Scrolling should hold 60fps on the target phone size.

## Impeccable workflow

The interface is reviewed with the Impeccable detector before a release:

```text
.opencode\skills\impeccable\scripts\impeccable.cmd detect --json <ui paths>
```

- Run it on the files changed in the UI pass, not only on the entry page.
- Treat every finding as either fixed or intentionally documented. A release
  with an unexplained bounce-easing, contrast, or spacing finding is not done.
- Pair the detector with a visual pass at **1440px** and **390px**, in **light**
  and **dark**, with and without **reduced motion**. Check Today, a lesson
  cover, a lesson stop, the atlas, notes, and the game entry point.
- Performance checks belong in the same pass: route changes, first scroll,
  hover/tilt, the notes dock, and a full-page render on a throttled CPU.

## Things that would mean this direction failed

- A generic SaaS hero with a gradient and a “Start learning” button.
- Rounded cards repeated without hierarchy, or a dashboard of identical tiles.
- A lesson that dumps every section at once and calls the scroll bar progress.
- A mind map that looks like a node-library demo instead of a labeled drawing.
- Celebration that fires on page load, or progress that rewards merely opening a
  page.
- Motion that blocks the next action, hides content, or ignores reduced-motion.
- A stack of blurred panels that turns scrolling into a filter budget.
- A notebook that pretends to have wiki links, backlinks, or excerpts it does not
  ship.
