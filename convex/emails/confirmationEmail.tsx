import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { CSSProperties } from "react";

interface ConfirmationEmailProps {
  confirmUrl: string;
  locale: "en" | "it";
}

const copy = {
  en: {
    preview: "Confirm your subscription to Ginevra Renier",
    greeting: "Thank you for your interest in my work.",
    body: "I'd love to keep you updated on new projects, exhibitions, and stories from the studio. To confirm your subscription, simply click below.",
    cta: "Confirm subscription",
    footer:
      "If you didn't sign up, you can safely ignore this email — nothing will happen.",
  },
  it: {
    preview: "Conferma la tua iscrizione a Ginevra Renier",
    greeting: "Grazie per il tuo interesse nel mio lavoro.",
    body: "Mi piacerebbe tenerti aggiornato su nuovi progetti, mostre e storie dallo studio. Per confermare la tua iscrizione, clicca qui sotto.",
    cta: "Conferma iscrizione",
    footer:
      "Se non ti sei iscritto, puoi ignorare questa email — non succederà nulla.",
  },
};

function ConfirmationEmail({ confirmUrl, locale }: ConfirmationEmailProps) {
  const t = copy[locale] ?? copy.en;

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandName}>GINEVRA RENIER</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={greetingStyle}>{t.greeting}</Text>
            <Text style={bodyText}>{t.body}</Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={confirmUrl} style={ctaButton}>
              {t.cta}
            </Button>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderConfirmationEmail(
  props: ConfirmationEmailProps
): Promise<string> {
  return render(<ConfirmationEmail {...props} />);
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

const divider: CSSProperties = {
  borderColor: "#e4dfd7",
  borderTop: "1px solid #e4dfd7",
  margin: "0",
};

const contentSection: CSSProperties = {
  padding: "36px 0 28px 0",
};

const greetingStyle: CSSProperties = {
  color: "#1a1816",
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const bodyText: CSSProperties = {
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

const footer: CSSProperties = {
  textAlign: "center",
  padding: "28px 0 0 0",
};

const footerText: CSSProperties = {
  color: "#b8b3ab",
  fontSize: "12px",
  fontWeight: 300,
  lineHeight: "1.6",
  margin: "0",
};
