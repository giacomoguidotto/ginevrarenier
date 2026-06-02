import { track } from "@vercel/analytics/server";
import { api } from "convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import type { Metadata } from "next";
import {
  type ConfirmStatus,
  confirmCopy,
  resolveConfirmLocale,
} from "./confirm-copy";

interface Props {
  searchParams: Promise<{ locale?: string; token?: string }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await searchParams;
  const copy = confirmCopy[resolveConfirmLocale(null, locale)];

  return {
    title: `${copy.metadataTitle} | Ginevra Renier`,
    robots: { index: false },
  };
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { locale: requestedLocale, token } = await searchParams;

  if (!token) {
    return (
      <ConfirmLayout
        locale={resolveConfirmLocale(null, requestedLocale)}
        status="error"
      />
    );
  }

  const result = await fetchMutation(api.subscribers.confirm, { token });
  const resultLocale = "locale" in result ? result.locale : null;
  const locale = resolveConfirmLocale(resultLocale, requestedLocale);

  if (result.status === "confirmed") {
    await track("subscription_confirmed");
  }

  return <ConfirmLayout locale={locale} status={result.status} />;
}

function ConfirmLayout({
  locale,
  status,
}: {
  locale: keyof typeof confirmCopy;
  status: ConfirmStatus;
}) {
  const success = status === "confirmed" || status === "already_confirmed";
  const copy = confirmCopy[locale];
  const content = success ? copy.success : copy.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1ec] px-6 dark:bg-[#080808]">
      <div className="w-full max-w-md text-center">
        <p className="mb-12 font-light text-[#1a1816] text-[15px] tracking-[4px] dark:text-[#ede8e0]">
          GINEVRA RENIER
        </p>

        {success ? (
          <>
            <h1 className="mb-4 font-light text-[#1a1816] text-xl dark:text-[#ede8e0]">
              {content.title}
            </h1>
            <p className="text-[#3a3530] text-[15px] leading-relaxed dark:text-[#c8c3bb]">
              {content.body}
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-4 font-light text-[#1a1816] text-xl dark:text-[#ede8e0]">
              {content.title}
            </h1>
            <p className="text-[#3a3530] text-[15px] leading-relaxed dark:text-[#c8c3bb]">
              {content.body}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
