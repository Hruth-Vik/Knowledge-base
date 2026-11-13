import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell.js';
import { RouteErrorPage } from './RouteErrorPage.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { TodayPage } = await import('./pages/TodayPage.js');
          return { Component: TodayPage };
        },
      },
      {
        path: 'java',
        lazy: async () => {
          const { RoadmapPage } = await import('./pages/RoadmapPage.js');
          return { Component: RoadmapPage };
        },
      },
      {
        path: 'java/:levelId',
        lazy: async () => {
          const { LevelPage } = await import('./pages/LevelPage.js');
          return { Component: LevelPage };
        },
      },
      {
        path: 'java/:levelId/:lessonSlug',
        lazy: async () => {
          const { LessonPage } = await import('./pages/LessonPage.js');
          return { Component: LessonPage };
        },
      },
      {
        path: 'languages/:languageId',
        lazy: async () => {
          const { LanguagePage } = await import('./pages/LanguagePage.js');
          return { Component: LanguagePage };
        },
      },
      {
        path: 'map',
        lazy: async () => {
          const { MapPage } = await import('./pages/MapPage.js');
          return { Component: MapPage };
        },
      },
      {
        path: 'notes',
        lazy: async () => {
          const { NotesPage } = await import('./pages/NotesPage.js');
          return { Component: NotesPage };
        },
      },
      {
        path: 'review',
        lazy: async () => {
          const { ReviewPage } = await import('./pages/ReviewPage.js');
          return { Component: ReviewPage };
        },
      },
      {
        path: 'quiz/:milestoneId',
        lazy: async () => {
          const { QuizPage } = await import('./pages/QuizPage.js');
          return { Component: QuizPage };
        },
      },
      {
        path: 'interview',
        lazy: async () => {
          const { InterviewPage } = await import('./pages/InterviewPage.js');
          return { Component: InterviewPage };
        },
      },
      {
        path: 'play',
        lazy: async () => {
          const { PlayPage } = await import('./pages/PlayPage.js');
          return { Component: PlayPage };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsPage } = await import('./pages/SettingsPage.js');
          return { Component: SettingsPage };
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { NotFoundPage } = await import('./pages/NotFoundPage.js');
          return { Component: NotFoundPage };
        },
      },
    ],
  },
]);
