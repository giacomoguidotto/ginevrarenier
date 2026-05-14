"use client";

import type { ReactNode, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface FieldVisibilityValue {
  markHidden: () => void;
  markVisible: () => void;
  visible: boolean;
}

const FieldVisibilityContext = createContext<FieldVisibilityValue | null>(null);

interface FieldVisibilityProviderProps {
  children: ReactNode;
  containerRef?: RefObject<HTMLElement | null>;
  trackViewport?: boolean;
}

export function FieldVisibilityProvider({
  children,
  containerRef,
  trackViewport,
}: FieldVisibilityProviderProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const [inViewport, setInViewport] = useState(!trackViewport);

  useEffect(() => {
    if (!(trackViewport && containerRef?.current)) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry.isIntersecting);
      if (!entry.isIntersecting) {
        setAnimationDone(false);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [trackViewport, containerRef]);

  const visible = trackViewport ? inViewport && animationDone : animationDone;

  const markVisible = useCallback(() => setAnimationDone(true), []);
  const markHidden = useCallback(() => setAnimationDone(false), []);

  return (
    <FieldVisibilityContext value={{ visible, markVisible, markHidden }}>
      {children}
    </FieldVisibilityContext>
  );
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op for default context
function noop() {}

const DEFAULT_VISIBILITY: FieldVisibilityValue = {
  visible: true,
  markVisible: noop,
  markHidden: noop,
};

export function useFieldVisibility(): FieldVisibilityValue {
  return useContext(FieldVisibilityContext) ?? DEFAULT_VISIBILITY;
}
