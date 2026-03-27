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

type SiteContentChange = {
  type: "siteContent";
  section: string;
  content: Record<string, { en: string; it: string }>;
};

type ProjectChange = {
  type: "project";
  id: string;
  fields: Record<string, unknown>;
};

type SocialLinkChange = {
  type: "socialLink";
  id: string;
  fields: Record<string, unknown>;
};

type Change = SiteContentChange | ProjectChange | SocialLinkChange;

type PageChangesContextValue = {
  hasChanges: boolean;
  editedLocales: Set<string>;
  trackSiteContent: (
    section: string,
    key: string,
    value: { en: string; it: string },
    editedLocale: string
  ) => void;
  getSiteContentDraft: (
    section: string,
    key: string
  ) => { en: string; it: string } | undefined;
  getFieldEditedLocales: (section: string, key: string) => Set<string>;
  save: () => Promise<void>;
  discard: () => void;
};

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};
const emptySet = new Set<string>();

const PageChangesContext = createContext<PageChangesContextValue>({
  hasChanges: false,
  editedLocales: emptySet,
  trackSiteContent: noop,
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
  }, [changes, upsertSiteContent]);

  const discard = useCallback(() => {
    setChanges([]);
    setEditedLocales(new Set());
    setFieldLocales(new Map());
  }, []);

  const value = useMemo(
    () => ({
      hasChanges: changes.length > 0,
      editedLocales,
      trackSiteContent,
      getSiteContentDraft,
      getFieldEditedLocales,
      save,
      discard,
    }),
    [
      changes.length,
      editedLocales,
      trackSiteContent,
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
