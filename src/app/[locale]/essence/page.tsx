import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { localePath } from "@/i18n/config";
import { BreadcrumbJsonLd } from "@/lib/seo";
import { canonicalUrl, languageAlternates } from "@/lib/seo-url";
import { EssenceClient } from "./essence-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.essence" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl(locale, "/essence"),
      languages: languageAlternates("/essence"),
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
          { name: "Home", href: localePath(locale) || "/" },
          {
            name: locale === "it" ? "Essenza" : "Essence",
            href: localePath(locale, "/essence"),
          },
        ]}
      />
      <EssenceClient />
    </PageBoundary>
  );
}
