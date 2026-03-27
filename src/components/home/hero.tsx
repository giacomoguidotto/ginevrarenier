"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useRef } from "react";
import { EditableText } from "@/components/admin/editable-text";
import { Link } from "@/i18n/routing";
import { useEditableSiteContent } from "@/lib/use-editable-content";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { get, set } = useEditableSiteContent("hero");

  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      ref={containerRef}
    >
      {/* Background Image with Parallax */}
      <motion.div className="absolute inset-0 z-0" style={{ y, scale }}>
        <div
          className="h-full w-full bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero/hero-main.svg')",
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/40 to-background" />
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
            <EditableText
              as="p"
              className="mb-6 text-foreground/80 text-sm uppercase tracking-[0.3em]"
              onChange={(v) => set("tagline", v)}
              value={get("tagline")}
            />
          </motion.div>

          {/* Main Heading with Text Reveal */}
          <div className="overflow-hidden">
            <motion.h1
              animate={{ y: 0 }}
              className="mb-8 font-light leading-[0.9]"
              initial={{ y: "150%" }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <EditableText
                as="span"
                className="block text-foreground"
                onChange={(v) => set("title", v)}
                value={get("title")}
              />
              <EditableText
                as="span"
                className="block text-foreground/60"
                onChange={(v) => set("titleAccent", v)}
                value={get("titleAccent")}
              />
            </motion.h1>
          </div>

          {/* Subheading */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <EditableText
              as="p"
              className="mx-auto mb-12 max-w-xl text-lg text-muted-foreground"
              multiline
              onChange={(v) => set("description", v)}
              value={get("description")}
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Link
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary bg-primary px-8 py-4 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground"
              href="/vision"
            >
              <EditableText
                as="span"
                className="relative z-10"
                onChange={(v) => set("cta", v)}
                value={get("cta")}
              />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-8 py-4 font-medium text-foreground text-sm uppercase tracking-widest transition-all hover:border-foreground hover:bg-foreground/10"
              href="/connect"
            >
              <EditableText
                as="span"
                onChange={(v) => set("ctaSecondary", v)}
                value={get("ctaSecondary")}
              />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="-translate-x-1/2 absolute bottom-12 left-1/2 z-10"
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
  );
}
