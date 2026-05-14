"use client";

import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import { createChromeRegistry } from "./chrome-registry";
import { useEditMode } from "./edit-mode-context";
import { useFieldVisibility } from "./field-visibility";
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
  const { visible } = useFieldVisibility();
  const id = `${section}\0${fieldName}`;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    const el = ref.current;
    if (!(registry && el && isEditMode)) {
      return;
    }

    registry.register(id, el);
    if (visibleRef.current) {
      registry.markVisible(id);
    }
    return () => registry.deregister(id);
  }, [isEditMode, id, ref, registry]);

  useEffect(() => {
    if (!registry) {
      return;
    }
    if (visible) {
      registry.markVisible(id);
    } else {
      registry.markHidden(id);
    }
  }, [visible, id, registry]);
}

export function useChromeDismount(path: string) {
  const registry = useContext(ChromeContext);
  const prevPath = useRef(path);

  useEffect(() => {
    if (prevPath.current !== path && registry) {
      registry.dismountAll();
    }
    prevPath.current = path;
  }, [path, registry]);
}

export function useChromeRegistry() {
  const ctx = useContext(ChromeContext);
  if (!ctx) {
    throw new Error("useChromeRegistry must be used inside ChromeProvider");
  }
  return ctx;
}
