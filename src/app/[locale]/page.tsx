"use client";

import { AnimationReadyProvider } from "@/components/admin/animation-ready-context";
import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";

// 3 sections: Hero, IntroSection, FeaturedWork
const SECTION_COUNT = 3;

export default function HomePage() {
  return (
    <AnimationReadyProvider expectedCount={SECTION_COUNT}>
      <Hero />
      <IntroSection />
      <FeaturedWork />
    </AnimationReadyProvider>
  );
}
