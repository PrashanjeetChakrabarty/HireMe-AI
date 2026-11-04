import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ---------- theme ---------- */
const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, colors: {} });
export const useTheme = () => useContext(ThemeContext);

const readColors = () => {
  const cs = getComputedStyle(document.documentElement);
  const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    ink: get('--c-ink', '#ffffff'),
    accent: get('--c-accent', '#4cc3ff'),
    accent2: get('--c-accent2', '#8b7bff'),
    ribbon: get('--c-ribbon', '#6a58f0'),
    muted: get('--c-muted', '#8e9ac8'),
    grid: get('--c-grid', 'rgba(255,255,255,0.12)'),
    surface: get('--c-bg2', '#0a1030')
  };
};

const systemTheme = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || systemTheme());
  const [colors, setColors] = useState(readColors);
  const chosen = useRef(Boolean(document.documentElement.dataset.theme));

  // Follow the system until the visitor picks a theme with the toggle.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!chosen.current) setTheme(systemTheme());
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useLayoutEffect(() => {
    if (chosen.current) document.documentElement.dataset.theme = theme;
    setColors(readColors());
  }, [theme]);

  const toggle = useCallback(() => {
    chosen.current = true;
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle, colors }}>{children}</ThemeContext.Provider>;
}