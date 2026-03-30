"use client";

import { AnimationReadyProvider } from "@/components/admin/animation-ready-context";
import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";

const SECTION_COUNT = 3;

export function HomeClient() {
  return (
    <AnimationReadyProvider expectedCount={SECTION_COUNT}>
      <Hero />
      <IntroSection />
      <FeaturedWork />
    </AnimationReadyProvider>
  );
}
