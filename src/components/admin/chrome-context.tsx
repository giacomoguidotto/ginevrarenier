"use client";

import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useChromeEnabler } from "./chrome-enabler";
import { createChromeRegistry } from "./chrome-registry";
import { useEditMode } from "./edit-mode-context";
import { useSection } from "./section";

type Registry = ReturnType<typeof createChromeRegistry>;

const ChromeContext = createContext<Registry | null>(null);
const DismountEpochContext = createContext(0);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Registry>(createChromeRegistry());
  const [epoch, setEpoch] = useState(0);

  const registry = registryRef.current;
  useEffect(() => {
    let tracked = registry.getDismountGeneration();
    return registry.subscribe(() => {
      const gen = registry.getDismountGeneration();
      if (gen !== tracked) {
        tracked = gen;
        setEpoch(gen);
      }
    });
  }, [registry]);

  return (
    <ChromeContext value={registry}>
      <DismountEpochContext value={epoch}>{children}</DismountEpochContext>
    </ChromeContext>
  );
}

export function useChromeRegister(
  fieldName: string,
  ref: RefObject<HTMLElement | null>
) {
  const registry = useContext(ChromeContext);
  const { isEditMode } = useEditMode();
  const { name: section } = useSection();
  const { enabled } = useChromeEnabler();
  const dismountEpoch = useContext(DismountEpochContext);
  const id = `${section}\0${fieldName}`;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // biome-ignore lint/correctness/useExhaustiveDependencies: dismountEpoch triggers re-registration after dismountAll clears persistent (layout-level) fields
  useEffect(() => {
    const el = ref.current;
    if (!(registry && el && isEditMode)) {
      return;
    }

    registry.register(id, el);
    if (enabledRef.current) {
      registry.markVisible(id);
    }
    return () => registry.deregister(id);
  }, [isEditMode, id, ref, registry, dismountEpoch]);

  useEffect(() => {
    if (!registry) {
      return;
    }
    if (enabled) {
      registry.markVisible(id);
    } else {
      registry.markHidden(id);
    }
  }, [enabled, id, registry]);
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
