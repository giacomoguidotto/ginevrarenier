"use client";

import { motion } from "framer-motion";
import { Check, MapPin, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { PageTransition } from "@/components/layout/page-transition";
import { useSocialLinks } from "@/lib/hooks";
import { getSocialIcon } from "@/lib/social-icons";

const inquiryTypeKeys = [
  "collaboration",
  "commission",
  "exhibition",
  "press",
  "other",
] as const;

export function ConnectClient() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    inquiryType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = useTranslations("connect");
  const { links: socials } = useSocialLinks();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormState({ name: "", email: "", inquiryType: "", message: "" });
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <Section name="connect.header">
            <div className="mb-16 max-w-3xl">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                <Field
                  as="p"
                  className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
                  name="label"
                />
              </motion.div>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Field as="h1" className="mb-6 text-foreground" name="title" />
              </motion.div>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Field
                  as="p"
                  className="text-lg text-muted-foreground"
                  name="description"
                />
              </motion.div>
            </div>
          </Section>

          <div className="grid gap-16 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {isSubmitted ? (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-4 font-light text-2xl text-foreground">
                    {t("success.title")}
                  </h3>
                  <p className="mb-8 text-muted-foreground">
                    {t("success.description")}
                  </p>
                  <button
                    className="text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-foreground"
                    onClick={() => setIsSubmitted(false)}
                    type="button"
                  >
                    {t("success.sendAnother")}
                  </button>
                </motion.div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Name */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="name"
                    >
                      {t("form.name")}
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      id="name"
                      onChange={(e) =>
                        setFormState({ ...formState, name: e.target.value })
                      }
                      placeholder={t("form.namePlaceholder")}
                      required
                      type="text"
                      value={formState.name}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="email"
                    >
                      {t("form.email")}
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      id="email"
                      onChange={(e) =>
                        setFormState({ ...formState, email: e.target.value })
                      }
                      placeholder={t("form.emailPlaceholder")}
                      required
                      type="email"
                      value={formState.email}
                    />
                  </div>

                  {/* Inquiry Type */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="inquiryType"
                    >
                      {t("form.inquiryType")}
                    </label>
                    <select
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
                      id="inquiryType"
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          inquiryType: e.target.value,
                        })
                      }
                      required
                      value={formState.inquiryType}
                    >
                      <option disabled value="">
                        {t("form.inquiryPlaceholder")}
                      </option>
                      {inquiryTypeKeys.map((key) => (
                        <option key={key} value={key}>
                          {t(`inquiryTypes.${key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="message"
                    >
                      {t("form.message")}
                    </label>
                    <textarea
                      className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      id="message"
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      placeholder={t("form.messagePlaceholder")}
                      required
                      rows={6}
                      value={formState.message}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary bg-primary px-8 py-4 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          className="block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                        />
                        {t("form.sending")}
                      </span>
                    ) : (
                      <>
                        <span>{t("form.submit")}</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
              initial={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Direct Contact */}
              <div>
                <h3 className="mb-6 text-muted-foreground text-sm uppercase tracking-widest">
                  {t("info.directContact")}
                </h3>
                <div className="space-y-4">
                  {socials
                    .filter((s) => s.platform === "email")
                    .map((item) => {
                      const Icon = getSocialIcon(item.platform);
                      return (
                        <div className="flex items-start gap-4" key={item._id}>
                          <Icon className="mt-1 h-5 w-5 text-foreground/60" />
                          <div>
                            <p className="text-muted-foreground text-sm">
                              {t("info.email")}
                            </p>
                            <a
                              className="text-foreground text-lg transition-colors hover:text-foreground/80"
                              href={item.href}
                            >
                              {item.value}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  <div className="flex items-start gap-4">
                    <MapPin className="mt-1 h-5 w-5 text-foreground/60" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        {t("info.basedIn")}
                      </p>
                      <p className="text-foreground text-lg">
                        {t("info.location")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div>
                <h3 className="mb-6 text-muted-foreground text-sm uppercase tracking-widest">
                  {t("info.followAlong")}
                </h3>
                <div className="space-y-4">
                  {socials
                    .filter((s) => s.platform !== "email")
                    .map((item) => {
                      const Icon = getSocialIcon(item.platform);
                      return (
                        <a
                          className="flex items-start gap-4 transition-colors"
                          href={item.href}
                          key={item._id}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <Icon className="mt-1 h-5 w-5 text-foreground/60" />
                          <div>
                            <p className="text-muted-foreground text-sm">
                              {item.label}
                            </p>
                            <p className="text-foreground text-lg transition-colors hover:text-foreground/80">
                              {item.value}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                </div>
              </div>

              {/* Availability */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-muted-foreground text-sm uppercase tracking-widest">
                  {t("info.availability.title")}
                </h3>
                <p className="text-foreground">
                  {t("info.availability.description")}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-green-600 text-sm dark:text-green-400">
                    {t("info.availability.status")}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
