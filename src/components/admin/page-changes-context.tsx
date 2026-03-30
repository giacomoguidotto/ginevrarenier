"use client";

import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface SiteContentChange {
  content: Record<string, { en: string; it: string }>;
  section: string;
  type: "siteContent";
}

interface ProjectChange {
  fields: Record<string, unknown>;
  id: string;
  type: "project";
}

interface SocialLinkChange {
  fields: Record<string, unknown>;
  id: string;
  type: "socialLink";
}

type Change = SiteContentChange | ProjectChange | SocialLinkChange;

interface PageChangesContextValue {
  discard: () => void;
  editedLocales: Set<string>;
  getFieldEditedLocales: (section: string, key: string) => Set<string>;
  getSiteContentDraft: (
    section: string,
    key: string
  ) => { en: string; it: string } | undefined;
  hasChanges: boolean;
  save: () => Promise<void>;
  trackSiteContent: (
    section: string,
    key: string,
    value: { en: string; it: string },
    editedLocale: string
  ) => void;
  trackUploadedAsset: (publicId: string) => void;
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};
const emptySet = new Set<string>();

const PageChangesContext = createContext<PageChangesContextValue>({
  hasChanges: false,
  editedLocales: emptySet,
  trackSiteContent: noop,
  trackUploadedAsset: noop,
  getSiteContentDraft: noop as () => undefined,
  getFieldEditedLocales: () => emptySet,
  save: () => Promise.resolve(),
  discard: noop,
});

export function PageChangesProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [editedLocales, setEditedLocales] = useState<Set<string>>(new Set());
  // Tracks which locales were edited per field: "section:key" → Set<locale>
  const [fieldLocales, setFieldLocales] = useState<Map<string, Set<string>>>(
    new Map()
  );
  // Cloudinary public IDs uploaded during this edit session
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const upsertSiteContent = useMutation(api.siteContent.upsert);

  const trackSiteContent = useCallback(
    (
      section: string,
      key: string,
      newValue: { en: string; it: string },
      editedLocale: string
    ) => {
      setEditedLocales((prev) => {
        if (prev.has(editedLocale)) {
          return prev;
        }
        return new Set([...prev, editedLocale]);
      });

      const fieldKey = `${section}:${key}`;
      setFieldLocales((prev) => {
        const existing = prev.get(fieldKey);
        if (existing?.has(editedLocale)) {
          return prev;
        }
        const next = new Map(prev);
        next.set(fieldKey, new Set([...(existing ?? []), editedLocale]));
        return next;
      });

      setChanges((prev) => {
        const existing = prev.find(
          (c): c is SiteContentChange =>
            c.type === "siteContent" && c.section === section
        );

        if (existing) {
          return prev.map((c) =>
            c === existing
              ? {
                  ...existing,
                  content: { ...existing.content, [key]: newValue },
                }
              : c
          );
        }

        return [
          ...prev,
          { type: "siteContent", section, content: { [key]: newValue } },
        ];
      });
    },
    []
  );

  const getSiteContentDraft = useCallback(
    (section: string, key: string) => {
      const change = changes.find(
        (c): c is SiteContentChange =>
          c.type === "siteContent" && c.section === section
      );
      return change?.content[key];
    },
    [changes]
  );

  const getFieldEditedLocales = useCallback(
    (section: string, key: string): Set<string> =>
      fieldLocales.get(`${section}:${key}`) ?? emptySet,
    [fieldLocales]
  );

  const trackUploadedAsset = useCallback((publicId: string) => {
    setUploadedAssets((prev) => [...prev, publicId]);
  }, []);

  const save = useCallback(async () => {
    for (const change of changes) {
      if (change.type === "siteContent") {
        await upsertSiteContent({
          section: change.section,
          content: JSON.stringify(change.content),
        });
      }
    }
    setChanges([]);
    setEditedLocales(new Set());
    setFieldLocales(new Map());
    setUploadedAssets([]);
  }, [changes, upsertSiteContent]);

  const discard = useCallback(async () => {
    // Delete uploaded Cloudinary assets that won't be saved
    for (const publicId of uploadedAssets) {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
    }
    setChanges([]);
    setEditedLocales(new Set());
    setFieldLocales(new Map());
    setUploadedAssets([]);
  }, [uploadedAssets]);

  const value = useMemo(
    () => ({
      hasChanges: changes.length > 0 || uploadedAssets.length > 0,
      editedLocales,
      trackSiteContent,
      trackUploadedAsset,
      getSiteContentDraft,
      getFieldEditedLocales,
      save,
      discard,
    }),
    [
      changes.length,
      uploadedAssets.length,
      editedLocales,
      trackSiteContent,
      trackUploadedAsset,
      getSiteContentDraft,
      getFieldEditedLocales,
      save,
      discard,
    ]
  );

  return <PageChangesContext value={value}>{children}</PageChangesContext>;
}

export function usePageChanges() {
  return useContext(PageChangesContext);
}
