// biome-ignore-all lint/performance/noImgElement: ImageResponse requires native <img>, not next/image.
// biome-ignore-all lint/correctness/useImageSize: ImageResponse handles sizing via the container.
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { ImageResponse } from "next/og";

export const alt = "Ginevra Renier Studio — Vision";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function getTitle(
  project: { title: { en: string; it: string } } | null,
  locale: string
): string {
  if (!project) {
    return "Vision";
  }
  return locale === "it" ? project.title.it : project.title.en;
}

function getTagline(
  project: { tagline: { en: string; it: string } } | null,
  locale: string
): string {
  if (!project) {
    return "";
  }
  return locale === "it" ? project.tagline.it : project.tagline.en;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; project: string }>;
}) {
  const { locale, project: slug } = await params;
  const project = await fetchQuery(api.projects.getBySlug, { slug });

  const title = getTitle(project, locale);
  const tagline = getTagline(project, locale);
  const coverUrl = project?.coverImageUrl;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#0a0a0a",
      }}
    >
      {coverUrl && (
        <img
          alt=""
          src={coverUrl}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.4,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          height: "100%",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Ginevra Renier Studio
        </div>
        {tagline && (
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {tagline}
          </div>
        )}
        <div
          style={{
            fontSize: 52,
            fontWeight: 300,
            color: "white",
            lineHeight: 1.2,
            maxWidth: "80%",
          }}
        >
          {title}
        </div>
      </div>
    </div>,
    { ...size }
  );
}
