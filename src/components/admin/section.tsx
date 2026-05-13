"use client";

import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

interface SectionContextValue {
  data: Record<string, { en: string; it: string }> | undefined;
  name: string;
}

const SectionContext = createContext<SectionContextValue>({
  name: "",
  data: undefined,
});

export function Section({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const result = useQuery(api.siteContent.getBySection, { section: name });
  return (
    <SectionContext value={{ name, data: result?.content }}>
      {children}
    </SectionContext>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
