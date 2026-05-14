"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Field } from "@/components/admin/field";
import {
  FieldVisibilityProvider,
  useFieldVisibility,
} from "@/components/admin/field-visibility";
import { Section } from "@/components/admin/section";

export function Testimonial() {
  return (
    <Section name="testimonial">
      <FieldVisibilityProvider>
        <TestimonialContent />
      </FieldVisibilityProvider>
    </Section>
  );
}

function TestimonialContent() {
  const { markVisible } = useFieldVisibility();

  return (
    <section className="relative overflow-hidden bg-background py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          onAnimationComplete={markVisible}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Quote className="mx-auto mb-8 h-12 w-12 text-foreground/20" />

          <blockquote className="mb-8">
            <Field
              as="p"
              className="font-light text-2xl text-foreground/90 leading-relaxed md:text-3xl lg:text-4xl"
              multiline
              name="quote"
            />
          </blockquote>

          <div className="flex flex-col items-center gap-2">
            <Field
              as="p"
              className="font-medium text-foreground"
              name="author"
            />
            <Field
              as="p"
              className="text-muted-foreground text-sm"
              name="role"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
