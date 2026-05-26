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
import { locales } from "@/i18n/config";
import type { AutoTranslateResult, TranslateFn } from "./auto-translate";
import { autoTranslateAll } from "./auto-translate";
import type {
  ChangeSummary,
  EntityRef,
  SerializedDraftBuffer,
} from "./draft-buffer";
import { createDraftBuffer, DRAFT_BUFFER_VERSION } from "./draft-buffer";
import { useEditMode } from "./edit-mode-context";
import { routeSection } from "./entity-descriptors";
import { createImageAssets } from "./image-assets";
import { deleteCloudinaryImage, uploadImage } from "./image-upload";
import { buildEntityUpdates, mergeSiteContent } from "./save-routing";
import type { FieldStatus } from "./staleness-engine";

type Buffer = ReturnType<typeof createDraftBuffer>;
type Assets = ReturnType<typeof createImageAssets>;

const PERSIST_KEY = "draft-buffer-state";
const PERSIST_DEBOUNCE_MS = 300;

interface PersistedState {
  buffer: SerializedDraftBuffer;
  imageAssets: string[];
  pendingDeletionAssets?: string[];
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
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.buffer.version !== DRAFT_BUFFER_VERSION) {
      localStorage.removeItem(PERSIST_KEY);
      return null;
    }
    return parsed;
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
  autoTranslate: (
    staleFields: { section: string; field: string; locale: string }[],
    translate: TranslateFn
  ) => Promise<AutoTranslateResult>;
  cancelCreation: (entityType: string, id: string) => void;
  cancelDeletion: (entityType: string, id: string) => void;
  clearPublishOverride: (entityType: string, id: string) => void;
  clearSelectionOverride: (projectId: string) => void;
  dismiss: (section: string, field: string, locale: string) => void;
  editedLocales: Buffer["editedLocales"];
  fieldStatus: (section: string, field: string, locale: string) => FieldStatus;
  getPublishOverride: (entityType: string, id: string) => boolean | undefined;
  getReorderList: (entityType: string) => string[] | undefined;
  getSelectionOverride: (projectId: string) => boolean | undefined;
  isAutoTranslated: (section: string, field: string, locale: string) => boolean;
  isDismissed: (section: string, field: string, locale: string) => boolean;
  isPendingDeletion: (entityType: string, id: string) => boolean;
  isSessionCreated: (entityType: string, id: string) => boolean;
  markAutoTranslated: (section: string, field: string, locale: string) => void;
  read: Buffer["read"];
  registerSectionData: (
    section: string,
    data: Record<string, Record<string, string>>
  ) => void;
  removeEdit: (section: string, field: string, locale: string) => void;
  sectionChanges: Buffer["sectionChanges"];
  setPublishOverride: (
    entityType: string,
    id: string,
    published: boolean
  ) => void;
  setReorderList: (entityType: string, ids: string[]) => void;
  setSelectionOverride: (projectId: string, selected: boolean) => void;
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
  cancelPendingDeletion: (publicId: string) => void;
  trackAsset: (publicId: string) => void;
  trackPendingDeletion: (publicId: string) => void;
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
  autoTranslate: () => Promise.resolve({ translated: [], failed: [] }),
  cancelCreation: noop,
  cancelDeletion: noop,
  clearPublishOverride: noop,
  clearSelectionOverride: noop,
  dismiss: noop,
  editedLocales: () => new Set<string>(),
  fieldStatus: () => "fresh" as FieldStatus,
  getPublishOverride: () => undefined,
  getReorderList: () => undefined,
  getSelectionOverride: () => undefined,
  isAutoTranslated: () => false,
  isDismissed: () => false,
  isPendingDeletion: () => false,
  isSessionCreated: () => false,
  markAutoTranslated: noop,
  read: () => undefined,
  registerSectionData: noop,
  removeEdit: noop,
  sectionChanges: () => ({}),
  setPublishOverride: noop,
  setReorderList: noop,
  setSelectionOverride: noop,
  trackCreation: noop,
  trackDeletion: noop,
  write: noop,
});

const ImageAssetsContext = createContext<ImageAssetsOps>({
  cancelPendingDeletion: noop,
  trackAsset: noop,
  trackPendingDeletion: noop,
  upload: () => Promise.resolve({ url: "", publicId: "" }),
});

const ResetContext = createContext(0);
const EditVersionContext = createContext(0);

const StateContext = createContext<DraftBufferState>({
  changeSummary: () => ({
    autoTranslations: [],
    createdEntities: [],
    dismissals: [],
    imageSwaps: [],
    pendingDeletions: [],
    publishOverrides: [],
    selectionOverrides: [],
    reorderedEntityTypes: [],
    textEdits: [],
  }),
  hasChanges: false,
  save: () => Promise.resolve(),
  discard: noop,
});

async function saveEntityDeletions(
  buffer: Buffer,
  imageAssets: Assets,
  removeEntity: (ref: EntityRef) => Promise<unknown>
) {
  await imageAssets.savePendingDeletions();

  for (const ref of buffer.deletions()) {
    const result = await removeEntity(ref);
    if (ref.entityType === "project" && Array.isArray(result)) {
      for (const publicId of result) {
        await deleteCloudinaryImage(publicId);
      }
    }
  }
}

export function DraftBufferProvider({ children }: { children: ReactNode }) {
  const bufferRef = useRef<Buffer>(null as unknown as Buffer);
  const imageAssetsRef = useRef<Assets>(null as unknown as Assets);
  const sectionDataRef = useRef<
    Map<string, Record<string, Record<string, string>>>
  >(new Map());
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const [hasChanges, setHasChanges] = useState(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      bufferRef.current = createDraftBuffer(persisted.buffer);
      imageAssetsRef.current = createImageAssets(
        { upload: uploadImage, deleteAsset: deleteCloudinaryImage },
        persisted.imageAssets,
        persisted.pendingDeletionAssets
      );
      return (
        bufferRef.current.hasChanges() ||
        imageAssetsRef.current.trackedAssets().length > 0 ||
        imageAssetsRef.current.pendingDeletionAssets().length > 0
      );
    }
    bufferRef.current = createDraftBuffer();
    imageAssetsRef.current = createImageAssets({
      upload: uploadImage,
      deleteAsset: deleteCloudinaryImage,
    });
    return false;
  });

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
  const updateAchievement = useMutation(api.achievements.update);
  const removeAchievement = useMutation(api.achievements.remove);
  const removePhoto = useMutation(api.projectImages.remove);
  const reorderPhotos = useMutation(api.projectImages.reorder);
  const updateSocialLink = useMutation(api.socialLinks.update);
  const removeSocialLink = useMutation(api.socialLinks.remove);
  const reorderSocialLinks = useMutation(api.socialLinks.reorder);
  const createSelectedWorkWithOrder = useMutation(
    api.selectedWorks.createWithOrder
  );
  const removeSelectedWork = useMutation(api.selectedWorks.remove);
  const reorderSelectedWorks = useMutation(api.selectedWorks.reorder);
  const selectedWorks = useQuery(
    api.selectedWorks.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );

  const entityMutations = useMemo(
    () =>
      new Map<
        string,
        {
          update?: (args: never) => Promise<unknown>;
          remove: (args: { id: string }) => Promise<unknown>;
          reorder?: (args: { ids: string[] }) => Promise<unknown>;
        }
      >([
        [
          "project",
          {
            update: updateProject as never,
            remove: removeProject as never,
            reorder: reorderProjects as never,
          },
        ],
        [
          "post",
          {
            update: updateBlogPost as never,
            remove: removeBlogPost as never,
          },
        ],
        [
          "achievement",
          {
            update: updateAchievement as never,
            remove: removeAchievement as never,
          },
        ],
        [
          "photo",
          {
            remove: removePhoto as never,
            reorder: reorderPhotos as never,
          },
        ],
        [
          "social-link",
          {
            update: updateSocialLink as never,
            remove: removeSocialLink as never,
            reorder: reorderSocialLinks as never,
          },
        ],
        [
          "selectedWork",
          {
            remove: removeSelectedWork as never,
            reorder: reorderSelectedWorks as never,
          },
        ],
      ]),
    [
      updateProject,
      updateBlogPost,
      reorderProjects,
      removeProject,
      removeBlogPost,
      updateAchievement,
      removeAchievement,
      removePhoto,
      reorderPhotos,
      updateSocialLink,
      removeSocialLink,
      reorderSocialLinks,
      removeSelectedWork,
      reorderSelectedWorks,
    ]
  );

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      try {
        const state: PersistedState = {
          buffer: bufferRef.current.serialize(),
          imageAssets: imageAssetsRef.current.trackedAssets(),
          pendingDeletionAssets: imageAssetsRef.current.pendingDeletionAssets(),
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
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const removeEdit = useCallback(
    (section: string, field: string, locale: string) => {
      bufferRef.current.removeEdit(section, field, locale);
      setHasChanges(bufferRef.current.hasChanges());
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

  const trackPendingDeletion = useCallback(
    (publicId: string) => {
      imageAssetsRef.current.trackPendingDeletion(publicId);
      setHasChanges(true);
      schedulePersist();
    },
    [schedulePersist]
  );

  const cancelPendingDeletion = useCallback(
    (publicId: string) => {
      imageAssetsRef.current.cancelPendingDeletion(publicId);
      setHasChanges(
        bufferRef.current.hasChanges() ||
          imageAssetsRef.current.trackedAssets().length > 0 ||
          imageAssetsRef.current.pendingDeletionAssets().length > 0
      );
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

  const cancelCreation = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.cancelCreation(entityType, id);
      setHasChanges(bufferRef.current.hasChanges());
      schedulePersist();
    },
    [schedulePersist]
  );

  const trackDeletion = useCallback(
    (entityType: string, id: string) => {
      bufferRef.current.trackDeletion(entityType, id);
      if (entityType === "project" && selectedWorks) {
        for (const sw of selectedWorks) {
          if (sw.projectId === id) {
            bufferRef.current.trackDeletion("selectedWork", sw._id);
          }
        }
      }
      setHasChanges(true);
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist, selectedWorks]
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

  const dismiss = useCallback(
    (section: string, field: string, locale: string) => {
      bufferRef.current.dismiss(section, field, locale);
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

  const setSelectionOverride = useCallback(
    (projectId: string, selected: boolean) => {
      bufferRef.current.setSelectionOverride(projectId, selected);
      setHasChanges(true);
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const clearSelectionOverride = useCallback(
    (projectId: string) => {
      bufferRef.current.clearSelectionOverride(projectId);
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

  const markAutoTranslated = useCallback(
    (section: string, field: string, locale: string) => {
      bufferRef.current.markAutoTranslated(section, field, locale);
      setEditVersion((v) => v + 1);
      schedulePersist();
    },
    [schedulePersist]
  );

  const autoTranslate = useCallback(
    async (
      staleFields: { section: string; field: string; locale: string }[],
      translate: TranslateFn
    ) => {
      const result = await autoTranslateAll({
        staleFields,
        translate,
        resolveSourceText: (section, field, targetLocale) => {
          const sourceLocale = targetLocale === "en" ? "it" : "en";
          const drafted = bufferRef.current.read(section, field, sourceLocale);
          if (drafted !== undefined) {
            return { text: drafted, sourceLocale };
          }
          const original = allContent?.find((c) => c.section === section)
            ?.content[field];
          const text = original?.[sourceLocale as "en" | "it"];
          if (text === undefined) {
            return;
          }
          return { text, sourceLocale };
        },
        writeTranslation: (section, field, locale, value) => {
          bufferRef.current.write(section, field, locale, value);
        },
        markAutoTranslated: (section, field, locale) => {
          bufferRef.current.markAutoTranslated(section, field, locale);
        },
      });
      if (result.translated.length > 0) {
        setHasChanges(true);
        setEditVersion((v) => v + 1);
        schedulePersist();
      }
      return result;
    },
    [allContent, schedulePersist]
  );

  const removeEntity = useCallback(
    (ref: EntityRef): Promise<unknown> => {
      const mutations = entityMutations.get(ref.entityType);
      if (mutations) {
        return mutations.remove({ id: ref.id });
      }
      return Promise.resolve();
    },
    [entityMutations]
  );

  const saveSections = useCallback(
    async (buffer: Buffer) => {
      const grouped = buffer.changes();

      for (const [sectionName, fields] of grouped) {
        const route = routeSection(sectionName);

        if (route.kind === "entity") {
          const mutations = entityMutations.get(route.descriptor.type);
          if (mutations?.update) {
            const existingData = sectionDataRef.current.get(sectionName);
            const updates = route.descriptor.buildUpdates
              ? route.descriptor.buildUpdates(fields, existingData)
              : buildEntityUpdates(
                  fields,
                  route.descriptor.localized,
                  existingData
                );
            await mutations.update({ id: route.id, ...updates } as never);
          }
        } else {
          const existing =
            allContent?.find((c) => c.section === sectionName)?.content ?? {};
          await upsertSiteContent({
            section: sectionName,
            content: mergeSiteContent(fields, existing),
          });
        }
      }
    },
    [allContent, upsertSiteContent, entityMutations]
  );

  const saveSelectionOverrides = useCallback(
    async (buffer: Buffer) => {
      for (const ovr of buffer.selectionOverrides()) {
        if (ovr.selected) {
          const reorderList = buffer.getReorderList("selectedWork");
          const order = reorderList ? reorderList.length : 0;
          await createSelectedWorkWithOrder({
            projectId: ovr.projectId as never,
            order,
          });
        } else if (selectedWorks) {
          const sw = selectedWorks.find((s) => s.projectId === ovr.projectId);
          if (sw) {
            await removeSelectedWork({ id: sw._id });
          }
        }
      }
    },
    [createSelectedWorkWithOrder, removeSelectedWork, selectedWorks]
  );

  const save = useCallback(async () => {
    await saveSections(bufferRef.current);

    for (const ovr of bufferRef.current.publishOverrides()) {
      const mutations = entityMutations.get(ovr.entityType);
      if (mutations?.update) {
        await mutations.update({
          id: ovr.id,
          published: ovr.published,
        } as never);
      }
    }

    await saveSelectionOverrides(bufferRef.current);

    const pendingDeletionIds = new Set(
      bufferRef.current.deletions().map((d) => d.id)
    );
    for (const [entityType, mutations] of entityMutations) {
      const reorderList = bufferRef.current.getReorderList(entityType);
      if (mutations.reorder && reorderList) {
        const ids = reorderList.filter((id) => !pendingDeletionIds.has(id));
        await mutations.reorder({ ids } as never);
      }
    }

    await saveEntityDeletions(
      bufferRef.current,
      imageAssetsRef.current,
      removeEntity
    );

    await imageAssetsRef.current.savePendingDeletions();
    bufferRef.current.discard();
    imageAssetsRef.current.clearTracked();
    setHasChanges(false);
    setEditVersion((v) => v + 1);
    setResetSignal((v) => v + 1);
    clearPersistedState();
  }, [saveSections, entityMutations, removeEntity, saveSelectionOverrides]);

  const discard = useCallback(async () => {
    await imageAssetsRef.current.cleanup();
    imageAssetsRef.current.clearPendingDeletions();

    for (const ref of bufferRef.current.creations()) {
      await removeEntity(ref);
    }

    bufferRef.current.discard();
    setHasChanges(false);
    setEditVersion((v) => v + 1);
    setResetSignal((v) => v + 1);
    clearPersistedState();
  }, [removeEntity]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editVersion forces fresh read from buffer ref so React Compiler cannot cache stale return values
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
      publishOverrides: textSummary.publishOverrides,
      selectionOverrides: textSummary.selectionOverrides,
      reorderedEntityTypes: textSummary.reorderedEntityTypes,
      dismissals: textSummary.dismissals,
      autoTranslations: textSummary.autoTranslations,
    };
  }, [allContent, editVersion]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editVersion forces new read-function identities so React Compiler cannot cache stale return values
  const ops = useMemo(
    () => ({
      autoTranslate,
      cancelCreation,
      cancelDeletion,
      clearPublishOverride,
      clearSelectionOverride,
      dismiss,
      editedLocales: ((section: string, field: string) =>
        bufferRef.current.editedLocales(
          section,
          field
        )) as Buffer["editedLocales"],
      fieldStatus: (
        section: string,
        field: string,
        locale: string
      ): FieldStatus => {
        if (bufferRef.current.isDismissed(section, field, locale)) {
          return "dismissed";
        }
        if (bufferRef.current.isAutoTranslated(section, field, locale)) {
          return "system-filled";
        }
        const edited = bufferRef.current.editedLocales(section, field);
        if (
          !edited.has(locale) &&
          locales.some((l) => l !== locale && edited.has(l))
        ) {
          return "stale";
        }
        return "fresh";
      },
      getPublishOverride: (entityType: string, id: string) =>
        bufferRef.current.getPublishOverride(entityType, id),
      getReorderList: (entityType: string) =>
        bufferRef.current.getReorderList(entityType),
      getSelectionOverride: (projectId: string) =>
        bufferRef.current.getSelectionOverride(projectId),
      isAutoTranslated: (section: string, field: string, locale: string) =>
        bufferRef.current.isAutoTranslated(section, field, locale),
      isDismissed: (section: string, field: string, locale: string) =>
        bufferRef.current.isDismissed(section, field, locale),
      isPendingDeletion: (entityType: string, id: string) =>
        bufferRef.current.isPendingDeletion(entityType, id),
      isSessionCreated: (entityType: string, id: string) =>
        bufferRef.current.isSessionCreated(entityType, id),
      markAutoTranslated,
      read: ((section: string, field: string, locale: string) =>
        bufferRef.current.read(section, field, locale)) as Buffer["read"],
      registerSectionData: (
        section: string,
        data: Record<string, Record<string, string>>
      ) => {
        sectionDataRef.current.set(section, data);
      },
      removeEdit,
      sectionChanges: ((section: string) =>
        bufferRef.current.sectionChanges(section)) as Buffer["sectionChanges"],
      setPublishOverride,
      setReorderList,
      setSelectionOverride,
      trackCreation,
      trackDeletion,
      write,
    }),
    [
      editVersion,
      autoTranslate,
      cancelCreation,
      cancelDeletion,
      clearPublishOverride,
      clearSelectionOverride,
      dismiss,
      markAutoTranslated,
      removeEdit,
      setPublishOverride,
      setReorderList,
      setSelectionOverride,
      trackCreation,
      trackDeletion,
      write,
    ]
  );

  const imageOps = useMemo(
    () => ({
      cancelPendingDeletion,
      trackAsset,
      trackPendingDeletion,
      upload: uploadAsset,
    }),
    [cancelPendingDeletion, trackAsset, trackPendingDeletion, uploadAsset]
  );

  const state = useMemo(
    () => ({
      changeSummary,
      hasChanges,
      save,
      discard,
    }),
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
