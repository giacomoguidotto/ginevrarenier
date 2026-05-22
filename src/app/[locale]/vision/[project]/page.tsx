import { setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { ProjectPageClient } from "./project-page-client";

interface Props {
  params: Promise<{ locale: string; project: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageBoundary page="project">
      <ProjectPageClient />
    </PageBoundary>
  );
}
