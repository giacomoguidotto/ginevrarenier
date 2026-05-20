"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

const pageRegistry = new Map<string, Map<string, string>>();
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

interface PageBoundaryContextValue {
  deregister: (name: string) => void;
  register: (name: string, label: string) => void;
}

const PageBoundaryContext = createContext<PageBoundaryContextValue | null>(
  null
);

export function PageBoundary({
  page,
  children,
}: {
  children: ReactNode;
  page: string;
}) {
  const ref = useRef(page);
  ref.current = page;

  useEffect(
    () => () => {
      pageRegistry.delete(ref.current);
      notifyListeners();
    },
    []
  );

  const ctx = useRef<PageBoundaryContextValue>({
    register(name: string, label: string) {
      let sections = pageRegistry.get(ref.current);
      if (!sections) {
        sections = new Map();
        pageRegistry.set(ref.current, sections);
      }
      sections.set(name, label);
      notifyListeners();
    },
    deregister(name: string) {
      pageRegistry.get(ref.current)?.delete(name);
      notifyListeners();
    },
  });

  return (
    <PageBoundaryContext value={ctx.current}>{children}</PageBoundaryContext>
  );
}

export function usePageBoundaryRegistration(name: string, label: string): void {
  const boundary = useContext(PageBoundaryContext);

  useEffect(() => {
    if (!boundary) {
      return;
    }
    boundary.register(name, label);
    return () => boundary.deregister(name);
  }, [boundary, name, label]);
}

export function getPageSections(page: string): ReadonlyMap<string, string> {
  return pageRegistry.get(page) ?? new Map();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function usePageRegistry(page: string): ReadonlyMap<string, string> {
  const getSnapshot = useCallback(
    () => pageRegistry.get(page) ?? emptyMap,
    [page]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => emptyMap);
}

export function getAllSectionLabels(): ReadonlyMap<string, string> {
  const merged = new Map<string, string>();
  for (const sections of pageRegistry.values()) {
    for (const [name, label] of sections) {
      merged.set(name, label);
    }
  }
  return merged;
}

const emptyMap: ReadonlyMap<string, string> = new Map();
