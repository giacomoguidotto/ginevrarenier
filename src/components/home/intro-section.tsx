"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Link } from "@/i18n/routing";

export function IntroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const t = useTranslations("home.intro");

  return (
    <section className="relative bg-background py-32" ref={sectionRef}>
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
            <p className="mb-4 text-cream/60 text-sm uppercase tracking-widest">
              {t("label")}
            </p>
            <h2 className="mb-8 text-cream">
              {t("title")}
              <br />
              {t("titleBreak")}
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>{t("paragraph1")}</p>
              <p>{t("paragraph2")}</p>
            </div>
            <div className="mt-10">
              <Link
                className="group inline-flex items-center gap-2 text-cream text-sm uppercase tracking-widest transition-colors hover:text-cream/70"
                href="/essence"
              >
                <span>{t("cta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            className="relative aspect-3/4 overflow-hidden rounded-lg lg:aspect-auto lg:h-[600px]"
            initial={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <motion.div className="h-full w-full" style={{ y: imageY }}>
              <Image
                alt="Ginevra Renier"
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/hero/artist-portrait.jpg"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
