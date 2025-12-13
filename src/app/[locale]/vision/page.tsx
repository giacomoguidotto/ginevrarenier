import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { PageTransition } from "@/components/layout/page-transition";
import { projects } from "@/lib/projects";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.vision" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function VisionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vision");

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-cream/60 text-sm uppercase tracking-widest">
              {t("label")}
            </p>
            <h1 className="mb-6 text-cream">{t("title")}</h1>
            <p className="text-lg text-muted-foreground">{t("description")}</p>
          </div>

          {/* Projects Grid */}
          <ProjectGrid projects={projects} />
        </div>
      </div>
    </PageTransition>
  );
}
