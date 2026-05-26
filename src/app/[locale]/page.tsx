import { setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";
import { SelectedWorks } from "@/components/home/selected-works";
import { Testimonial } from "@/components/home/testimonial";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageBoundary page="home">
      <Hero />
      <IntroSection />
      <SelectedWorks />
      <Testimonial />
    </PageBoundary>
  );
}
