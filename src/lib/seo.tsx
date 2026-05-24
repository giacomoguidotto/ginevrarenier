// biome-ignore-all lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML — data is from our own schema objects, never user input.
import type { Locale } from "@/i18n/config";

const baseUrl = "https://ginevrarenier.com";

const hrefPrefixes: Record<string, string> = {
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
  linkedin: "https://www.linkedin.com/in/",
  facebook: "https://www.facebook.com/",
  tiktok: "https://www.tiktok.com/@",
  youtube: "https://www.youtube.com/@",
  pinterest: "https://www.pinterest.com/",
  threads: "https://www.threads.net/@",
  bluesky: "https://bsky.app/profile/",
  telegram: "https://t.me/",
  behance: "https://www.behance.net/",
  dribbble: "https://dribbble.com/",
  artstation: "https://www.artstation.com/",
  deviantart: "https://www.deviantart.com/",
  unsplash: "https://unsplash.com/@",
  vimeo: "https://vimeo.com/",
};

export function socialLinkToUrl(
  platform: string,
  handle: string | undefined
): string | null {
  if (!handle) {
    return null;
  }
  if (platform === "email") {
    return `mailto:${handle}`;
  }
  if (platform === "website") {
    return handle;
  }
  const prefix = hrefPrefixes[platform];
  if (prefix) {
    return `${prefix}${handle}`;
  }
  return null;
}

interface WebSiteJsonLdProps {
  locale: Locale;
}

export function WebSiteJsonLd({ locale }: WebSiteJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ginevra Renier Studio",
    url: baseUrl,
    inLanguage: [locale === "it" ? "it-IT" : "en-US"],
    alternateName: "Ginevra Renier Photography",
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      type="application/ld+json"
    />
  );
}

interface PersonJsonLdProps {
  locale: Locale;
  socialUrls: string[];
}

export function PersonJsonLd({ locale, socialUrls }: PersonJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Ginevra Renier",
    jobTitle: "Photographer",
    url: `${baseUrl}/${locale}`,
    sameAs: socialUrls,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      type="application/ld+json"
    />
  );
}

interface BreadcrumbItem {
  href: string;
  name: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${baseUrl}${item.href}`,
    })),
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      type="application/ld+json"
    />
  );
}

interface BlogPostingJsonLdProps {
  coverImageUrl?: string;
  datePublished?: string;
  description: string;
  locale: Locale;
  title: string;
  url: string;
}

export function BlogPostingJsonLd({
  title,
  description,
  url,
  datePublished,
  coverImageUrl,
  locale,
}: BlogPostingJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: url.startsWith("http") ? url : `${baseUrl}${url}`,
    inLanguage: locale === "it" ? "it-IT" : "en-US",
    author: {
      "@type": "Person",
      name: "Ginevra Renier",
      url: baseUrl,
    },
    publisher: {
      "@type": "Person",
      name: "Ginevra Renier",
      url: baseUrl,
    },
    ...(datePublished ? { datePublished } : {}),
    ...(coverImageUrl ? { image: coverImageUrl } : {}),
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      type="application/ld+json"
    />
  );
}

interface ImageGalleryJsonLdProps {
  description: string;
  imageUrls: string[];
  locale: Locale;
  name: string;
  url: string;
}

export function ImageGalleryJsonLd({
  name,
  description,
  url,
  imageUrls,
  locale,
}: ImageGalleryJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name,
    description,
    url: url.startsWith("http") ? url : `${baseUrl}${url}`,
    inLanguage: locale === "it" ? "it-IT" : "en-US",
    author: {
      "@type": "Person",
      name: "Ginevra Renier",
      url: baseUrl,
    },
    image: imageUrls.map((imageUrl) => ({
      "@type": "ImageObject",
      url: imageUrl,
      creator: {
        "@type": "Person",
        name: "Ginevra Renier",
      },
    })),
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      type="application/ld+json"
    />
  );
}
