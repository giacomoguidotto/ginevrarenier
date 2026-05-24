import { api } from "convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed — Ginevra Renier Studio",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <UnsubscribeLayout status="error" />;
  }

  const result = await fetchMutation(api.subscribers.unsubscribe, { token });

  return <UnsubscribeLayout status={result.status} />;
}

function UnsubscribeLayout({
  status,
}: {
  status: "unsubscribed" | "invalid_token" | "error";
}) {
  const success = status === "unsubscribed";

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
              You&rsquo;ve been unsubscribed.
            </h1>
            <p className="text-[#3a3530] text-[15px] leading-relaxed dark:text-[#c8c3bb]">
              You won&rsquo;t receive any more emails from me. If you change
              your mind, you can always subscribe again from the website.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-4 font-light text-[#1a1816] text-xl dark:text-[#ede8e0]">
              Something went wrong.
            </h1>
            <p className="text-[#3a3530] text-[15px] leading-relaxed dark:text-[#c8c3bb]">
              This unsubscribe link is invalid. If you believe this is an error,
              please contact me directly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
