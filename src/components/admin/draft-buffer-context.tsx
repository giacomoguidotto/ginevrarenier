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
import type { ChangeSummary, EntityRef } from "./draft-buffer";
import { createDraftBuffer } from "./draft-buffer";
import { createImageAssets } from "./image-assets";
import { deleteCloudinaryImage, uploadImage } from "./image-upload";

type Buffer = ReturnType<typeof createDraftBuffer>;
type Assets = ReturnType<typeof createImageAssets>;

interface DraftBufferOps {
  cancelDeletion: (entityType: string, id: string) => void;
  cancelFieldDeletion: (section: string, keyPrefix: string) => void;
  deleteField: (section: string, keyPrefix: string) => void;
  editedLocales: Buffer["editedLocales"];
  isFieldDeleted: (section: string, keyPrefix: string) => boolean;
  isPendingDeletion: (entityType: string, id: string) => boolean;
  isSessionCreated: (entityType: string, id: string) => boolean;
  read: Buffer["read"];
  sectionChanges: Buffer["sectionChanges"];
  trackCreation: (entityType: string, id: string) => void;
  trackDeletion: (entityType: string, id: string) => void;
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
  cancelDeletion: noop,
  cancelFieldDeletion: noop,
  deleteField: noop,
  editedLocales: () => new Set<string>(),
  isFieldDeleted: () => false,
  isPendingDeletion: () => false,
  isSessionCreated: () => false,
  read: () => undefined,
  sectionChanges: () => ({}),
  trackCreation: noop,
  trackDeletion: noop,
  write: noop,
});

const ImageAssetsContext = createContext<ImageAssetsOps>({
  trackAsset: noop,
  upload: () => Promise.resolve({ url: "", publicId: "" }),
});

const ResetContext = createContext(0);
const EditVersionContext = createContext(0);

const StateContext = createContext<DraftBufferState>({
  changeSummary: () => ({
    createdEntities: [],
    fieldDeletions: [],
    imageSwaps: [],
    pendingDeletions: [],
    textEdits: [],
  }),
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
  const [editVersion, setEditVersion] = useState(0);
  const allContent = useQuery(api.siteContent.listAll);
  const upsertSiteContent = useMutation(api.siteContent.upsert);
  const removeProject = useMutation(api.projects.remove);
  const removeBlogPost = useMutation(api.blogPosts.remove);

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
      setEditVersion((v) => v + 1);
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

  const trackCreation = useCallback((entityType: string, id: string) => {
    bufferRef.current.trackCreation(entityType, id);
    setHasChanges(true);
  }, []);

  const trackDeletion = useCallback((entityType: string, id: string) => {
    bufferRef.current.trackDeletion(entityType, id);
    setHasChanges(true);
  }, []);

  const cancelDeletion = useCallback((entityType: string, id: string) => {
    bufferRef.current.cancelDeletion(entityType, id);
    setHasChanges(bufferRef.current.hasChanges());
  }, []);

  const deleteField = useCallback((section: string, keyPrefix: string) => {
    bufferRef.current.deleteField(section, keyPrefix);
    setHasChanges(true);
    setEditVersion((v) => v + 1);
  }, []);

  const cancelFieldDeletion = useCallback(
    (section: string, keyPrefix: string) => {
      bufferRef.current.cancelFieldDeletion(section, keyPrefix);
      setHasChanges(bufferRef.current.hasChanges());
      setEditVersion((v) => v + 1);
    },
    []
  );

  const sectionChanges: Buffer["sectionChanges"] = useCallback(
    (section) => bufferRef.current.sectionChanges(section),
    []
  );

  const isFieldDeleted = useCallback(
    (section: string, keyPrefix: string) =>
      bufferRef.current.isFieldDeleted(section, keyPrefix),
    []
  );

  const isPendingDeletion = useCallback(
    (entityType: string, id: string) =>
      bufferRef.current.isPendingDeletion(entityType, id),
    []
  );

  const isSessionCreated = useCallback(
    (entityType: string, id: string) =>
      bufferRef.current.isSessionCreated(entityType, id),
    []
  );

  const removeEntity = useCallback(
    async (ref: EntityRef) => {
      if (ref.entityType === "project") {
        await removeProject({ id: ref.id as never });
      } else if (ref.entityType === "post") {
        await removeBlogPost({ id: ref.id as never });
      }
    },
    [removeProject, removeBlogPost]
  );

  const save = useCallback(async () => {
    const grouped = bufferRef.current.changes();
    const fds = bufferRef.current.fieldDeletions();
    const deletionsBySection = new Map<string, string[]>();
    for (const { section, keyPrefix } of fds) {
      let list = deletionsBySection.get(section);
      if (!list) {
        list = [];
        deletionsBySection.set(section, list);
      }
      list.push(keyPrefix);
    }

    const touchedSections = new Set([
      ...grouped.keys(),
      ...deletionsBySection.keys(),
    ]);

    for (const section of touchedSections) {
      const fields = grouped.get(section) ?? {};
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
        deleteKeyPrefixes: deletionsBySection.get(section),
      });
    }

    for (const ref of bufferRef.current.deletions()) {
      await removeEntity(ref);
    }

    bufferRef.current.discard();
    imageAssetsRef.current.clearTracked();
    setHasChanges(false);
    setEditVersion((v) => v + 1);
    setResetSignal((v) => v + 1);
  }, [allContent, upsertSiteContent, removeEntity]);

  const discard = useCallback(async () => {
    await imageAssetsRef.current.cleanup();

    for (const ref of bufferRef.current.creations()) {
      await removeEntity(ref);
    }

    bufferRef.current.discard();
    setHasChanges(false);
    setEditVersion((v) => v + 1);
    setResetSignal((v) => v + 1);
  }, [removeEntity]);

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
      createdEntities: textSummary.createdEntities,
      pendingDeletions: textSummary.pendingDeletions,
      fieldDeletions: textSummary.fieldDeletions,
    };
  }, [allContent]);

  const ops = useMemo(
    () => ({
      cancelDeletion,
      cancelFieldDeletion,
      deleteField,
      editedLocales,
      isFieldDeleted,
      isPendingDeletion,
      isSessionCreated,
      read,
      sectionChanges,
      trackCreation,
      trackDeletion,
      write,
    }),
    [
      cancelDeletion,
      cancelFieldDeletion,
      deleteField,
      editedLocales,
      isFieldDeleted,
      isPendingDeletion,
      isSessionCreated,
      read,
      sectionChanges,
      trackCreation,
      trackDeletion,
      write,
    ]
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
        <EditVersionContext value={editVersion}>
          <ResetContext value={resetSignal}>
            <StateContext value={state}>{children}</StateContext>
          </ResetContext>
        </EditVersionContext>
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

export function useEditVersion() {
  return useContext(EditVersionContext);
}

export function useDraftBufferState() {
  return useContext(StateContext);
}

export function useImageAssets() {
  return useContext(ImageAssetsContext);
}
