import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { BreadcrumbJsonLd } from "@/lib/seo";
import { EssenceClient } from "./essence-client";

interface Props {
  params: Promise<{ locale: string }>;
}

const baseUrl = "https://ginevrarenier.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.essence" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}/essence`,
      languages: {
        en: `${baseUrl}/en/essence`,
        it: `${baseUrl}/it/essence`,
      },
    },
  };
}

export default async function EssencePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageBoundary page="essence">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: `/${locale}` },
          {
            name: locale === "it" ? "Essenza" : "Essence",
            href: `/${locale}/essence`,
          },
        ]}
      />
      <EssenceClient />
    </PageBoundary>
  );
}
