import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";
import { Testimonial } from "@/components/home/testimonial";

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <FeaturedWork />
      <Testimonial />
    </>
  );
}
