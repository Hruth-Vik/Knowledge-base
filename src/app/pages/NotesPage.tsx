import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { Note } from '@/lib/state/schema.js';
import { downloadTextFile } from '../download.js';
import { formatShortDate, pluralize } from '../format.js';
import { useAppStore } from '../store.js';
import { Markdown } from '../lesson/Markdown.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import {
  BookOpenIcon,
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  NotesIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
  TrashIcon,
} from '../ui/icons.js';
import styles from './NotesPage.module.css';

interface EditorState {
  readonly id: string | null;
  readonly title: string;
  readonly body: string;
  readonly tags: string;
  readonly lessonId: string;
}

const EMPTY_EDITOR: EditorState = {
  id: null,
  title: '',
  body: '',
  tags: '',
  lessonId: '',
};

function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function noteWordCount(body: string): number {
  return body.trim() ? body.trim().split(/\s+/).length : 0;
}

export function NotesPage() {
  const notes = useAppStore((state) => state.data.notes);
  const createNote = useAppStore((state) => state.createNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('');
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [preview, setPreview] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const initialized = useRef(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const allNotes = useMemo(() => sortNotes(Object.values(notes)), [notes]);
  const noteParam = searchParams.get('note');
  const selectedNote = editor.id ? notes[editor.id] : undefined;

  const lessonById = useMemo(() => {
    const map = new Map<
      string,
      { title: string; route: string; levelNumber: string }
    >();
    for (const record of catalog.lessons) {
      map.set(record.lesson.id, {
        title: record.lesson.title,
        route: `/java/${record.lesson.levelId}/${record.lesson.slug}`,
        levelNumber: record.lesson.levelId.replace('java.l', ''),
      });
    }
    return map;
  }, []);

  const linkedCount = allNotes.filter((note) => note.lessonId).length;
  const words = allNotes.reduce(
    (total, note) => total + noteWordCount(note.bodyMarkdown),
    0,
  );

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    const fromQuery = noteParam ? notes[noteParam] : undefined;
    const target = fromQuery ?? allNotes[0];
    if (target) {
      setEditor({
        id: target.id,
        title: target.title,
        body: target.bodyMarkdown,
        tags: target.tags.join(', '),
        lessonId: target.lessonId ?? '',
      });
    }
  }, [allNotes, noteParam, notes]);

  useEffect(() => {
    if (!noteParam) {
      return;
    }
    const note = notes[noteParam];
    if (note && note.id !== editor.id) {
      setEditor({
        id: note.id,
        title: note.title,
        body: note.bodyMarkdown,
        tags: note.tags.join(', '),
        lessonId: note.lessonId ?? '',
      });
    }
  }, [editor.id, noteParam, notes]);

  useEffect(() => {
    if (!editor.id || notes[editor.id]) {
      return;
    }
    setEditor(EMPTY_EDITOR);
    setSearchParams({}, { replace: true });
  }, [editor.id, notes, setSearchParams]);

  useEffect(() => {
    if (!flash) {
      return;
    }
    const timer = window.setTimeout(() => setFlash(null), 3200);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return allNotes;
    }
    return allNotes.filter((note) => {
      const lesson = note.lessonId ? lessonById.get(note.lessonId) : undefined;
      return `${note.title} ${note.bodyMarkdown} ${note.tags.join(' ')} ${lesson?.title ?? ''}`
        .toLowerCase()
        .includes(query);
    });
  }, [allNotes, filter, lessonById]);

  const choose = (note: Note) => {
    setEditor({
      id: note.id,
      title: note.title,
      body: note.bodyMarkdown,
      tags: note.tags.join(', '),
      lessonId: note.lessonId ?? '',
    });
    setSearchParams({ note: note.id }, { replace: true });
    setPreview(false);
    setConfirmingDelete(null);
    setFlash(null);
  };

  const startNew = () => {
    setEditor(EMPTY_EDITOR);
    setSearchParams({}, { replace: true });
    setPreview(false);
    setConfirmingDelete(null);
    setFlash(null);
    window.setTimeout(() => bodyRef.current?.focus(), 30);
  };

  const dirty =
    editor.id === null
      ? Boolean(editor.title.trim() || editor.body.trim() || editor.tags.trim())
      : Boolean(
          selectedNote &&
            (selectedNote.title !== editor.title ||
              selectedNote.bodyMarkdown !== editor.body ||
              selectedNote.tags.join(', ') !== editor.tags ||
              (selectedNote.lessonId ?? '') !== editor.lessonId),
        );

  const handleSave = () => {
    if (!editor.body.trim() && !editor.title.trim()) {
      setFlash('Write a line first — a question is enough.');
      return;
    }
    const linkedLesson = editor.lessonId
      ? catalog.lessons.find(
          (record) => record.lesson.id === editor.lessonId,
        )
      : undefined;
    const input = {
      title: editor.title,
      bodyMarkdown: editor.body,
      tags: editor.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      lessonId: editor.lessonId || null,
      conceptIds:
        linkedLesson?.lesson.concepts.map((concept) => concept.id) ?? [],
    };

    if (editor.id) {
      updateNote(editor.id, input);
      setFlash('Saved. The notebook is up to date.');
    } else {
      const id = createNote(input);
      setEditor((current) => ({ ...current, id }));
      setSearchParams({ note: id }, { replace: true });
      setFlash('New note saved to this browser.');
    }
  };

  const handleDelete = () => {
    if (!editor.id) {
      return;
    }
    if (confirmingDelete !== editor.id) {
      setConfirmingDelete(editor.id);
      return;
    }
    deleteNote(editor.id);
    setEditor(EMPTY_EDITOR);
    setConfirmingDelete(null);
    setSearchParams({}, { replace: true });
    setFlash('Note removed.');
  };

  const handleExport = () => {
    if (allNotes.length === 0) {
      return;
    }
    const lines: string[] = [
      '# FOUNDATION field notes',
      '',
      `Exported ${new Date().toISOString()}`,
      `${pluralize(allNotes.length, 'note')} · ${pluralize(words, 'word')}`,
      '',
    ];
    for (const note of allNotes) {
      const lesson = note.lessonId ? lessonById.get(note.lessonId) : undefined;
      lines.push('---', '', `## ${note.title || 'Untitled note'}`, '');
      const meta = [
        `Updated ${formatShortDate(new Date(note.updatedAt))}`,
        lesson ? `Lesson: ${lesson.title}` : null,
        note.tags.length > 0 ? `Tags: ${note.tags.join(', ')}` : null,
      ].filter(Boolean);
      lines.push(`*${meta.join(' · ')}*`, '', note.bodyMarkdown, '');
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`foundation-notes-${date}.md`, lines.join('\n'));
    setFlash('Markdown export downloaded.');
  };

  const linkedLesson = editor.lessonId
    ? lessonById.get(editor.lessonId)
    : undefined;

  return (
    <Page>
      <PageHeader
        kicker="Notebook / Notes"
        title="Your field notebook"
        deck="Half-formed thoughts, exact questions, tiny wins. Notes are the trail you leave for your future self — and they never leave this browser."
        aside={
          <>
            <span className={styles.asideLabel}>In the notebook</span>
            <span className={styles.asideBig}>{allNotes.length}</span>
            <span>{pluralize(words, 'word')}</span>
            <br />
            <span>{linkedCount} linked to lessons</span>
          </>
        }
      />

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Note list">
          <div className={styles.sidebarTop}>
            <button className={styles.newButton} type="button" onClick={startNew}>
              <PlusIcon /> New note
            </button>
            <button
              className={styles.exportButton}
              type="button"
              onClick={handleExport}
              disabled={allNotes.length === 0}
              title="Export all notes as Markdown"
            >
              <DownloadIcon /> Export
            </button>
          </div>

          <label className={styles.searchBox}>
            <SearchIcon />
            <input
              type="search"
              placeholder="Filter notes…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter notes"
            />
          </label>

          {allNotes.length === 0 ? (
            <div className={styles.sidebarEmpty}>
              <SparkIcon />
              <p>No notes yet.</p>
              <span>Start anywhere, or hop on from a lesson.</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.noMatches}>No notes match “{filter}”.</p>
          ) : (
            <ul className={styles.noteList}>
              {filtered.map((note) => {
                const lesson = note.lessonId
                  ? lessonById.get(note.lessonId)
                  : undefined;
                return (
                  <li key={note.id}>
                    <button
                      className={[
                        styles.noteItem,
                        note.id === editor.id ? styles.noteItemActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      onClick={() => choose(note)}
                      aria-current={note.id === editor.id ? 'true' : undefined}
                    >
                      <span className={styles.noteItemTop}>
                        <span className={styles.noteItemTitle}>
                          {note.title || 'Untitled note'}
                        </span>
                        <time dateTime={note.updatedAt}>
                          {formatShortDate(new Date(note.updatedAt))}
                        </time>
                      </span>
                      <span className={styles.noteItemPreview}>
                        {note.bodyMarkdown.slice(0, 120).replaceAll('\n', ' ') ||
                          'Empty note'}
                      </span>
                      <span className={styles.noteItemMeta}>
                        {lesson ? (
                          <span className={styles.noteLesson}>
                            L{lesson.levelNumber} · {lesson.title}
                          </span>
                        ) : note.lessonId ? (
                          <span className={styles.noteLoose}>Missing lesson</span>
                        ) : (
                          <span className={styles.noteLoose}>Loose page</span>
                        )}
                        {note.tags.slice(0, 2).map((tag) => (
                          <span className={styles.noteTag} key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className={styles.editorPanel} aria-label="Note editor">
          {allNotes.length === 0 && !editor.body && !editor.title ? (
            <div className={styles.welcome}>
              <span className={styles.welcomeArt} aria-hidden="true">
                <NotesIcon />
                <span className={styles.welcomeSpark}>
                  <SparkIcon />
                </span>
              </span>
              <p className={styles.welcomeKicker}>Fresh pages</p>
              <h2 className={styles.welcomeTitle}>
                The notebook starts with one honest line.
              </h2>
              <p className={styles.welcomeText}>
                It does not have to be neat. “I still don’t get why hashCode
                matters” is a perfectly good first note.
              </p>
              <div className={styles.welcomeActions}>
                <button className={styles.primaryButton} type="button" onClick={startNew}>
                  <PencilIcon /> Write the first note
                </button>
                <Link className={styles.secondaryLink} to="/java">
                  Or walk the Java trail
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.editor}>
              <div className={styles.editorHead}>
                <div className={styles.editorHeadCopy}>
                  <p className={styles.editorKicker}>
                    <NotesIcon /> {editor.id ? 'Editing note' : 'New note'}
                    {dirty ? <span className={styles.dirty}>unsaved</span> : null}
                  </p>
                  <input
                    className={styles.titleInput}
                    maxLength={160}
                    placeholder="A title for this thought"
                    value={editor.title}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    aria-label="Note title"
                  />
                  <p className={styles.editorMeta}>
                    {selectedNote ? (
                      <>
                        Updated{' '}
                        {formatShortDate(new Date(selectedNote.updatedAt))}
                      </>
                    ) : (
                      'Not saved yet'
                    )}
                    {linkedLesson ? (
                      <>
                        {' · '}
                        <Link to={linkedLesson.route}>
                          L{linkedLesson.levelNumber} {linkedLesson.title}
                        </Link>
                      </>
                    ) : editor.lessonId ? (
                      <>
                        {' · '}
                        <span className={styles.noteLoose}>
                          Linked lesson is no longer in the catalog
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className={styles.viewToggle} role="group" aria-label="Editor view">
                  <button
                    type="button"
                    data-active={!preview}
                    onClick={() => setPreview(false)}
                  >
                    <PencilIcon /> Write
                  </button>
                  <button
                    type="button"
                    data-active={preview}
                    onClick={() => setPreview(true)}
                  >
                    <EyeIcon /> Read
                  </button>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel} htmlFor="note-lesson">
                  Linked lesson
                </label>
                <select
                  className={styles.select}
                  id="note-lesson"
                  value={editor.lessonId}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      lessonId: event.target.value,
                    }))
                  }
                >
                  <option value="">Loose page — no lesson</option>
                  {catalog.lessons.map((record) => (
                    <option value={record.lesson.id} key={record.lesson.id}>
                      {record.lesson.levelId.replace('java.l', 'L')} ·{' '}
                      {record.lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              {preview ? (
                <div className={styles.preview}>
                  {editor.body.trim() ? (
                    <Markdown>{editor.body}</Markdown>
                  ) : (
                    <p className={styles.previewEmpty}>
                      Nothing to read yet. Switch to Write and start with one
                      sentence.
                    </p>
                  )}
                </div>
              ) : (
                <textarea
                  className={styles.textarea}
                  ref={bodyRef}
                  rows={16}
                  placeholder="What did you understand? What is still foggy? What would you tell a teammate?"
                  value={editor.body}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                      event.preventDefault();
                      handleSave();
                    }
                  }}
                  aria-label="Note body"
                />
              )}

              <div className={styles.tagsRow}>
                <label className={styles.fieldLabel} htmlFor="note-tags">
                  Tags
                </label>
                <input
                  className={styles.tagsInput}
                  id="note-tags"
                  placeholder="jvm, equality, still-fuzzy"
                  value={editor.tags}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.editorFooter}>
                <div className={styles.editorActions}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={handleSave}
                  >
                    <CheckIcon />
                    {editor.id ? 'Save changes' : 'Save note'}
                  </button>
                  {editor.id ? (
                    <button
                      className={styles.deleteButton}
                      type="button"
                      onClick={handleDelete}
                      onBlur={() => setConfirmingDelete(null)}
                    >
                      <TrashIcon />
                      {confirmingDelete === editor.id
                        ? 'Click again to delete'
                        : 'Delete'}
                    </button>
                  ) : null}
                </div>
                <p className={styles.footerHint} role="status">
                  {flash ?? '⌘/Ctrl + S saves. Everything stays in this browser.'}
                </p>
              </div>

              {editor.id && selectedNote ? (
                <div className={styles.editorStats}>
                  <span>{pluralize(noteWordCount(selectedNote.bodyMarkdown), 'word')}</span>
                  <span>{pluralize(selectedNote.tags.length, 'tag')}</span>
                  <span>
                    {selectedNote.conceptIds.length > 0
                      ? pluralize(selectedNote.conceptIds.length, 'concept link')
                      : 'No concept links'}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {allNotes.length > 0 ? (
        <p className={styles.pageNote}>
          <BookOpenIcon /> Notes are local Markdown. Export writes a single
          `.md` file with every page, in newest-first order.
        </p>
      ) : null}
    </Page>
  );
}
