import Image from "next/image";
import Link from "next/link";

// Custom components for MDX rendering
export const mdxComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mt-12 mb-8 font-light text-4xl text-cream md:text-5xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-10 mb-6 font-light text-3xl text-cream">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-8 mb-4 font-light text-2xl text-cream">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
      {children}
    </p>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <Link
      className="text-cream underline decoration-cream/30 underline-offset-4 transition-colors hover:decoration-cream"
      href={href || "#"}
    >
      {children}
    </Link>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-6 ml-6 list-disc space-y-2 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-6 ml-6 list-decimal space-y-2 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-lg leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="my-8 border-cream/30 border-l-2 pl-6 text-cream/80 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-cream text-sm">
      {children}
    </code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="mb-6 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-12 border-border border-t" />,
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          alt={alt || ""}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          src={src || ""}
        />
      </div>
      {alt ? (
        <figcaption className="mt-3 text-center text-muted-foreground text-sm">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  ),
};
