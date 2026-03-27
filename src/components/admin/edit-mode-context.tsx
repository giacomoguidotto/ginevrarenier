"use client";

import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Locale } from "@/i18n/config";

const STORAGE_KEY = "edit-mode-active";

type EditModeContextValue = {
  isEditMode: boolean;
  editingLocale: Locale;
  toggleEditMode: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
  setEditingLocale: (locale: Locale) => void;
};

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};

const EditModeContext = createContext<EditModeContextValue>({
  isEditMode: false,
  editingLocale: "en",
  toggleEditMode: noop,
  enterEditMode: noop,
  exitEditMode: noop,
  setEditingLocale: noop,
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
  const pageLocale = useLocale() as Locale;
  const [isEditMode, setIsEditMode] = useState(getPersistedEditMode);
  const [editingLocale, setEditingLocale] = useState<Locale>(pageLocale);

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
    () => ({
      isEditMode,
      editingLocale,
      toggleEditMode,
      enterEditMode,
      exitEditMode,
      setEditingLocale,
    }),
    [isEditMode, editingLocale, toggleEditMode, enterEditMode, exitEditMode]
  );

  return <EditModeContext value={value}>{children}</EditModeContext>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}
