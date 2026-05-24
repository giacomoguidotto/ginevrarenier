"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface ChromeEnablerValue {
  enable: () => void;
  enabled: boolean;
}

const ChromeEnablerContext = createContext<ChromeEnablerValue | null>(null);

export function ChromeEnablerProvider({
  children,
  active = true,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const prevActiveRef = useRef(active);

  useEffect(() => {
    if (active && !prevActiveRef.current) {
      setEnabled(false);
      const frame = requestAnimationFrame(() => setEnabled(true));
      prevActiveRef.current = active;
      return () => cancelAnimationFrame(frame);
    }
    if (!active) {
      setEnabled(false);
    }
    prevActiveRef.current = active;
  }, [active]);

  const enable = useCallback(() => {
    setEnabled((prev) => {
      if (prev) {
        return prev;
      }
      return true;
    });
  }, []);

  return (
    <ChromeEnablerContext value={{ enabled: active && enabled, enable }}>
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
