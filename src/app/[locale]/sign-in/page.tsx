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
            colorBackground: "var(--background)",
            colorForeground: "var(--foreground)",
            colorPrimary: "var(--primary)",
            colorMutedForeground: "var(--muted-foreground)",
            colorInput: "var(--card)",
            colorInputForeground: "var(--foreground)",
            colorNeutral: "var(--foreground)",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-geist-sans)",
          },
          elements: {
            rootBox: "w-full max-w-md",
            card: "!shadow-none !border-none",
            footerAction: "!hidden",
            formFieldLabel:
              "!text-muted-foreground !text-xs !uppercase !tracking-widest",
            formButtonPrimary:
              "!bg-primary !text-primary-foreground !uppercase !tracking-widest !text-sm !shadow-none",
            socialButtonsBlockButton: "!border-border !text-foreground",
            dividerLine: "!bg-border",
            dividerText: "!text-muted-foreground",
            badge: "!bg-muted !text-muted-foreground !border-border",
          },
        }}
        fallbackRedirectUrl={`/${locale}`}
        routing="hash"
      />
    </div>
  );
}
