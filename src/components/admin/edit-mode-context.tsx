"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type EditModeContextValue = {
  isEditMode: boolean;
  toggleEditMode: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
};

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};

const EditModeContext = createContext<EditModeContextValue>({
  isEditMode: false,
  toggleEditMode: noop,
  enterEditMode: noop,
  exitEditMode: noop,
});

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const value = useMemo(
    () => ({ isEditMode, toggleEditMode, enterEditMode, exitEditMode }),
    [isEditMode, toggleEditMode, enterEditMode, exitEditMode]
  );

  return <EditModeContext value={value}>{children}</EditModeContext>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}
