import { setRequestLocale } from "next-intl/server";
import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <IntroSection />
      <FeaturedWork />
    </>
  );
}
