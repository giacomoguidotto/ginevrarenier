"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useCallback, useRef } from "react";
import { Field } from "@/components/admin/field";
import {
  FieldVisibilityProvider,
  useFieldVisibility,
} from "@/components/admin/field-visibility";
import { Section } from "@/components/admin/section";
import { useSectionLines } from "@/components/admin/use-section-lines";
import { Link } from "@/i18n/routing";

export function Hero() {
  return (
    <FieldVisibilityProvider>
      <HeroContent />
    </FieldVisibilityProvider>
  );
}

function HeroContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { onSectionReady } = useSectionLines(containerRef);
  const { markVisible } = useFieldVisibility();

  const handleAnimationComplete = useCallback(() => {
    onSectionReady();
    markVisible();
  }, [onSectionReady, markVisible]);

  return (
    <Section name="hero">
      <section
        className="relative h-screen w-full overflow-hidden"
        ref={containerRef}
      >
        {/* Background with subtle spotlight */}
        <motion.div className="absolute inset-0 z-0" style={{ y, scale }}>
          <div className="absolute inset-0 bg-background" />
          <div
            className="absolute top-1/3 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[120px]"
            style={{
              background: "radial-gradient(circle, #555 0%, transparent 70%)",
            }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          className="relative z-10 flex h-full flex-col items-center justify-center px-6"
          style={{ opacity }}
        >
          <div className="max-w-5xl text-center">
            {/* Tagline */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Field
                as="p"
                className="mb-6 text-foreground/80 text-sm uppercase tracking-[0.3em]"
                name="tagline"
              />
            </motion.div>

            {/* Main Heading */}
            <div className="overflow-hidden">
              <motion.h1
                animate={{ y: 0 }}
                className="mb-8 font-light leading-[0.9]"
                initial={{ y: "150%" }}
                transition={{
                  duration: 1,
                  delay: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Field as="span" className="hero-title block" name="title" />
              </motion.h1>
            </div>

            {/* Subheading */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Field
                as="p"
                className="mx-auto mb-12 max-w-xl text-lg text-muted-foreground"
                name="description"
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              onAnimationComplete={handleAnimationComplete}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <Link
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary bg-primary px-8 py-4 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground"
                href="/vision"
              >
                <Field as="span" className="relative z-10" name="cta" />
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-8 py-4 font-medium text-foreground text-sm uppercase tracking-widest transition-all hover:border-foreground hover:bg-foreground/10"
                href="/connect"
              >
                <Field as="span" name="ctaSecondary" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>
    </Section>
  );
}
