import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  };
}

export default async function EssencePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EssenceClient />;
}
