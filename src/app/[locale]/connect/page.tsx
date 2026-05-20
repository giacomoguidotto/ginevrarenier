import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { ConnectClient } from "./connect-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.connect" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ConnectPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageBoundary page="connect">
      <ConnectClient />
    </PageBoundary>
  );
}
