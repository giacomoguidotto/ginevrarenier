"use client";

import { api } from "convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
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
import { useEditMode } from "./edit-mode-context";
import { createImageAssets } from "./image-assets";
import { deleteCloudinaryImage, uploadImage } from "./image-upload";
import {
  buildEntityUpdates,
  groupFieldDeletions,
  mergeSiteContent,
  routeSection,
} from "./save-routing";

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
  clearPublishOverride: (entityType: string, id: string) => void;
  deleteField: (section: string, keyPrefix: string) => void;
  editedLocales: Buffer["editedLocales"];
  getPublishOverride: (entityType: string, id: string) => boolean | undefined;
  getReorderList: (entityType: string) => string[] | undefined;
  isFieldDeleted: (section: string, keyPrefix: string) => boolean;
  isPendingDeletion: (entityType: string, id: string) => boolean;
  isSessionCreated: (entityType: string, id: string) => boolean;
  read: Buffer["read"];
  sectionChanges: Buffer["sectionChanges"];
  setPublishOverride: (
    entityType: string,
    id: string,
    published: boolean
  ) => void;
  setReorderList: (entityType: string, ids: string[]) => void;
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
  clearPublishOverride: noop,
  deleteField: noop,
  editedLocales: () => new Set<string>(),
  getPublishOverride: () => undefined,
  getReorderList: () => undefined,
  isFieldDeleted: () => false,
  isPendingDeletion: () => false,
  isSessionCreated: () => false,
  read: () => undefined,
  sectionChanges: () => ({}),
  setPublishOverride: noop,
  setReorderList: noop,
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
    autoTranslations: [],
    createdEntities: [],
    dismissals: [],
    fieldDeletions: [],
    imageSwaps: [],
    pendingDeletions: [],
    publishOverrides: [],
    reorderedEntityTypes: [],
    textEdits: [],
  }),
  editedLocales: new Set<string>(),
  hasChanges: false,
  save: () => Promise.resolve(),
  discard: noop,
});

export function DraftBufferProvider({ children }: { children: ReactNode }) {
  const bufferRef = useRef<Buffer>(null as unknown as Buffer);
  const imageAssetsRef = useRef<Assets>(null as unknown as Assets);
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
  const { isEditMode } = useEditMode();
  const { isAuthenticated } = useConvexAuth();
  const allContent = useQuery(
    api.siteContent.listAll,
    isEditMode && isAuthenticated ? {} : "skip"
  );
  const upsertSiteContent = useMutation(api.siteContent.upsert);
  const updateProject = useMutation(api.projects.update);
  const updateBlogPost = useMutation(api.blogPosts.update);
  const reorderProjects = useMutation(api.projects.reorder);
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
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const cancelDeletion = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.cancelDeletion(entityType, id);
      setHasChanges(bufferRef.current.hasChanges());
      setEditVersion((v) => v + 1);
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

  const setPublishOverride = useCallback(
    (entityType: string, id: string, published: boolean) => {
      bufferRef.current.setPublishOverride(entityType, id, published);
      setHasChanges(true);
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const clearPublishOverride = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.clearPublishOverride(entityType, id);
      setHasChanges(bufferRef.current.hasChanges());
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const setReorderList = useCallback(
    (entityType: string, ids: string[]) => {
      bufferRef.current.setReorderList(entityType, ids);
      setHasChanges(true);
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
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
    const deletionsBySection = groupFieldDeletions(
      bufferRef.current.fieldDeletions()
    );

    const touchedSections = new Set([
      ...grouped.keys(),
      ...deletionsBySection.keys(),
    ]);

    for (const sectionName of touchedSections) {
      const fields = grouped.get(sectionName) ?? {};
      const route = routeSection(sectionName);

      if (route.kind === "project") {
        await updateProject({
          id: route.id as never,
          ...buildEntityUpdates(fields),
        } as Parameters<typeof updateProject>[0]);
      } else if (route.kind === "post") {
        await updateBlogPost({
          id: route.id as never,
          ...buildEntityUpdates(fields),
        } as Parameters<typeof updateBlogPost>[0]);
      } else {
        const existing =
          allContent?.find((c) => c.section === sectionName)?.content ?? {};
        await upsertSiteContent({
          section: sectionName,
          content: mergeSiteContent(fields, existing),
          deleteKeyPrefixes: deletionsBySection.get(sectionName),
        });
      }
    }

    for (const ovr of bufferRef.current.publishOverrides()) {
      if (ovr.entityType === "project") {
        await updateProject({
          id: ovr.id as never,
          published: ovr.published,
        } as Parameters<typeof updateProject>[0]);
      } else if (ovr.entityType === "post") {
        await updateBlogPost({
          id: ovr.id as never,
          published: ovr.published,
        } as Parameters<typeof updateBlogPost>[0]);
      }
    }

    const pendingDeletionIds = new Set(
      bufferRef.current.deletions().map((d) => d.id)
    );
    const projectReorder = bufferRef.current.getReorderList("project");
    if (projectReorder) {
      await reorderProjects({
        ids: projectReorder.filter(
          (id) => !pendingDeletionIds.has(id)
        ) as never,
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
  }, [
    allContent,
    upsertSiteContent,
    updateProject,
    updateBlogPost,
    reorderProjects,
    removeEntity,
  ]);

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
      publishOverrides: textSummary.publishOverrides,
      reorderedEntityTypes: textSummary.reorderedEntityTypes,
      dismissals: textSummary.dismissals,
      autoTranslations: textSummary.autoTranslations,
    };
  }, [allContent]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editVersion forces new read-function identities so React Compiler cannot cache stale return values
  const ops = useMemo(
    () => ({
      cancelDeletion,
      cancelFieldDeletion,
      clearPublishOverride,
      deleteField,
      editedLocales: ((section: string, field: string) =>
        bufferRef.current.editedLocales(
          section,
          field
        )) as Buffer["editedLocales"],
      getPublishOverride: (entityType: string, id: string) =>
        bufferRef.current.getPublishOverride(entityType, id),
      getReorderList: (entityType: string) =>
        bufferRef.current.getReorderList(entityType),
      isFieldDeleted: (section: string, keyPrefix: string) =>
        bufferRef.current.isFieldDeleted(section, keyPrefix),
      isPendingDeletion: (entityType: string, id: string) =>
        bufferRef.current.isPendingDeletion(entityType, id),
      isSessionCreated: (entityType: string, id: string) =>
        bufferRef.current.isSessionCreated(entityType, id),
      read: ((section: string, field: string, locale: string) =>
        bufferRef.current.read(section, field, locale)) as Buffer["read"],
      sectionChanges: ((section: string) =>
        bufferRef.current.sectionChanges(section)) as Buffer["sectionChanges"],
      setPublishOverride,
      setReorderList,
      trackCreation,
      trackDeletion,
      write,
    }),
    [
      editVersion,
      cancelDeletion,
      cancelFieldDeletion,
      clearPublishOverride,
      deleteField,
      setPublishOverride,
      setReorderList,
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
