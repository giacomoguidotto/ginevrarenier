"use client";

import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = "idle" | "submitting" | "success";

export function SubscribeForm({ sectionName }: { sectionName: string }) {
  return (
    <Section name={sectionName}>
      <ChromeEnablerProvider>
        <SubscribeFormContent sectionName={sectionName} />
      </ChromeEnablerProvider>
    </Section>
  );
}

function SubscribeFormContent({ sectionName }: { sectionName: string }) {
  const t = useTranslations("subscribe");
  const locale = useLocale();
  const subscribe = useMutation(api.subscribers.subscribe);
  const { enable } = useChromeEnabler();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  useEffect(() => {
    enable();
  }, [enable]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!EMAIL_RE.test(email)) {
      setError(t("error"));
      return;
    }

    setError("");
    setFormState("submitting");

    try {
      await subscribe({
        email,
        locale,
        consentTimestamp: Date.now(),
      });
      setFormState("success");
      setEmail("");
      setTimeout(() => setFormState("idle"), 4000);
    } catch {
      setError(t("submitError"));
      setFormState("idle");
    }
  };

  return (
    <div className="space-y-3">
      <Field as="p" className="text-foreground/60 text-sm" name="prompt" />
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <div className="flex-1">
          <label className="sr-only" htmlFor={`subscribe-email-${sectionName}`}>
            {t("email")}
          </label>
          <input
            className={`w-full rounded border bg-card px-3 py-2 text-foreground text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${
              error ? "border-destructive" : "border-border"
            }`}
            id={`subscribe-email-${sectionName}`}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder={t("placeholder")}
            type="email"
            value={email}
          />
          {error && (
            <p className="mt-1 text-destructive text-xs" role="alert">
              {error}
            </p>
          )}
        </div>
        <motion.button
          className="shrink-0 rounded border border-primary bg-primary px-4 py-2 text-primary-foreground text-xs uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={formState === "submitting"}
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {formState === "submitting" ? t("submitting") : t("submit")}
        </motion.button>
      </form>
      {formState === "success" && (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="text-primary text-xs"
          initial={{ opacity: 0, y: -4 }}
        >
          {t("success")}
        </motion.p>
      )}
      <p className="text-muted-foreground text-xs leading-snug">
        {t("consent")}
      </p>
    </div>
  );
}
