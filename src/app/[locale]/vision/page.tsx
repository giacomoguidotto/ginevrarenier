import { api } from "convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { localePath, locales } from "@/i18n/config";
import { BreadcrumbJsonLd } from "@/lib/seo";
import { VisionClient } from "./vision-client";

interface Props {
  params: Promise<{ locale: string }>;
}

const baseUrl = "https://ginevrarenier.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.vision" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}${localePath(locale, "/vision")}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}${localePath(l, "/vision")}`])
      ),
    },
  };
}

export default async function VisionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const preloadedProjects = await preloadQuery(api.projects.listPublished, {});

  return (
    <PageBoundary page="vision">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: localePath(locale) || "/" },
          { name: "Vision", href: localePath(locale, "/vision") },
        ]}
      />
      <VisionClient preloadedProjects={preloadedProjects} />
    </PageBoundary>
  );
}
