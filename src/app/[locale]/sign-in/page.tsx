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
          elements: {
            rootBox: "mx-auto",
          },
        }}
        fallbackRedirectUrl={`/${locale}`}
        routing="hash"
      />
    </div>
  );
}
