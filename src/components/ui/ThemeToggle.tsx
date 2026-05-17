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
  localStorage.setItem(STORAGE_KEY, theme);
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
      className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[var(--color-line)] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center text-base transition duration-500 ease-out"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'translateY(-120%) rotate(-90deg)' : 'translateY(0) rotate(0)',
        }}
      >
        ☀
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center text-base transition duration-500 ease-out"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'translateY(0) rotate(0)' : 'translateY(120%) rotate(90deg)',
        }}
      >
        ☾
      </span>
    </button>
  );
}
