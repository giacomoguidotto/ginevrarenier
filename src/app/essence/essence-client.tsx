"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award, Camera, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { PageTransition } from "@/components/layout/page-transition";

const achievements = [
  {
    icon: Camera,
    title: "15+ Years",
    description: "Dedicated to the craft of visual storytelling",
  },
  {
    icon: Award,
    title: "International Recognition",
    description: "Featured in Vogue, National Geographic, and more",
  },
  {
    icon: Globe,
    title: "40+ Countries",
    description: "Capturing stories across continents",
  },
];

const timeline = [
  {
    year: "2008",
    title: "First Camera",
    description:
      "Received my first DSLR camera as a gift, sparking a lifelong passion.",
  },
  {
    year: "2012",
    title: "Professional Debut",
    description:
      "First exhibition in Venice, marking the beginning of my professional journey.",
  },
  {
    year: "2016",
    title: "Vogue Feature",
    description:
      "Editorial work recognized by Vogue Italia, opening doors to fashion photography.",
  },
  {
    year: "2019",
    title: "National Geographic",
    description:
      "Documentary project on Mediterranean coastal communities published worldwide.",
  },
  {
    year: "2023",
    title: "Solo Exhibition",
    description: 'Major retrospective "Light & Time" at the Venice Biennale.',
  },
];

export function EssenceClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <PageTransition>
      {/* Hero Section */}
      <section
        className="relative min-h-screen overflow-hidden pt-32"
        ref={heroRef}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Image */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-[3/4] overflow-hidden rounded-lg lg:aspect-auto lg:h-[80vh]"
              initial={{ opacity: 0, x: -50 }}
              style={{ y: imageY }}
              transition={{ duration: 0.8 }}
            >
              <Image
                alt="Ginevra Renier"
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/hero/artist-portrait.svg"
              />
            </motion.div>

            {/* Text Content */}
            <motion.div
              className="flex flex-col justify-center lg:py-20"
              style={{ y: textY }}
            >
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                The Artist
              </motion.p>
              <motion.h1
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-cream"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Essence
              </motion.h1>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-lg text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <p>
                  Born in Venice, raised amidst the interplay of water and
                  light, I discovered early that the world speaks in images.
                  Photography became my language—a way to capture the fleeting
                  moments that define our existence.
                </p>
                <p>
                  My work is guided by a simple philosophy: every photograph
                  should evoke an emotion, tell a story, and reveal something
                  invisible to the casual glance. I seek the extraordinary
                  hidden within the ordinary.
                </p>
                <p>
                  Whether capturing the quiet dignity of a stranger's gaze or
                  the dramatic sweep of a mountain range, I approach each
                  subject with reverence and curiosity.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-charcoal py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {achievements.map((achievement, index) => (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 40 }}
                key={achievement.title}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <achievement.icon className="mx-auto mb-4 h-8 w-8 text-cream" />
                <h3 className="mb-2 font-light text-2xl text-cream">
                  {achievement.title}
                </h3>
                <p className="text-muted-foreground">
                  {achievement.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.p
            className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Philosophy
          </motion.p>
          <motion.blockquote
            className="font-light text-3xl text-cream leading-relaxed md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            "Photography is not about capturing reality—it's about revealing the
            truth that reality often conceals. Every image is a dialogue between
            light and shadow, presence and absence, the seen and the felt."
          </motion.blockquote>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-charcoal py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="mb-4 text-cream/60 text-sm uppercase tracking-widest">
              Journey
            </p>
            <h2 className="text-cream">A Path in Light</h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="md:-translate-x-px absolute top-0 bottom-0 left-[7px] w-px bg-border md:left-1/2" />

            {timeline.map((item, index) => (
              <motion.div
                className={`relative mb-12 pl-10 md:mb-16 md:w-1/2 md:pl-0 ${
                  index % 2 === 0
                    ? "md:pr-12 md:text-right"
                    : "md:ml-auto md:pl-12"
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                key={item.year}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute top-1 left-0 h-4 w-4 rounded-full border-2 border-cream bg-charcoal md:left-auto ${
                    index % 2 === 0 ? "md:right-[-8px]" : "md:left-[-8px]"
                  }`}
                />

                <span className="mb-2 block text-cream/60 text-sm uppercase tracking-widest">
                  {item.year}
                </span>
                <h3 className="mb-2 font-light text-cream text-xl">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.h2
            className="mb-6 text-cream"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Let's Create Together
          </motion.h2>
          <motion.p
            className="mb-10 text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Whether you have a vision in mind or want to explore possibilities,
            I'd love to hear from you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Link
              className="group inline-flex items-center gap-2 rounded-full border border-cream bg-cream px-8 py-4 font-medium text-background text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-cream"
              href="/connect"
            >
              <span>Get in Touch</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
