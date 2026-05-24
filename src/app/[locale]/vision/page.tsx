import { api } from "convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
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
      canonical: `${baseUrl}/${locale}/vision`,
      languages: {
        en: `${baseUrl}/en/vision`,
        it: `${baseUrl}/it/vision`,
      },
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
          { name: "Home", href: `/${locale}` },
          { name: "Vision", href: `/${locale}/vision` },
        ]}
      />
      <VisionClient preloadedProjects={preloadedProjects} />
    </PageBoundary>
  );
}
