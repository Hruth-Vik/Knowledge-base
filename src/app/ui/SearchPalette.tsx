import { useEffect, useMemo, useRef, useState } from 'react';
import MiniSearch from 'minisearch';
import { useNavigate } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { Note } from '@/lib/state/schema.js';
import { useAppStore } from '../store.js';
import {
  BookOpenIcon,
  CompassIcon,
  MapIcon,
  NotesIcon,
  SearchIcon,
  SunIcon,
} from './icons.js';
import styles from './SearchPalette.module.css';

type SearchKind = 'page' | 'lesson' | 'concept' | 'note';

interface SearchDoc {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly tags: string;
  readonly kind: SearchKind;
  readonly route: string;
  readonly meta: string;
  readonly tone: string;
}

interface SearchPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const PAGES: readonly SearchDoc[] = [
  {
    id: 'page:today',
    title: 'Today',
    text: 'daily quest momentum streak activity field lab',
    tags: 'home dashboard',
    kind: 'page',
    route: '/',
    meta: 'Your desk',
    tone: 'rust',
  },
  {
    id: 'page:java',
    title: 'Java trail',
    text: 'curriculum levels lessons roadmap',
    tags: 'roadmap curriculum',
    kind: 'page',
    route: '/java',
    meta: 'Curriculum',
    tone: 'ochre',
  },
  {
    id: 'page:map',
    title: 'Concept map',
    text: 'constellation graph relations knowledge',
    tags: 'map concepts',
    kind: 'page',
    route: '/map',
    meta: 'Constellation',
    tone: 'indigo',
  },
  {
    id: 'page:notes',
    title: 'Notes',
    text: 'notebook writing markdown export',
    tags: 'notes writing',
    kind: 'page',
    route: '/notes',
    meta: 'Notebook',
    tone: 'rose',
  },
  {
    id: 'page:review',
    title: 'Review',
    text: 'spaced repetition recall queue',
    tags: 'review srs',
    kind: 'page',
    route: '/review',
    meta: 'Practice',
    tone: 'teal',
  },
  {
    id: 'page:settings',
    title: 'Settings',
    text: 'theme backup import export reset storage',
    tags: 'settings data',
    kind: 'page',
    route: '/settings',
    meta: 'Control room',
    tone: 'plum',
  },
];

function buildContentDocs(): SearchDoc[] {
  const levelTitles = new Map<string, string>();
  for (const language of catalog.languages) {
    for (const level of language.levels) {
      levelTitles.set(level.manifest.id, level.manifest.title);
    }
  }

  const lessonRouteById = new Map<string, string>();
  const lessonDocs: SearchDoc[] = catalog.lessons.map((record) => {
    const lesson = record.lesson;
    const route = `/java/${lesson.levelId}/${lesson.slug}`;
    lessonRouteById.set(lesson.id, route);
    return {
      id: `lesson:${lesson.id}`,
      title: lesson.title,
      text: `${lesson.deck} ${lesson.sections.problem} ${lesson.tags.join(' ')}`,
      tags: lesson.tags.join(' '),
      kind: 'lesson',
      route,
      meta: levelTitles.get(lesson.levelId) ?? 'Java',
      tone: 'rust',
    };
  });

  const conceptDocs: SearchDoc[] = catalog.concepts.all().map((concept) => ({
    id: `concept:${concept.id}`,
    title: concept.title,
    text: `${concept.summary.join(' ')} ${concept.aliases.join(' ')}`,
    tags: concept.tags.join(' '),
    kind: 'concept',
    route: lessonRouteById.get(concept.owner.lessonId) ?? '/map',
    meta: concept.kind.replaceAll('-', ' '),
    tone: 'indigo',
  }));

  return [...lessonDocs, ...conceptDocs];
}

function KindIcon({ kind }: { readonly kind: SearchKind }) {
  if (kind === 'lesson') {
    return <BookOpenIcon />;
  }
  if (kind === 'concept') {
    return <MapIcon />;
  }
  if (kind === 'note') {
    return <NotesIcon />;
  }
  if (kind === 'page') {
    return <CompassIcon />;
  }
  return <SunIcon />;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const navigate = useNavigate();
  const notes = useAppStore((state) => state.data.notes);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const contentDocs = useMemo(() => buildContentDocs(), []);

  const noteDocs = useMemo<SearchDoc[]>(
    () =>
      Object.values(notes).map((note: Note) => ({
        id: `note:${note.id}`,
        title: note.title || 'Untitled note',
        text: `${note.bodyMarkdown} ${note.tags.join(' ')}`,
        tags: note.tags.join(' '),
        kind: 'note',
        route: `/notes?note=${note.id}`,
        meta: 'Your note',
        tone: 'rose',
      })),
    [notes],
  );

  const search = useMemo(() => {
    const instance = new MiniSearch<SearchDoc>({
      fields: ['title', 'text', 'tags'],
      storeFields: ['title', 'kind', 'route', 'meta', 'tone'],
      searchOptions: {
        boost: { title: 3, tags: 1.6 },
        fuzzy: 0.22,
        prefix: true,
      },
    });
    instance.addAll([...PAGES, ...contentDocs, ...noteDocs]);
    return instance;
  }, [contentDocs, noteDocs]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [
        ...PAGES,
        ...contentDocs.filter((doc) => doc.kind === 'lesson').slice(0, 4),
        ...noteDocs.slice(0, 3),
      ].slice(0, 9);
    }
    return search
      .search(query.trim())
      .slice(0, 16)
      .map((result) => result as unknown as SearchDoc);
  }, [contentDocs, noteDocs, query, search]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, open]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) {
    return null;
  }

  const choose = (doc: SearchDoc) => {
    onClose();
    navigate(doc.route);
  };

  return (
    <div className={styles.layer} role="dialog" aria-modal="true" aria-label="Search FOUNDATION">
      <button
        className={styles.backdrop}
        type="button"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className={styles.palette}>
        <div className={styles.searchRow}>
          <SearchIcon className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            value={query}
            placeholder="Search lessons, concepts, notes…"
            aria-label="Search lessons, concepts, and notes"
            aria-controls="search-results"
            aria-activedescendant={
              results[activeIndex] ? `search-result-${results[activeIndex].id}` : undefined
            }
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((index) =>
                  results.length === 0 ? 0 : (index + 1) % results.length,
                );
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((index) =>
                  results.length === 0
                    ? 0
                    : (index - 1 + results.length) % results.length,
                );
              } else if (event.key === 'Enter') {
                event.preventDefault();
                const doc = results[activeIndex];
                if (doc) {
                  choose(doc);
                }
              }
            }}
          />
          <kbd className={styles.esc}>esc</kbd>
        </div>

        <div className={styles.results} id="search-results" ref={listRef}>
          {results.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptySpark} aria-hidden="true" />
              <p>No trail found for “{query}”.</p>
              <span>Try a concept, a class name, or a note title.</span>
            </div>
          ) : (
            <>
              <p className={styles.groupLabel}>
                {query.trim() ? 'Matches' : 'Jump back in'}
              </p>
              <ul className={styles.list} role="listbox">
                {results.map((doc, index) => (
                  <li key={doc.id}>
                    <button
                      className={styles.result}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      data-active={index === activeIndex}
                      data-tone={doc.tone}
                      id={`search-result-${doc.id}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(doc)}
                    >
                      <span className={styles.resultIcon} aria-hidden="true">
                        <KindIcon kind={doc.kind} />
                      </span>
                      <span className={styles.resultBody}>
                        <span className={styles.resultTitle}>{doc.title}</span>
                        <span className={styles.resultMeta}>
                          {doc.kind} · {doc.meta}
                        </span>
                      </span>
                      <span className={styles.kindChip}>{doc.kind}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span className={styles.footerBrand}>FOUNDATION field search</span>
        </div>
      </div>
    </div>
  );
}
