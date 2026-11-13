# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary readers are working developers who already ship software with AI assistance. They open FOUNDATION after work or between tasks because they can get code running without fully understanding the machine underneath, and they want to close that gap without enrolling in a course.

Secondary readers are computer-science students, bootcamp graduates, and career switchers preparing for Java interviews. They need the same explanations, plus recall practice and evidence they can defend in a technical conversation.

## Product Purpose

FOUNDATION is a free, local-first learning platform for rebuilding the fundamentals beneath modern software. The Java pack starts at how source becomes a running process and continues through the language core, objects, collections, concurrency, the JVM, Spring, persistence, production engineering, and architecture.

Success means the reader can explain a mechanism, predict what code will do, diagnose a failure, and prove understanding through recall and a hand-written exercise. Reading a lesson is not completion, and no progress is fabricated to make the product feel busier.

## Positioning

Most developer education either explains concepts in isolation or trains interview trivia. FOUNDATION connects a mechanism to a realistic failure, a runnable example, a repair, and a recall check that persists. It is a field lab, not a course catalog: every lesson is built around taking one piece of the machine apart and leaving evidence that the reader can use.

The product is local-first by design. There is no account, backend, telemetry, or fake execution. The notebook, review schedule, notes, and progress live in the browser, and the interface says so plainly.

## Operating Context

- The reader studies in short sessions on a laptop or phone, often after a workday.
- Java is the only published content pack; Python and JavaScript/TypeScript are declared coming-soon slots.
- Lessons are long-form staged journeys with diagrams, code, failure scenarios, interview prompts, and a written exercise.
- Review is spaced repetition over real recall attempts. Milestones and quizzes are created only from completed lessons.
- The app runs from `npm run dev` and builds with `npm run build`; content is authored as typed lesson modules and validated at build time.
- The notebook is stored in IndexedDB with a localStorage fallback. Backups are explicit JSON exports.

## Capabilities and Constraints

- 14 published lessons across Java Levels 00, 01, and 05; 46 concepts; 84 recall questions at the time of this record.
- Every Java level must eventually contain at least two incident-story lessons. L0 and L1 now meet that rule.
- Light, dark, and system themes; keyboard navigation; reduced-motion support; mobile layouts from 390px.
- No backend, accounts, telemetry, or claims of in-browser Java execution.
- All figures are authored diagrams, not generated imagery. Every figure has alt text and a caption.
- Progress, counts, cards, milestones, and results must come from persisted state, never placeholder data.
- The warm field-lab identity is a product commitment: cream paper, deep ink, saturated specimen tones, physical surfaces, and motion that explains a change.
- The rewrite may change layout, typography, components, and interaction, but it must preserve content, behavior, accessibility, and the truthful empty states.

## Brand Commitments

- Name: FOUNDATION. Descriptor: field lab.
- Voice: a senior engineer who respects the reader's time. Name the thing, say why it matters, give the consequence. Warm is fine; cute is not.
- No hype language, fake urgency, streak shaming, emoji iconography, or claims the product cannot support.
- The visual world borrows from field guides, repair manuals, lab notebooks, and physical workbenches. It does not borrow from SaaS landing pages, generic documentation themes, or terminal cosplay.

## Evidence on Hand

- A complete, validated Java curriculum through Level 01 plus three Level 05 reference lessons.
- Real authored code examples with verified outputs, incident stories, interview prompts, and exercises.
- A working local-first application with persisted lesson progress, review scheduling, quizzes, notes, search, and a concept map.
- `README.md` and `docs/` contain the build record, content contract, state model, architecture, and design direction.
- No customer logos, testimonials, benchmarks, pricing, or usage claims exist. Future work must not invent them.

## Product Principles

1. **Evidence over theater.** A done mark, a card, or a milestone must correspond to something the reader actually did.
2. **Mechanism before vocabulary.** Every term earns its definition through a concrete failure or a runnable example.
3. **One idea at a time.** The lesson journey stages content so the reader is never asked to parse a wall of text.
4. **The interface is a lab, not a feed.** Navigation, diagrams, and metadata should feel like labeled equipment, not engagement machinery.
5. **Local-first honesty.** The product should be explicit about where data lives and what it cannot do.

## Accessibility & Inclusion

- WCAG AA contrast for body text, metadata, and controls in both themes.
- Visible focus, keyboard-operable dialogs and navigation, and a skip link.
- State is always written as well as colored: correct, incorrect, mastered, fading, needs review.
- Touch targets at least 44×44 CSS pixels; no page-level horizontal overflow at 390px.
- `prefers-reduced-motion: reduce` disables ambient loops, confetti, reveals, and layout transitions without hiding content.
- Figures carry meaningful alt text; the concept map has a list alternative.
