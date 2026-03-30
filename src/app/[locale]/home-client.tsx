"use client";

import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";

export function HomeClient() {
  return (
    <>
      <Hero />
      <IntroSection />
      <FeaturedWork />
    </>
  );
}
