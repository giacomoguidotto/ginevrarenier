import { api } from "convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Confirmed — Ginevra Renier Studio",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ConfirmLayout status="error" />;
  }

  const result = await fetchMutation(api.subscribers.confirm, { token });

  return <ConfirmLayout status={result.status} />;
}

function ConfirmLayout({
  status,
}: {
  status: "confirmed" | "already_confirmed" | "invalid_token" | "error";
}) {
  const success = status === "confirmed" || status === "already_confirmed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1ec] px-6 dark:bg-[#080808]">
      <div className="w-full max-w-md text-center">
        <p className="mb-4 font-light text-[#1a1816] text-[15px] tracking-[4px] dark:text-[#ede8e0]">
          GINEVRA RENIER
        </p>
        <p className="mb-12 font-normal text-[#9a958d] text-[9px] tracking-[3px]">
          STUDIO
        </p>

        {success ? (
          <>
            <h1 className="mb-4 font-light text-[#1a1816] text-xl dark:text-[#ede8e0]">
              You&rsquo;re in.
            </h1>
            <p className="text-[#3a3530] text-[15px] leading-relaxed dark:text-[#c8c3bb]">
              Thank you for confirming your subscription. I&rsquo;ll keep you
              posted on new projects, exhibitions, and stories from the studio.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-4 font-light text-[#1a1816] text-xl dark:text-[#ede8e0]">
              Something went wrong.
            </h1>
            <p className="text-[#3a3530] text-[15px] leading-relaxed dark:text-[#c8c3bb]">
              This confirmation link is invalid or has already been used. If you
              believe this is an error, please try subscribing again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
