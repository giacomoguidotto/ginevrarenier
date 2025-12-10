import type { Metadata } from "next";
import { getAllPosts } from "@/lib/mdx";
import { ReflectionsClient } from "./reflections-client";

export const metadata: Metadata = {
  title: "Reflections",
  description:
    "Thoughts on photography, creativity, and the art of seeing. A collection of essays and stories by Ginevra Renier.",
};

export default function ReflectionsPage() {
  const posts = getAllPosts();

  return <ReflectionsClient posts={posts} />;
}
