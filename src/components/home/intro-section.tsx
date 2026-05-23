"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useRef } from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import {
  useDraftBufferOps,
  useImageAssets,
} from "@/components/admin/draft-buffer-context";
import { EditableImage } from "@/components/admin/editable-image";
import { Field } from "@/components/admin/field";
import { usePageBoundaryRegistration } from "@/components/admin/page-boundary";
import { Section, useSection } from "@/components/admin/section";
import { Link } from "@/i18n/routing";
import { cloudinaryFolder } from "@/lib/cloudinary";

export function IntroSection() {
  return (
    <Section label="Intro" name="intro">
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
  const {
    read,
    write,
    isPendingDeletion,
    trackCreation,
    cancelCreation,
    trackDeletion,
    cancelDeletion,
  } = useDraftBufferOps();
  const { trackPendingDeletion, cancelPendingDeletion } = useImageAssets();
  const { enable } = useChromeEnabler();
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const isDeleted = isPendingDeletion("artist-image-home", "intro");
  const bufferedUrl = read("intro", "portraitImage", "en");
  const portraitUrl = isDeleted
    ? undefined
    : (bufferedUrl === undefined ? data?.portraitImage?.en : bufferedUrl) ||
      undefined;

  usePageBoundaryRegistration("artist-image-home:intro", "Home Artist Image");

  const handlePortraitUpload = useCallback(
    (url: string, publicId: string) => {
      if (isPendingDeletion("artist-image-home", "intro")) {
        cancelDeletion("artist-image-home", "intro");
        const oldPublicId =
          read("intro", "portraitImagePublicId", "en") ??
          data?.portraitImagePublicId?.en;
        if (oldPublicId) {
          cancelPendingDeletion(oldPublicId);
        }
      }
      write("intro", "portraitImage", "en", url);
      write("intro", "portraitImage", "it", url);
      write("intro", "portraitImagePublicId", "en", publicId);
      write("intro", "portraitImagePublicId", "it", publicId);
      trackCreation("artist-image-home", "intro");
    },
    [
      write,
      read,
      data,
      isPendingDeletion,
      cancelDeletion,
      cancelPendingDeletion,
      trackCreation,
    ]
  );

  const handlePortraitDelete = useCallback(() => {
    const publicId =
      read("intro", "portraitImagePublicId", "en") ??
      data?.portraitImagePublicId?.en;
    if (publicId) {
      trackPendingDeletion(publicId);
    }
    cancelCreation("artist-image-home", "intro");
    trackDeletion("artist-image-home", "intro");
    write("intro", "portraitImage", "en", "");
    write("intro", "portraitImage", "it", "");
    write("intro", "portraitImagePublicId", "en", "");
    write("intro", "portraitImagePublicId", "it", "");
  }, [read, data, trackPendingDeletion, cancelCreation, trackDeletion, write]);

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
                alt="Ginevra Renier Studio"
                deleteLabel="Home Artist Image"
                folder={cloudinaryFolder("site")}
                onDelete={handlePortraitDelete}
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
