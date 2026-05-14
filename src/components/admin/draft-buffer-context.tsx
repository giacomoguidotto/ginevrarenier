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
import { createImageAssets } from "./image-assets";
import { deleteCloudinaryImage, uploadImage } from "./image-upload";

type Buffer = ReturnType<typeof createDraftBuffer>;
type Assets = ReturnType<typeof createImageAssets>;

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

interface ImageAssetsOps {
  trackAsset: (publicId: string) => void;
  upload: (
    file: File,
    folder: string
  ) => Promise<{ url: string; publicId: string }>;
}

interface DraftBufferState {
  changeSummary: () => ChangeSummary;
  discard: () => void | Promise<void>;
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

const ImageAssetsContext = createContext<ImageAssetsOps>({
  trackAsset: noop,
  upload: () => Promise.resolve({ url: "", publicId: "" }),
});

const ResetContext = createContext(0);

const StateContext = createContext<DraftBufferState>({
  changeSummary: () => ({ imageSwaps: [], textEdits: [] }),
  hasChanges: false,
  save: () => Promise.resolve(),
  discard: noop,
});

export function DraftBufferProvider({ children }: { children: ReactNode }) {
  const bufferRef = useRef<Buffer>(createDraftBuffer());
  const imageAssetsRef = useRef<Assets>(
    createImageAssets({
      upload: uploadImage,
      deleteAsset: deleteCloudinaryImage,
    })
  );
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

  const trackAsset = useCallback((publicId: string) => {
    imageAssetsRef.current.trackAsset(publicId);
    setHasChanges(true);
  }, []);

  const uploadAsset = useCallback(async (file: File, folder: string) => {
    const result = await imageAssetsRef.current.upload(file, folder);
    setHasChanges(true);
    return result;
  }, []);

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
    imageAssetsRef.current.clearTracked();
    setHasChanges(false);
    setResetSignal((v) => v + 1);
  }, [allContent, upsertSiteContent]);

  const discard = useCallback(async () => {
    await imageAssetsRef.current.cleanup();
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
    const textSummary = bufferRef.current.changeSummary(getOriginal);
    const imageSummary = imageAssetsRef.current.changeSummary();
    return {
      textEdits: textSummary.textEdits,
      imageSwaps: imageSummary.imageSwaps,
    };
  }, [allContent]);

  const ops = useMemo(
    () => ({ editedLocales, read, write }),
    [editedLocales, read, write]
  );

  const imageOps = useMemo(
    () => ({ trackAsset, upload: uploadAsset }),
    [trackAsset, uploadAsset]
  );

  const state = useMemo(
    () => ({ changeSummary, hasChanges, save, discard }),
    [changeSummary, hasChanges, save, discard]
  );

  return (
    <OpsContext value={ops}>
      <ImageAssetsContext value={imageOps}>
        <ResetContext value={resetSignal}>
          <StateContext value={state}>{children}</StateContext>
        </ResetContext>
      </ImageAssetsContext>
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

export function useImageAssets() {
  return useContext(ImageAssetsContext);
}
