"use client";

import { usePathname } from "@/i18n/routing";
import { useChromeDismount } from "./chrome-context";

export function ChromeDismountOnNavigate() {
  useChromeDismount(usePathname());
  return null;
}
