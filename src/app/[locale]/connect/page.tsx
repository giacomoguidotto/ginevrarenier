import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { localePath, locales } from "@/i18n/config";
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
      canonical: `${baseUrl}${localePath(locale, "/connect")}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}${localePath(l, "/connect")}`])
      ),
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
          { name: "Home", href: localePath(locale) || "/" },
          {
            name: locale === "it" ? "Contatti" : "Connect",
            href: localePath(locale, "/connect"),
          },
        ]}
      />
      <ConnectClient />
    </PageBoundary>
  );
}
