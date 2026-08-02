"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Apply class to <html>
  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    const isDark = t === "dark";

    root.classList.remove("dark", "light");
    if (isDark) root.classList.add("dark");
    setResolvedTheme(isDark ? "dark" : "light");
  }, []);

  // On mount: read from localStorage
  useEffect(() => {
    let saved = localStorage.getItem("gpedge-theme-v3") as string;
    if (saved !== "dark" && saved !== "light") {
      saved = "light";
      localStorage.setItem("gpedge-theme-v3", "light");
    }
    setThemeState(saved as Theme);
    applyTheme(saved as Theme);
  }, [applyTheme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem("gpedge-theme-v3", t);
      applyTheme(t);
    },
    [applyTheme]
  );

  const contextValue = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
