import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReflectionsClient } from "./reflections-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata.reflections",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ReflectionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReflectionsClient />;
}
