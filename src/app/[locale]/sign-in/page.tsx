import { SignIn } from "@clerk/nextjs";
import { setRequestLocale } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignIn
        appearance={{
          variables: {
            colorBackground: "transparent",
            colorPrimary: "var(--primary)",
            colorText: "var(--foreground)",
            colorTextSecondary: "var(--muted-foreground)",
            colorInputBackground: "var(--card)",
            colorInputText: "var(--foreground)",
            colorNeutral: "var(--foreground)",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-geist-sans)",
          },
          elements: {
            card: "!shadow-none",
            formFieldLabel:
              "!text-muted-foreground !text-xs !uppercase !tracking-widest",
            formButtonPrimary:
              "!bg-primary !text-primary-foreground !uppercase !tracking-widest !text-sm !shadow-none",
            footerActionLink: "!text-foreground",
            socialButtonsBlockButton: "!border-border !text-foreground",
            dividerLine: "!bg-border",
            dividerText: "!text-muted-foreground",
          },
        }}
        fallbackRedirectUrl={`/${locale}`}
        routing="hash"
      />
    </div>
  );
}
