import type { Metadata } from "next";
import { ConnectClient } from "./connect-client";

export const metadata: Metadata = {
  title: "Connect",
  description:
    "Get in touch with Ginevra Renier for collaborations, commissions, exhibitions, or inquiries.",
};

export default function ConnectPage() {
  return <ConnectClient />;
}
