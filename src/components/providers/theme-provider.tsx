"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

function SystemThemeSync() {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme !== "system") {
        setTheme("system");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [setTheme, theme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="experience-theme"
    >
      <SystemThemeSync />
      {children}
    </NextThemesProvider>
  );
}
