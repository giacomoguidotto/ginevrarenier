import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { CSSProperties } from "react";

interface BlogPostEntry {
  title: string;
  url: string;
}

interface PublishNotificationEmailProps {
  coverImageUrl?: string;
  locale: "en" | "it";
  projectDescription: string;
  projectTitle: string;
  projectUrl: string;
  recentPosts: BlogPostEntry[];
  unsubscribeUrl: string;
}

const copy = {
  en: {
    preview: (title: string) => `New project: ${title}`,
    intro: "A new project has been published.",
    cta: "View project",
    reflectionsHeading: "Latest reflections",
    unsubscribe: "Unsubscribe",
  },
  it: {
    preview: (title: string) => `Nuovo progetto: ${title}`,
    intro: "Un nuovo progetto è stato pubblicato.",
    cta: "Vedi il progetto",
    reflectionsHeading: "Ultime riflessioni",
    unsubscribe: "Annulla iscrizione",
  },
};

function PublishNotificationEmail({
  projectTitle,
  projectDescription,
  projectUrl,
  coverImageUrl,
  recentPosts,
  unsubscribeUrl,
  locale,
}: PublishNotificationEmailProps) {
  const t = copy[locale] ?? copy.en;

  return (
    <Html>
      <Head />
      <Preview>{t.preview(projectTitle)}</Preview>
      <Body style={bodyStyle}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandName}>GINEVRA RENIER</Text>
            <Text style={brandSub}>STUDIO</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={introStyle}>{t.intro}</Text>

            {coverImageUrl && (
              <Img
                alt={projectTitle}
                src={coverImageUrl}
                style={coverImage}
                width="100%"
              />
            )}

            <Text style={projectTitleStyle}>{projectTitle}</Text>
            {projectDescription && (
              <Text style={descriptionStyle}>{projectDescription}</Text>
            )}
          </Section>

          <Section style={ctaSection}>
            <Button href={projectUrl} style={ctaButton}>
              {t.cta}
            </Button>
          </Section>

          {recentPosts.length > 0 && (
            <>
              <Hr style={divider} />

              <Section style={reflectionsSection}>
                <Text style={reflectionsHeading}>{t.reflectionsHeading}</Text>
                {recentPosts.map((post) => (
                  <Row key={post.url} style={postRow}>
                    <Column>
                      <Link href={post.url} style={postLink}>
                        {post.title}
                      </Link>
                    </Column>
                  </Row>
                ))}
              </Section>
            </>
          )}

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                {t.unsubscribe}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderPublishNotificationEmail(
  props: PublishNotificationEmailProps
): Promise<string> {
  return render(<PublishNotificationEmail {...props} />);
}

const fontStack =
  "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const bodyStyle: CSSProperties = {
  backgroundColor: "#f4f1ec",
  fontFamily: fontStack,
  margin: 0,
  padding: 0,
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "52px 44px",
  maxWidth: "520px",
};

const header: CSSProperties = {
  textAlign: "center",
  paddingBottom: "36px",
};

const brandName: CSSProperties = {
  color: "#1a1816",
  fontSize: "15px",
  fontWeight: 300,
  letterSpacing: "4px",
  margin: "0 0 6px 0",
};

const brandSub: CSSProperties = {
  color: "#9a958d",
  fontSize: "9px",
  fontWeight: 400,
  letterSpacing: "3px",
  margin: "0",
};

const divider: CSSProperties = {
  borderColor: "#e4dfd7",
  borderTop: "1px solid #e4dfd7",
  margin: "0",
};

const contentSection: CSSProperties = {
  padding: "36px 0 28px 0",
};

const introStyle: CSSProperties = {
  color: "#1a1816",
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const coverImage: CSSProperties = {
  borderRadius: "2px",
  marginBottom: "24px",
};

const projectTitleStyle: CSSProperties = {
  color: "#1a1816",
  fontSize: "20px",
  fontWeight: 500,
  letterSpacing: "0.5px",
  margin: "0 0 12px 0",
};

const descriptionStyle: CSSProperties = {
  color: "#3a3530",
  fontSize: "15px",
  fontWeight: 400,
  lineHeight: "1.8",
  margin: "0",
};

const ctaSection: CSSProperties = {
  textAlign: "center",
  padding: "12px 0 36px 0",
};

const ctaButton: CSSProperties = {
  backgroundColor: "#1a1816",
  color: "#f4f1ec",
  fontSize: "13px",
  fontWeight: 500,
  letterSpacing: "1.5px",
  padding: "14px 32px",
  textDecoration: "none",
  borderRadius: "2px",
};

const reflectionsSection: CSSProperties = {
  padding: "28px 0",
};

const reflectionsHeading: CSSProperties = {
  color: "#9a958d",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "2px",
  textTransform: "uppercase",
  margin: "0 0 16px 0",
};

const postRow: CSSProperties = {
  marginBottom: "8px",
};

const postLink: CSSProperties = {
  color: "#1a1816",
  fontSize: "14px",
  fontWeight: 400,
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

const footerSection: CSSProperties = {
  textAlign: "center",
  padding: "28px 0 0 0",
};

const footerText: CSSProperties = {
  margin: "0",
};

const unsubscribeLink: CSSProperties = {
  color: "#b8b3ab",
  fontSize: "12px",
  fontWeight: 300,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};
