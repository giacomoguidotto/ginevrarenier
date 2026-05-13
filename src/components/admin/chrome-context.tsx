"use client";

import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import { createChromeRegistry } from "./chrome-registry";
import { useEditMode } from "./edit-mode-context";
import { useSection } from "./section";

type Registry = ReturnType<typeof createChromeRegistry>;

const ChromeContext = createContext<Registry | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Registry>(createChromeRegistry());
  return <ChromeContext value={registryRef.current}>{children}</ChromeContext>;
}

export function useChromeRegister(
  fieldName: string,
  ref: RefObject<HTMLElement | null>
) {
  const registry = useContext(ChromeContext);
  const { isEditMode } = useEditMode();
  const { name: section } = useSection();
  const id = `${section}\0${fieldName}`;

  useEffect(() => {
    const el = ref.current;
    if (!(registry && el && isEditMode)) {
      return;
    }

    registry.register(id, el);
    return () => registry.deregister(id);
  }, [isEditMode, id, ref, registry]);
}

export function useChromeRegistry() {
  const ctx = useContext(ChromeContext);
  if (!ctx) {
    throw new Error("useChromeRegistry must be used inside ChromeProvider");
  }
  return ctx;
}
