import { useEffect } from 'react';
import { useAppStore } from './store.js';

const THEME_MIRROR_KEY = 'foundation.theme-mirror';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * The persisted notebook owns the theme choice. The localStorage mirror is a
 * first-paint hint only; it is refreshed whenever the choice changes.
 */
export function useTheme(): void {
  const theme = useAppStore((state) => state.data.settings.theme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);

    const apply = () => {
      const resolved =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;

      try {
        window.localStorage.setItem(THEME_MIRROR_KEY, theme);
      } catch {
        // The mirror is optional; the persisted notebook still holds truth.
      }
    };

    apply();

    if (theme !== 'system') {
      return;
    }

    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
