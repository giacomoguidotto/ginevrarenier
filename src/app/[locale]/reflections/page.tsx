import { api } from "convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { localePath, locales } from "@/i18n/config";
import { BreadcrumbJsonLd } from "@/lib/seo";
import { ReflectionsClient } from "./reflections-client";

interface Props {
  params: Promise<{ locale: string }>;
}

const baseUrl = "https://ginevrarenier.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata.reflections",
  });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}${localePath(locale, "/reflections")}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}${localePath(l, "/reflections")}`])
      ),
    },
  };
}

export default async function ReflectionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const preloadedPosts = await preloadQuery(api.blogPosts.listPublished, {});

  return (
    <PageBoundary page="reflections">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: localePath(locale) || "/" },
          {
            name: locale === "it" ? "Riflessioni" : "Reflections",
            href: localePath(locale, "/reflections"),
          },
        ]}
      />
      <ReflectionsClient preloadedPosts={preloadedPosts} />
    </PageBoundary>
  );
}
