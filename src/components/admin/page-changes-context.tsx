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
  trackSiteContent: (
    section: string,
    key: string,
    value: { en: string; it: string }
  ) => void;
  getSiteContentDraft: (
    section: string,
    key: string
  ) => { en: string; it: string } | undefined;
  save: () => Promise<void>;
  discard: () => void;
};

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};

const PageChangesContext = createContext<PageChangesContextValue>({
  hasChanges: false,
  trackSiteContent: noop,
  getSiteContentDraft: noop as () => undefined,
  save: () => Promise.resolve(),
  discard: noop,
});

export function PageChangesProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<Change[]>([]);
  const upsertSiteContent = useMutation(api.siteContent.upsert);

  const trackSiteContent = useCallback(
    (section: string, key: string, newValue: { en: string; it: string }) => {
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

  const save = useCallback(async () => {
    for (const change of changes) {
      if (change.type === "siteContent") {
        // Merge with existing content by upserting
        await upsertSiteContent({
          section: change.section,
          content: JSON.stringify(change.content),
        });
      }
    }
    setChanges([]);
  }, [changes, upsertSiteContent]);

  const discard = useCallback(() => {
    setChanges([]);
  }, []);

  const value = useMemo(
    () => ({
      hasChanges: changes.length > 0,
      trackSiteContent,
      getSiteContentDraft,
      save,
      discard,
    }),
    [changes.length, trackSiteContent, getSiteContentDraft, save, discard]
  );

  return <PageChangesContext value={value}>{children}</PageChangesContext>;
}

export function usePageChanges() {
  return useContext(PageChangesContext);
}
