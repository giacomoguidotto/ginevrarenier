import type { Metadata } from "next";
import { EssenceClient } from "./essence-client";

export const metadata: Metadata = {
  title: "Essence",
  description:
    "The story behind the lens. Learn about Ginevra Renier's journey, philosophy, and approach to photography.",
};

export default function EssencePage() {
  return <EssenceClient />;
}
