"use client";

import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeSummary } from "./draft-buffer";
import { createDraftBuffer } from "./draft-buffer";

type Buffer = ReturnType<typeof createDraftBuffer>;

interface DraftBufferOps {
  editedLocales: Buffer["editedLocales"];
  read: Buffer["read"];
  write: (
    section: string,
    field: string,
    locale: string,
    value: string
  ) => void;
}

interface DraftBufferState {
  changeSummary: () => ChangeSummary;
  discard: () => void;
  hasChanges: boolean;
  save: () => Promise<void>;
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};

const OpsContext = createContext<DraftBufferOps>({
  editedLocales: () => new Set<string>(),
  read: () => undefined,
  write: noop,
});

const ResetContext = createContext(0);

const StateContext = createContext<DraftBufferState>({
  changeSummary: () => ({ textEdits: [] }),
  hasChanges: false,
  save: () => Promise.resolve(),
  discard: noop,
});

export function DraftBufferProvider({ children }: { children: ReactNode }) {
  const bufferRef = useRef<Buffer>(createDraftBuffer());
  const [hasChanges, setHasChanges] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const allContent = useQuery(api.siteContent.listAll);
  const upsertSiteContent = useMutation(api.siteContent.upsert);

  const read: Buffer["read"] = useCallback(
    (section, field, locale) => bufferRef.current.read(section, field, locale),
    []
  );

  const editedLocales: Buffer["editedLocales"] = useCallback(
    (section, field) => bufferRef.current.editedLocales(section, field),
    []
  );

  const write = useCallback(
    (section: string, field: string, locale: string, value: string) => {
      bufferRef.current.write(section, field, locale, value);
      setHasChanges(true);
    },
    []
  );

  const save = useCallback(async () => {
    const grouped = bufferRef.current.changes();
    for (const [section, fields] of grouped) {
      const existing =
        allContent?.find((c) => c.section === section)?.content ?? {};
      const merged: Record<string, { en: string; it: string }> = {};
      for (const [field, locales] of Object.entries(fields)) {
        const current = existing[field] ?? { en: "", it: "" };
        merged[field] = { ...current, ...locales };
      }
      await upsertSiteContent({
        section,
        content: JSON.stringify(merged),
      });
    }
    bufferRef.current.discard();
    setHasChanges(false);
    setResetSignal((v) => v + 1);
  }, [allContent, upsertSiteContent]);

  const discard = useCallback(() => {
    bufferRef.current.discard();
    setHasChanges(false);
    setResetSignal((v) => v + 1);
  }, []);

  const changeSummary = useCallback((): ChangeSummary => {
    const getOriginal = (section: string, field: string, locale: string) => {
      const fieldContent = allContent?.find((c) => c.section === section)
        ?.content[field];
      return fieldContent?.[locale as "en" | "it"];
    };
    return bufferRef.current.changeSummary(getOriginal);
  }, [allContent]);

  const ops = useMemo(
    () => ({ editedLocales, read, write }),
    [editedLocales, read, write]
  );

  const state = useMemo(
    () => ({ changeSummary, hasChanges, save, discard }),
    [changeSummary, hasChanges, save, discard]
  );

  return (
    <OpsContext value={ops}>
      <ResetContext value={resetSignal}>
        <StateContext value={state}>{children}</StateContext>
      </ResetContext>
    </OpsContext>
  );
}

export function useDraftBufferOps() {
  return useContext(OpsContext);
}

export function useDraftBufferReset() {
  return useContext(ResetContext);
}

export function useDraftBufferState() {
  return useContext(StateContext);
}
