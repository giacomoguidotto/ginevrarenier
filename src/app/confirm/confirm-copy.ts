import { defaultLocale, type Locale, locales } from "@/i18n/config";

export type ConfirmStatus =
  | "confirmed"
  | "already_confirmed"
  | "invalid_token"
  | "error";

interface ConfirmPageCopy {
  error: {
    title: string;
    body: string;
  };
  metadataTitle: string;
  success: {
    title: string;
    body: string;
  };
}

export const confirmCopy = {
  en: {
    metadataTitle: "Subscription Confirmed",
    success: {
      title: "You're in.",
      body: "Thank you for confirming your subscription. I'll keep you posted on new projects, exhibitions, and stories from the studio.",
    },
    error: {
      title: "Something went wrong.",
      body: "This confirmation link is invalid or has already been used. If you believe this is an error, please try subscribing again.",
    },
  },
  it: {
    metadataTitle: "Iscrizione confermata",
    success: {
      title: "Ci sei.",
      body: "Grazie per aver confermato la tua iscrizione. Ti scriverò quando ci saranno nuovi progetti, mostre e storie dallo studio.",
    },
    error: {
      title: "Qualcosa è andato storto.",
      body: "Questo link di conferma non è valido o è già stato usato. Se pensi che sia un errore, prova a iscriverti di nuovo.",
    },
  },
} satisfies Record<Locale, ConfirmPageCopy>;

function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveConfirmLocale(
  resultLocale?: string | null,
  requestedLocale?: string | null
): Locale {
  if (isLocale(resultLocale)) {
    return resultLocale;
  }

  if (isLocale(requestedLocale)) {
    return requestedLocale;
  }

  return defaultLocale;
}
