"use client";

import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeSummary,
  EntityRef,
  SerializedDraftBuffer,
} from "./draft-buffer";
import { createDraftBuffer } from "./draft-buffer";
import { createImageAssets } from "./image-assets";
import { deleteCloudinaryImage, uploadImage } from "./image-upload";

type Buffer = ReturnType<typeof createDraftBuffer>;
type Assets = ReturnType<typeof createImageAssets>;

const PERSIST_KEY = "draft-buffer-state";
const PERSIST_DEBOUNCE_MS = 300;

interface PersistedState {
  buffer: SerializedDraftBuffer;
  imageAssets: string[];
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const editActive = localStorage.getItem("edit-mode-active") === "true";
    if (!editActive) {
      localStorage.removeItem(PERSIST_KEY);
      return null;
    }
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function clearPersistedState(): void {
  try {
    localStorage.removeItem(PERSIST_KEY);
  } catch {
    // ignore
  }
}

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
  editedLocales: Set<string>;
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
  editedLocales: new Set<string>(),
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
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const [hasChanges, setHasChanges] = useState(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      bufferRef.current = createDraftBuffer(persisted.buffer);
      imageAssetsRef.current = createImageAssets(
        { upload: uploadImage, deleteAsset: deleteCloudinaryImage },
        persisted.imageAssets
      );
      return (
        bufferRef.current.hasChanges() ||
        imageAssetsRef.current.trackedAssets().length > 0
      );
    }
    bufferRef.current = createDraftBuffer();
    imageAssetsRef.current = createImageAssets({
      upload: uploadImage,
      deleteAsset: deleteCloudinaryImage,
    });
    return false;
  });

  const [globalEditedLocales, setGlobalEditedLocales] = useState(
    () => new Set<string>()
  );
  const [resetSignal, setResetSignal] = useState(0);
  const [editVersion, setEditVersion] = useState(0);
  const allContent = useQuery(api.siteContent.listAll);
  const upsertSiteContent = useMutation(api.siteContent.upsert);
  const removeProject = useMutation(api.projects.remove);
  const removeBlogPost = useMutation(api.blogPosts.remove);

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      try {
        const state: PersistedState = {
          buffer: bufferRef.current.serialize(),
          imageAssets: imageAssetsRef.current.trackedAssets(),
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch {
        // quota exceeded or storage unavailable
      }
    }, PERSIST_DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    },
    []
  );

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
      setGlobalEditedLocales((prev) => {
        if (prev.has(locale)) {
          return prev;
        }
        return new Set(prev).add(locale);
      });
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const trackAsset = useCallback(
    (publicId: string) => {
      imageAssetsRef.current.trackAsset(publicId);
      setHasChanges(true);
      schedulePersist();
    },
    [schedulePersist]
  );

  const uploadAsset = useCallback(
    async (file: File, folder: string) => {
      const result = await imageAssetsRef.current.upload(file, folder);
      setHasChanges(true);
      schedulePersist();
      return result;
    },
    [schedulePersist]
  );

  const trackCreation = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.trackCreation(entityType, id);
      setHasChanges(true);
      schedulePersist();
    },
    [schedulePersist]
  );

  const trackDeletion = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.trackDeletion(entityType, id);
      setHasChanges(true);
      schedulePersist();
    },
    [schedulePersist]
  );

  const cancelDeletion = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.cancelDeletion(entityType, id);
      setHasChanges(bufferRef.current.hasChanges());
      schedulePersist();
    },
    [schedulePersist]
  );

  const deleteField = useCallback(
    (section: string, keyPrefix: string) => {
      bufferRef.current.deleteField(section, keyPrefix);
      setHasChanges(true);
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const cancelFieldDeletion = useCallback(
    (section: string, keyPrefix: string) => {
      bufferRef.current.cancelFieldDeletion(section, keyPrefix);
      setHasChanges(bufferRef.current.hasChanges());
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
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
        merged[field] = { ...current, ...locales } as {
          en: string;
          it: string;
        };
      }
      await upsertSiteContent({
        section,
        content: merged,
        deleteKeyPrefixes: deletionsBySection.get(section),
      });
    }

    for (const ref of bufferRef.current.deletions()) {
      await removeEntity(ref);
    }

    bufferRef.current.discard();
    imageAssetsRef.current.clearTracked();
    setHasChanges(false);
    setGlobalEditedLocales(new Set());
    setEditVersion((v) => v + 1);
    setResetSignal((v) => v + 1);
    clearPersistedState();
  }, [allContent, upsertSiteContent, removeEntity]);

  const discard = useCallback(async () => {
    await imageAssetsRef.current.cleanup();

    for (const ref of bufferRef.current.creations()) {
      await removeEntity(ref);
    }

    bufferRef.current.discard();
    setHasChanges(false);
    setGlobalEditedLocales(new Set());
    setEditVersion((v) => v + 1);
    setResetSignal((v) => v + 1);
    clearPersistedState();
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
    () => ({
      changeSummary,
      editedLocales: globalEditedLocales,
      hasChanges,
      save,
      discard,
    }),
    [changeSummary, globalEditedLocales, hasChanges, save, discard]
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
