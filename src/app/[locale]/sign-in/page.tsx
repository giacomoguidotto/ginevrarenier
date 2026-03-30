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
            colorBackground: "oklch(0.08 0 0)",
            colorText: "oklch(0.95 0.01 80)",
            colorTextSecondary: "oklch(0.65 0 0)",
            colorPrimary: "oklch(0.92 0.02 85)",
            colorInputBackground: "oklch(0.12 0 0)",
            colorInputText: "oklch(0.95 0.01 80)",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-geist-sans)",
          },
          elements: {
            card: "bg-transparent shadow-none border-none",
            headerTitle: "font-light text-3xl tracking-tight",
            headerSubtitle: "text-muted-foreground text-sm",
            formFieldLabel:
              "text-muted-foreground text-xs uppercase tracking-widest",
            formFieldInput:
              "bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30",
            formButtonPrimary:
              "bg-foreground/10 text-foreground uppercase tracking-widest text-sm hover:bg-foreground/20 shadow-none",
            footerAction: "text-muted-foreground",
            footerActionLink: "text-foreground hover:text-foreground/80",
            socialButtonsBlockButton:
              "bg-card border-border text-foreground hover:bg-foreground/5",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
          },
        }}
        fallbackRedirectUrl={`/${locale}`}
        routing="hash"
      />
    </div>
  );
}
