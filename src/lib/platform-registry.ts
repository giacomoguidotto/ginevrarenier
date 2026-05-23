import type { LucideIcon } from "lucide-react";
import { getSocialIcon } from "./social-icons";

export const platformKeys = [
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
  "telegram",
  "behance",
  "dribbble",
  "artstation",
  "deviantart",
  "unsplash",
  "vimeo",
  "email",
  "website",
] as const;

export type PlatformKey = (typeof platformKeys)[number];

interface PlatformEntry {
  displayFormat: string;
  hrefTemplate: string;
  key: PlatformKey;
  label: string;
  validate: (handle: string) => boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRegex = /^https?:\/\/.+/;
const mailtoRegex = /^mailto:/i;
const leadingAtRegex = /^@/;
const trailingSlashRegex = /\/$/;

const registry: Record<PlatformKey, PlatformEntry> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    hrefTemplate: "https://www.instagram.com/{handle}/",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  x: {
    key: "x",
    label: "X",
    hrefTemplate: "https://x.com/{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    hrefTemplate: "https://www.linkedin.com/in/{handle}/",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    hrefTemplate: "https://www.facebook.com/{handle}/",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    hrefTemplate: "https://www.tiktok.com/@{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    hrefTemplate: "https://www.youtube.com/@{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  pinterest: {
    key: "pinterest",
    label: "Pinterest",
    hrefTemplate: "https://www.pinterest.com/{handle}/",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  threads: {
    key: "threads",
    label: "Threads",
    hrefTemplate: "https://www.threads.net/@{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  bluesky: {
    key: "bluesky",
    label: "Bluesky",
    hrefTemplate: "https://bsky.app/profile/{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  telegram: {
    key: "telegram",
    label: "Telegram",
    hrefTemplate: "https://t.me/{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  behance: {
    key: "behance",
    label: "Behance",
    hrefTemplate: "https://www.behance.net/{handle}",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  dribbble: {
    key: "dribbble",
    label: "Dribbble",
    hrefTemplate: "https://dribbble.com/{handle}",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  artstation: {
    key: "artstation",
    label: "ArtStation",
    hrefTemplate: "https://www.artstation.com/{handle}",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  deviantart: {
    key: "deviantart",
    label: "DeviantArt",
    hrefTemplate: "https://www.deviantart.com/{handle}",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  unsplash: {
    key: "unsplash",
    label: "Unsplash",
    hrefTemplate: "https://unsplash.com/@{handle}",
    displayFormat: "@{handle}",
    validate: (h) => h.trim().length > 0,
  },
  vimeo: {
    key: "vimeo",
    label: "Vimeo",
    hrefTemplate: "https://vimeo.com/{handle}",
    displayFormat: "{handle}",
    validate: (h) => h.trim().length > 0,
  },
  email: {
    key: "email",
    label: "Email",
    hrefTemplate: "mailto:{handle}",
    displayFormat: "{handle}",
    validate: (h) => emailRegex.test(h.trim()),
  },
  website: {
    key: "website",
    label: "Website",
    hrefTemplate: "{handle}",
    displayFormat: "{handle}",
    validate: (h) => urlRegex.test(h.trim()),
  },
};

export function getPlatformEntry(platform: string): PlatformEntry | undefined {
  return registry[platform as PlatformKey];
}

export function getHref(platform: string, handle: string): string {
  const entry = registry[platform as PlatformKey];
  if (!entry) {
    return handle;
  }
  return entry.hrefTemplate.replace("{handle}", handle);
}

export function getDisplayValue(platform: string, handle: string): string {
  const entry = registry[platform as PlatformKey];
  if (!entry) {
    return handle;
  }
  return entry.displayFormat.replace("{handle}", handle);
}

export function getLabel(platform: string): string {
  const entry = registry[platform as PlatformKey];
  return entry?.label ?? platform;
}

export function getIcon(platform: string): LucideIcon {
  return getSocialIcon(platform);
}

export function validateHandle(platform: string, handle: string): boolean {
  const entry = registry[platform as PlatformKey];
  if (!entry) {
    return handle.trim().length > 0;
  }
  return entry.validate(handle);
}

export function extractHandleFromHref(platform: string, href: string): string {
  const entry = registry[platform as PlatformKey];
  if (!entry) {
    return href;
  }

  if (platform === "email") {
    return href.replace(mailtoRegex, "");
  }
  if (platform === "website") {
    return href;
  }

  const templatePrefix = entry.hrefTemplate.split("{handle}")[0];
  const templateSuffix = entry.hrefTemplate.split("{handle}")[1] ?? "";

  let handle = href;
  if (handle.startsWith(templatePrefix)) {
    handle = handle.slice(templatePrefix.length);
  }
  if (templateSuffix && handle.endsWith(templateSuffix)) {
    handle = handle.slice(0, -templateSuffix.length);
  }
  handle = handle.replace(leadingAtRegex, "");
  handle = handle.replace(trailingSlashRegex, "");

  return handle || href;
}

export function getHrefTemplateParts(platform: string): {
  prefix: string;
  suffix: string;
} {
  const entry = registry[platform as PlatformKey];
  if (!entry) {
    return { prefix: "", suffix: "" };
  }
  const [prefix, suffix] = entry.hrefTemplate.split("{handle}");
  return { prefix: prefix ?? "", suffix: suffix ?? "" };
}
