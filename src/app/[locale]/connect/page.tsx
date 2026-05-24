import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { BreadcrumbJsonLd } from "@/lib/seo";
import { ConnectClient } from "./connect-client";

interface Props {
  params: Promise<{ locale: string }>;
}

const baseUrl = "https://ginevrarenier.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.connect" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}/connect`,
      languages: {
        en: `${baseUrl}/en/connect`,
        it: `${baseUrl}/it/connect`,
      },
    },
  };
}

export default async function ConnectPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageBoundary page="connect">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: `/${locale}` },
          {
            name: locale === "it" ? "Contatti" : "Connect",
            href: `/${locale}/connect`,
          },
        ]}
      />
      <ConnectClient />
    </PageBoundary>
  );
}
