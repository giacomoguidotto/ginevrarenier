"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useRef } from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import { useDraftBufferOps } from "@/components/admin/draft-buffer-context";
import { EditableImage } from "@/components/admin/editable-image";
import { Field } from "@/components/admin/field";
import { Section, useSection } from "@/components/admin/section";
import { Link } from "@/i18n/routing";

export function IntroSection() {
  return (
    <Section name="intro">
      <ChromeEnablerProvider>
        <IntroSectionContent />
      </ChromeEnablerProvider>
    </Section>
  );
}

function IntroSectionContent() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const { data } = useSection();
  const { write } = useDraftBufferOps();
  const { enable } = useChromeEnabler();
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const portraitUrl = data?.portraitImage?.en || undefined;
  const handlePortraitUpload = useCallback(
    (url: string) => {
      write("intro", "portraitImage", "en", url);
      write("intro", "portraitImage", "it", url);
    },
    [write]
  );

  return (
    <section
      className="relative bg-charcoal py-32 text-cream"
      data-testid="intro-section"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Text Content */}
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <Field
              as="p"
              className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
              name="label"
            />
            <Field as="h2" className="mb-8 text-cream" multiline name="title" />
            <Field
              as="p"
              className="text-cream/70 text-lg"
              multiline
              name="bio"
            />
            <div className="mt-10">
              <Link
                className="group inline-flex items-center gap-2 text-cream text-sm uppercase tracking-widest transition-colors hover:text-cream/70"
                href="/essence"
                ref={ctaRef}
              >
                <Field as="span" containerRef={ctaRef} name="cta" />
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            className="relative z-[1] aspect-3/4 overflow-hidden rounded-lg lg:aspect-auto lg:h-[600px]"
            initial={{ opacity: 0, x: 50 }}
            onAnimationComplete={enable}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <motion.div
              className="relative h-full w-full"
              style={{ y: imageY }}
            >
              <EditableImage
                alt="Ginevra Renier"
                folder="ginevrarenier/site"
                onUpload={handlePortraitUpload}
                sizes="(max-width: 1024px) 100vw, 50vw"
                src={portraitUrl}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
