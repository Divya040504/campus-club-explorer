import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('campus-club-theme') === 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('campus-club-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button className="theme-toggle" type="button" onClick={() => setIsDark((current) => !current)} aria-label={`Use ${isDark ? 'light' : 'dark'} theme`}>
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
