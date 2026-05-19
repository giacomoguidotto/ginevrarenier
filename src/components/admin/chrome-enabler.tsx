"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface ChromeEnablerValue {
  enable: () => void;
  enabled: boolean;
}

const ChromeEnablerContext = createContext<ChromeEnablerValue | null>(null);

export function ChromeEnablerProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const enable = useCallback(() => {
    setEnabled((prev) => {
      if (prev) {
        return prev;
      }
      return true;
    });
  }, []);

  return (
    <ChromeEnablerContext value={{ enabled, enable }}>
      {children}
    </ChromeEnablerContext>
  );
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op for default context
function noop() {}

const DEFAULT: ChromeEnablerValue = { enabled: true, enable: noop };

export function useChromeEnabler(): ChromeEnablerValue {
  return useContext(ChromeEnablerContext) ?? DEFAULT;
}
