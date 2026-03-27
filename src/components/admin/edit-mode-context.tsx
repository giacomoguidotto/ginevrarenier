"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "edit-mode-active";

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

function getPersistedEditMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(getPersistedEditMode);

  useEffect(() => {
    try {
      if (isEditMode) {
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [isEditMode]);

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
