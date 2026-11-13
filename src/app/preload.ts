/**
 * Route chunk warm-up.
 *
 * The router already loads each page lazily. This module lets the shell start
 * the same dynamic import a little earlier: when a link is hovered, focused,
 * or pressed, and once during idle time for the primary routes. It never
 * renders anything and it never changes navigation; it only lets the network
 * and the module graph catch up with the pointer.
 */

interface NetworkInformationLike {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
}

interface RouteChunk {
  readonly id: string;
  readonly matches: (pathname: string) => boolean;
  readonly load: () => Promise<unknown>;
}

const LESSON_PATH = /^\/java\/[^/]+\/[^/]+$/;
const LEVEL_PATH = /^\/java\/[^/]+$/;
const LANGUAGE_PATH = /^\/languages\/[^/]+$/;
const QUIZ_PATH = /^\/quiz\/[^/]+$/;

const ROUTES: readonly RouteChunk[] = [
  {
    id: 'today',
    matches: (pathname) => pathname === '/',
    load: () => import('./pages/TodayPage.js'),
  },
  {
    id: 'roadmap',
    matches: (pathname) => pathname === '/java',
    load: () => import('./pages/RoadmapPage.js'),
  },
  {
    id: 'lesson',
    matches: (pathname) => LESSON_PATH.test(pathname),
    load: () => import('./pages/LessonPage.js'),
  },
  {
    id: 'level',
    matches: (pathname) => LEVEL_PATH.test(pathname),
    load: () => import('./pages/LevelPage.js'),
  },
  {
    id: 'language',
    matches: (pathname) => LANGUAGE_PATH.test(pathname),
    load: () => import('./pages/LanguagePage.js'),
  },
  {
    id: 'map',
    matches: (pathname) => pathname === '/map',
    load: () => import('./pages/MapPage.js'),
  },
  {
    id: 'notes',
    matches: (pathname) => pathname === '/notes',
    load: () => import('./pages/NotesPage.js'),
  },
  {
    id: 'review',
    matches: (pathname) => pathname === '/review',
    load: () => import('./pages/ReviewPage.js'),
  },
  {
    id: 'quiz',
    matches: (pathname) => QUIZ_PATH.test(pathname),
    load: () => import('./pages/QuizPage.js'),
  },
  {
    id: 'interview',
    matches: (pathname) => pathname === '/interview',
    load: () => import('./pages/InterviewPage.js'),
  },
  {
    id: 'play',
    matches: (pathname) => pathname === '/play',
    load: () => import('./pages/PlayPage.js'),
  },
  {
    id: 'settings',
    matches: (pathname) => pathname === '/settings',
    load: () => import('./pages/SettingsPage.js'),
  },
];

const PRIMARY_PATHS = ['/', '/java', '/map', '/notes', '/review', '/settings'];

const started = new Set<string>();

function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function networkAllowsPrefetch(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const connection = (
    navigator as Navigator & { readonly connection?: NetworkInformationLike }
  ).connection;
  if (!connection) {
    return true;
  }
  if (connection.saveData) {
    return false;
  }
  return connection.effectiveType !== 'slow-2g' &&
    connection.effectiveType !== '2g';
}

/**
 * Warm the chunk for one app path. Safe to call for external or unknown
 * paths; those are ignored. Repeats are deduplicated until a load fails.
 */
export function preloadRoute(pathname: string): void {
  if (!networkAllowsPrefetch()) {
    return;
  }

  const normalized = normalizePathname(pathname);
  const route = ROUTES.find((candidate) => candidate.matches(normalized));
  if (!route || started.has(route.id)) {
    return;
  }

  started.add(route.id);
  void route.load().catch(() => {
    // A failed warm-up must never affect navigation. Let a later intent retry.
    started.delete(route.id);
  });
}

/**
 * Resolve an anchor href against the current document and warm it when it is
 * an internal app route.
 */
export function preloadFromHref(href: string): void {
  if (typeof window === 'undefined' || !href || href.startsWith('#')) {
    return;
  }

  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return;
  }

  if (url.origin !== window.location.origin) {
    return;
  }

  preloadRoute(url.pathname);
}

/**
 * Warm the primary navigation chunks when the browser is idle. This is the
 * same set the old build shipped eagerly, but it now waits until the first
 * screen has settled.
 */
export function preloadPrimaryRoutes(): void {
  for (const pathname of PRIMARY_PATHS) {
    preloadRoute(pathname);
  }
}
