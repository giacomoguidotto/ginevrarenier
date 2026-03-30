"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface AnimationReadyContextValue {
  /** Whether all registered animations have completed */
  settled: boolean;
  /** Call this when a section's enter animations complete */
  signalReady: () => void;
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};

const AnimationReadyContext = createContext<AnimationReadyContextValue>({
  signalReady: noop,
  settled: true,
});

export function AnimationReadyProvider({
  children,
  expectedCount,
}: {
  children: ReactNode;
  /** How many signalReady() calls to wait for before settled=true */
  expectedCount: number;
}) {
  const [settled, setSettled] = useState(expectedCount === 0);
  const countRef = useRef(0);

  const signalReady = useCallback(() => {
    countRef.current += 1;
    if (countRef.current >= expectedCount) {
      setSettled(true);
    }
  }, [expectedCount]);

  return (
    <AnimationReadyContext value={{ signalReady, settled }}>
      {children}
    </AnimationReadyContext>
  );
}

export function useAnimationReady() {
  return useContext(AnimationReadyContext);
}
