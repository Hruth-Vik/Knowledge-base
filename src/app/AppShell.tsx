import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import { createBackupFilename } from '@/lib/storage/backup.js';
import { APP_VERSION } from './about.js';
import { downloadTextFile } from './download.js';
import { pluralize } from './format.js';
import { preloadFromHref, preloadPrimaryRoutes } from './preload.js';
import { deriveMomentum } from './progress.js';
import { useAppStore } from './store.js';
import { useTheme } from './theme.js';
import { Button } from './ui/Button.js';
import { NotesDock } from './ui/NotesDock.js';
import { ProgressRing } from './ui/ProgressRing.js';
import { SearchPalette } from './ui/SearchPalette.js';
import {
  FoundationMark,
  MapIcon,
  MoonIcon,
  NotesIcon,
  ReviewIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  SystemIcon,
  LayersIcon,
} from './ui/icons.js';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Today', end: true, tone: 'rust', Icon: SunIcon },
  { to: '/java', label: 'Java', tone: 'ochre', Icon: LayersIcon },
  { to: '/map', label: 'Map', tone: 'indigo', Icon: MapIcon },
  { to: '/notes', label: 'Notes', tone: 'rose', Icon: NotesIcon },
  { to: '/review', label: 'Review', tone: 'teal', Icon: ReviewIcon },
] as const;

const THEME_LABEL = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
} as const;

export function AppShell() {
  useTheme();

  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const didMount = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const data = useAppStore((state) => state.data);
  const theme = useAppStore((state) => state.data.settings.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const storageBackend = useAppStore((state) => state.storageBackend);
  const recovery = useAppStore((state) => state.recovery);
  const resetData = useAppStore((state) => state.resetData);
  const maintainStreak = useAppStore((state) => state.maintainStreak);

  const momentum = deriveMomentum(data);
  const nextTheme =
    theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
  const ThemeIcon =
    theme === 'system' ? SystemIcon : theme === 'light' ? SunIcon : MoonIcon;

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
    setSearchOpen(false);
    setNotesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (hasHydrated && !recovery) {
      maintainStreak();
    }
  }, [hasHydrated, maintainStreak, recovery]);

  useEffect(() => {
    const openSearchEvent = () => {
      setSearchOpen(true);
      setNotesOpen(false);
    };
    const openNotesEvent = () => {
      setNotesOpen(true);
      setSearchOpen(false);
    };
    window.addEventListener('foundation:open-search', openSearchEvent);
    window.addEventListener('foundation:open-notes', openNotesEvent);
    return () => {
      window.removeEventListener('foundation:open-search', openSearchEvent);
      window.removeEventListener('foundation:open-notes', openNotesEvent);
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
        setNotesOpen(false);
      } else if (key === 'j') {
        event.preventDefault();
        setNotesOpen((open) => !open);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const syncTabVisibility = () => {
      if (document.hidden) {
        document.documentElement.dataset.tabHidden = 'true';
      } else {
        delete document.documentElement.dataset.tabHidden;
      }
    };
    syncTabVisibility();
    document.addEventListener('visibilitychange', syncTabVisibility);
    return () => {
      document.removeEventListener('visibilitychange', syncTabVisibility);
      delete document.documentElement.dataset.tabHidden;
    };
  }, []);

  useEffect(() => {
    const warmLink = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest('a[href]');
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        (anchor.target !== '' && anchor.target !== '_self')
      ) {
        return;
      }
      preloadFromHref(anchor.getAttribute('href') ?? '');
    };

    document.addEventListener('pointerover', warmLink, { passive: true });
    document.addEventListener('pointerdown', warmLink, { passive: true });
    document.addEventListener('focusin', warmLink);

    type IdleWindow = Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleWindow = window as IdleWindow;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleHandle = idleWindow.requestIdleCallback(preloadPrimaryRoutes, {
        timeout: 2500,
      });
    } else {
      timeoutHandle = window.setTimeout(preloadPrimaryRoutes, 1200);
    }

    return () => {
      document.removeEventListener('pointerover', warmLink);
      document.removeEventListener('pointerdown', warmLink);
      document.removeEventListener('focusin', warmLink);
      if (idleHandle !== undefined) {
        idleWindow.cancelIdleCallback?.(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, []);

  const levelCount = catalog.languages.reduce(
    (total, language) => total + language.levels.length,
    0,
  );
  const lessonCount = catalog.lessons.length;
  const conceptCount = catalog.concepts.all().length;

  const handleDownloadRecovery = () => {
    if (!recovery?.raw) {
      return;
    }
    downloadTextFile(
      createBackupFilename().replace('.json', '-unreadable.json'),
      recovery.raw,
    );
  };

  const handleStartFresh = () => {
    const confirmed = window.confirm(
      'Start a new notebook? The unreadable record will be discarded. Download it first if you may need it.',
    );
    if (confirmed) {
      resetData();
    }
  };

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink className={styles.brand} to="/" aria-label="FOUNDATION — Today">
            <span className={styles.brandTile}>
              <FoundationMark className={styles.brandMark} />
            </span>
            <span className={styles.brandWords}>
              <span className={styles.brandName}>FOUNDATION</span>
              <span className={styles.brandVersion}>field lab · v{APP_VERSION}</span>
            </span>
          </NavLink>

          <nav className={styles.nav} aria-label="Primary">
            {NAV_ITEMS.map((item, index) => (
              <NavLink
                className={styles.navLink}
                data-tone={item.tone}
                end={'end' in item ? item.end : undefined}
                key={item.to}
                to={item.to}
              >
                <span className={styles.navIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.controls}>
            <Link
              className={styles.momentum}
              to="/"
              aria-label={`Rank ${momentum.rank.name}, ${momentum.xp} XP. ${momentum.rank.blurb}`}
              title={`${momentum.rank.name} · ${momentum.xp} XP`}
            >
              <ProgressRing
                className={styles.momentumRing}
                progress={momentum.ringProgress}
                size={40}
                stroke={5}
                tone={momentum.rank.tone}
                label={`Rank ${momentum.rank.name}`}
              >
                {momentum.rankIndex + 1}
              </ProgressRing>
              <span className={styles.momentumText}>
                <strong>{momentum.rank.name}</strong>
                <span>{momentum.xp} XP</span>
              </span>
            </Link>

            <button
              className={styles.searchButton}
              type="button"
              onClick={() => {
                setSearchOpen(true);
                setNotesOpen(false);
              }}
              aria-label="Search lessons, concepts, and notes"
            >
              <SearchIcon className={styles.controlIcon} />
              <span className={styles.searchLabel}>Search</span>
              <kbd className={styles.searchKey}>⌘K</kbd>
            </button>

            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setTheme(nextTheme)}
              aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[nextTheme]}.`}
              title={`Theme: ${THEME_LABEL[theme]}`}
            >
              <ThemeIcon className={styles.controlIcon} />
            </button>

            <NavLink
              className={styles.iconButton}
              to="/settings"
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className={styles.controlIcon} />
            </NavLink>
          </div>
        </div>
      </header>

      {recovery ? (
        <div className={styles.recovery} role="alert">
          <div className={styles.recoveryInner}>
            <div>
              <p className={styles.recoveryTitle}>Saved record unreadable</p>
              <p className={styles.recoveryText}>
                {recovery.message} Download the raw record before starting
                again. Nothing already stored has been changed.
              </p>
            </div>
            <div className={styles.recoveryActions}>
              <Button
                onClick={handleDownloadRecovery}
                disabled={!recovery.raw}
              >
                Download raw record
              </Button>
              <Button variant="danger" onClick={handleStartFresh}>
                Start fresh
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <main className={styles.main} id="main" ref={mainRef} tabIndex={-1}>
        {hasHydrated ? (
          <Suspense
            fallback={
              <div className={styles.routeLoading} role="status">
                <span className={styles.loadingSpark} aria-hidden="true" />
                Warming up the lab…
              </div>
            }
          >
            <div className={styles.routeStage} key={location.pathname}>
              <Outlet />
            </div>
          </Suspense>
        ) : (
          <div className={styles.routeLoading} role="status">
            <span className={styles.loadingSpark} aria-hidden="true" />
            Opening the notebook…
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>
            <FoundationMark className={styles.footerMark} aria-hidden="true" />
            <span>FOUNDATION</span>
            <span className={styles.footerVersion}>v{APP_VERSION}</span>
          </p>
          <p>
            {pluralize(levelCount, 'level')} ·{' '}
            {pluralize(lessonCount, 'lesson')} ·{' '}
            {pluralize(conceptCount, 'concept')}
          </p>
          <p>Local-first. No accounts. No telemetry. Your notebook stays here.</p>
          {storageBackend === 'memory' ? (
            <p className={styles.storageWarning}>
              Browser storage is unavailable. This session will not persist.
            </p>
          ) : null}
        </div>
      </footer>

      <nav className={styles.bottomNav} aria-label="Primary mobile">
        {NAV_ITEMS.map((item) => (
          <NavLink
            className={styles.bottomLink}
            data-tone={item.tone}
            end={'end' in item ? item.end : undefined}
            key={item.to}
            to={item.to}
          >
            <span className={styles.bottomIcon} aria-hidden="true">
              <item.Icon />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {hasHydrated ? (
        <>
          <SearchPalette open={searchOpen} onClose={closeSearch} />
          <NotesDock open={notesOpen} onOpenChange={setNotesOpen} />
        </>
      ) : null}
    </div>
  );
}
