"use client";

import { motion } from "framer-motion";
import { Check, Instagram, Mail, MapPin, Send, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { PageTransition } from "@/components/layout/page-transition";

const contactInfoData = [
  {
    icon: Mail,
    labelKey: "email",
    value: "hello@ginevrarenier.com",
    href: "mailto:hello@ginevrarenier.com",
  },
  {
    icon: MapPin,
    labelKey: "basedIn",
    valueKey: "location",
    href: null,
  },
];

const socialLinksData = [
  {
    icon: Instagram,
    label: "Instagram",
    value: "@ginevrarenier",
    href: "https://instagram.com/ginevrarenier",
  },
  {
    icon: Twitter,
    label: "Twitter",
    value: "@ginevrarenier",
    href: "https://twitter.com/ginevrarenier",
  },
];

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
          <div className="mb-16 max-w-3xl">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              {t("header.label")}
            </motion.p>
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-cream"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t("header.title")}
            </motion.h1>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t("header.description")}
            </motion.p>
          </div>

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
                  className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-charcoal p-12 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream/10">
                    <Check className="h-8 w-8 text-cream" />
                  </div>
                  <h3 className="mb-4 font-light text-2xl text-cream">
                    {t("success.title")}
                  </h3>
                  <p className="mb-8 text-muted-foreground">
                    {t("success.description")}
                  </p>
                  <button
                    className="text-cream/60 text-sm uppercase tracking-widest transition-colors hover:text-cream"
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
                      className="w-full rounded-lg border border-border bg-charcoal px-4 py-3 text-cream outline-none transition-colors focus:border-cream"
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
                      className="w-full rounded-lg border border-border bg-charcoal px-4 py-3 text-cream outline-none transition-colors focus:border-cream"
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
                      className="w-full rounded-lg border border-border bg-charcoal px-4 py-3 text-cream outline-none transition-colors focus:border-cream"
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
                      className="w-full resize-none rounded-lg border border-border bg-charcoal px-4 py-3 text-cream outline-none transition-colors focus:border-cream"
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
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-cream bg-cream px-8 py-4 font-medium text-background text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
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
                  {contactInfoData.map((item) => (
                    <div className="flex items-start gap-4" key={item.labelKey}>
                      <item.icon className="mt-1 h-5 w-5 text-cream/60" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          {t(`info.${item.labelKey}`)}
                        </p>
                        {item.href ? (
                          <a
                            className="text-cream text-lg transition-colors hover:text-cream/80"
                            href={item.href}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-cream text-lg">
                            {item.valueKey
                              ? t(`info.${item.valueKey}`)
                              : item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div>
                <h3 className="mb-6 text-muted-foreground text-sm uppercase tracking-widest">
                  {t("info.followAlong")}
                </h3>
                <div className="space-y-4">
                  {socialLinksData.map((item) => (
                    <a
                      className="flex items-start gap-4 transition-colors"
                      href={item.href}
                      key={item.label}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <item.icon className="mt-1 h-5 w-5 text-cream/60" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          {item.label}
                        </p>
                        <p className="text-cream text-lg transition-colors hover:text-cream/80">
                          {item.value}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="rounded-lg border border-border bg-charcoal p-6">
                <h3 className="mb-4 text-muted-foreground text-sm uppercase tracking-widest">
                  {t("info.availability.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("info.availability.description")}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-green-400 text-sm">
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
