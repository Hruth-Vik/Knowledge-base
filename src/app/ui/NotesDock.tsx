import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { Note } from '@/lib/state/schema.js';
import { useAppStore } from '../store.js';
import {
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  NotesIcon,
  PencilIcon,
  SparkIcon,
  TrashIcon,
} from './icons.js';
import styles from './NotesDock.module.css';

interface NotesDockProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface LessonContext {
  readonly lessonId: string;
  readonly title: string;
  readonly route: string;
  readonly levelNumber: string;
  readonly conceptIds: readonly string[];
}

const PROMPTS = [
  {
    label: 'In my own words',
    text: 'In my own words:\n\n',
  },
  {
    label: 'Still fuzzy',
    text: 'What still feels fuzzy:\n\n',
  },
  {
    label: 'Use it when',
    text: 'I would reach for this when:\n\n',
  },
];

function useLessonContext(): LessonContext | null {
  const location = useLocation();

  return useMemo(() => {
    const match = /^\/java\/([^/]+)\/([^/]+)\/?$/.exec(location.pathname);
    if (!match) {
      return null;
    }
    const [, levelId, slug] = match;
    const level = catalog.languages
      .flatMap((language) => language.levels)
      .find((candidate) => candidate.manifest.id === levelId);
    const record = level?.chapters
      .flatMap((chapter) => chapter.lessons)
      .find((candidate) => candidate.lesson.slug === slug);
    if (!level || !record) {
      return null;
    }
    return {
      lessonId: record.lesson.id,
      title: record.lesson.title,
      route: `/java/${levelId}/${slug}`,
      levelNumber: String(level.manifest.index).padStart(2, '0'),
      conceptIds: record.lesson.concepts.map((concept) => concept.id),
    };
  }, [location.pathname]);
}

function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function NotesDock({ open, onOpenChange }: NotesDockProps) {
  const notes = useAppStore((state) => state.data.notes);
  const createNote = useAppStore((state) => state.createNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const context = useLessonContext();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const allNotes = useMemo(() => sortNotes(Object.values(notes)), [notes]);
  const contextNotes = useMemo(
    () =>
      context
        ? allNotes.filter((note) => note.lessonId === context.lessonId)
        : allNotes,
    [allNotes, context],
  );

  const resetDraft = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setTags('');
    setFlash(null);
    setConfirmingDelete(null);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    resetDraft();
    const timer = window.setTimeout(() => bodyRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
    // Opening the dock starts a fresh note; editing is an explicit action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context?.lessonId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!flash) {
      return;
    }
    const timer = window.setTimeout(() => setFlash(null), 2800);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const beginEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setBody(note.bodyMarkdown);
    setTags(note.tags.join(', '));
    setFlash(null);
    setConfirmingDelete(null);
    bodyRef.current?.focus();
  };

  const handleSave = () => {
    const trimmedBody = body.trim();
    if (!trimmedBody && !title.trim()) {
      setFlash('Write a line first — even a question counts.');
      return;
    }
    const input = {
      title,
      bodyMarkdown: body,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      lessonId: context?.lessonId ?? null,
      conceptIds: context?.conceptIds ?? [],
    };

    if (editingId) {
      updateNote(editingId, input);
      setFlash('Note updated. It stays on this device.');
    } else {
      const id = createNote(input);
      setEditingId(id);
      setFlash('Hop on! Note saved to your notebook.');
    }
  };

  const handleDelete = (noteId: string) => {
    if (confirmingDelete !== noteId) {
      setConfirmingDelete(noteId);
      return;
    }
    deleteNote(noteId);
    if (editingId === noteId) {
      resetDraft();
    }
    setConfirmingDelete(null);
    setFlash('Note removed.');
  };

  const appendPrompt = (text: string) => {
    setBody((current) => (current ? `${current}\n\n${text}` : text));
    bodyRef.current?.focus();
  };

  return (
    <>
      <button
        aria-controls="notes-dock"
        aria-expanded={open}
        aria-label="Hop on: open the notes panel"
        className={[styles.fab, open ? styles.fabHidden : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <span className={styles.fabIcon} aria-hidden="true">
          <PencilIcon />
        </span>
        <span className={styles.fabText}>Hop on</span>
        <span className={styles.fabSpark} aria-hidden="true">
          <SparkIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.layer}>
          <button
            className={styles.scrim}
            type="button"
            aria-label="Close notes"
            onClick={() => onOpenChange(false)}
          />
          <aside
            className={styles.panel}
            id="notes-dock"
            role="dialog"
            aria-modal="true"
            aria-label="Your notes"
          >
            <header className={styles.head}>
              <div className={styles.headCopy}>
                <p className={styles.kicker}>
                  <NotesIcon /> Field notes
                </p>
                <h2 className={styles.title}>Hop on a thought.</h2>
                <p className={styles.context}>
                  {context ? (
                    <>
                      <span className={styles.contextChip}>
                        L{context.levelNumber}
                      </span>
                      {context.title}
                    </>
                  ) : (
                    'A loose page in your notebook. It links to this trail.'
                  )}
                </p>
              </div>
              <button
                className={styles.close}
                type="button"
                aria-label="Close notes"
                onClick={() => onOpenChange(false)}
              >
                <CloseIcon />
              </button>
            </header>

            <div className={styles.body}>
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSave();
                }}
              >
                <label className={styles.label} htmlFor="dock-title">
                  Title <span>optional</span>
                </label>
                <input
                  className={styles.input}
                  id="dock-title"
                  maxLength={160}
                  placeholder={context ? 'A handle for this idea' : 'What is this about?'}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />

                <label className={styles.label} htmlFor="dock-body">
                  The note
                </label>
                <textarea
                  className={styles.textarea}
                  id="dock-body"
                  ref={bodyRef}
                  rows={7}
                  placeholder="Short, messy, honest. Write what you actually understood."
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      event.preventDefault();
                      handleSave();
                    }
                  }}
                />

                <div className={styles.prompts} aria-label="Note starters">
                  {PROMPTS.map((prompt) => (
                    <button
                      className={styles.prompt}
                      key={prompt.label}
                      type="button"
                      onClick={() => appendPrompt(prompt.text)}
                    >
                      + {prompt.label}
                    </button>
                  ))}
                </div>

                <label className={styles.label} htmlFor="dock-tags">
                  Tags <span>comma separated</span>
                </label>
                <input
                  className={styles.input}
                  id="dock-tags"
                  placeholder="jvm, equality, confusing"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />

                <div className={styles.actions}>
                  <button className={styles.save} type="submit">
                    <CheckIcon />
                    {editingId ? 'Update note' : 'Save note'}
                  </button>
                  {editingId ? (
                    <button
                      className={styles.quiet}
                      type="button"
                      onClick={resetDraft}
                    >
                      New instead
                    </button>
                  ) : null}
                </div>
                <p className={styles.hint}>
                  {flash ?? '⌘/Ctrl + Enter saves. Notes never leave this browser.'}
                </p>
              </form>

              <section className={styles.recent} aria-label="Notes in this context">
                <div className={styles.recentHead}>
                  <h3>
                    {context ? 'Notes on this lesson' : 'Recent notes'}
                    <span className={styles.count}>{contextNotes.length}</span>
                  </h3>
                  <Link className={styles.openAll} to="/notes" onClick={() => onOpenChange(false)}>
                    Open notebook <ArrowRightIcon />
                  </Link>
                </div>

                {contextNotes.length === 0 ? (
                  <p className={styles.empty}>
                    No notes here yet. The first line is the hardest; make it a
                    question.
                  </p>
                ) : (
                  <ul className={styles.noteList}>
                    {contextNotes.slice(0, 6).map((note) => (
                      <li className={styles.noteItem} key={note.id}>
                        <button
                          className={styles.noteButton}
                          type="button"
                          onClick={() => beginEdit(note)}
                        >
                          <span className={styles.noteTitle}>
                            {note.title || 'Untitled note'}
                          </span>
                          <span className={styles.notePreview}>
                            {note.bodyMarkdown.slice(0, 110).replaceAll('\n', ' ')}
                          </span>
                        </button>
                        <button
                          className={styles.deleteNote}
                          type="button"
                          aria-label={
                            confirmingDelete === note.id
                              ? `Confirm deleting ${note.title || 'note'}`
                              : `Delete ${note.title || 'note'}`
                          }
                          title={
                            confirmingDelete === note.id
                              ? 'Click again to delete'
                              : 'Delete note'
                          }
                          onClick={() => handleDelete(note.id)}
                          onBlur={() => setConfirmingDelete(null)}
                        >
                          {confirmingDelete === note.id ? (
                            <span>Sure?</span>
                          ) : (
                            <TrashIcon />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
