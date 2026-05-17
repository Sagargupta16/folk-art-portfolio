import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing or storage disabled -- theme still applies for the session.
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="group relative inline-grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-line)] bg-transparent text-[var(--color-ink)] transition duration-300 ease-out hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] sm:h-9 sm:w-9"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center text-base leading-none transition-all duration-500 ease-out motion-reduce:transition-none"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'translateY(-110%) rotate(-90deg)' : 'translateY(0) rotate(0)',
        }}
      >
        ☀
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center text-base leading-none transition-all duration-500 ease-out motion-reduce:transition-none"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'translateY(0) rotate(0)' : 'translateY(110%) rotate(90deg)',
        }}
      >
        ☾
      </span>
    </button>
  );
}
