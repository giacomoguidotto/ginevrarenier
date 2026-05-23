import {
  Body,
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

interface InquiryEmailProps {
  email: string;
  inquiryType: string;
  message: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  collaboration: "Collaboration",
  commission: "Commission",
  exhibition: "Exhibition",
  press: "Press",
  other: "General Inquiry",
};

const darkStyles = `
@media (prefers-color-scheme: dark) {
  .em-body { background-color: #080808 !important; }
  .em-container { background-color: #111111 !important; }
  .em-brand { color: #ede8e0 !important; }
  .em-brand-sub { color: #5a5550 !important; }
  .em-divider { border-color: #2d2822 !important; }
  .em-intro { color: #8a857d !important; }
  .em-card { background-color: #181816 !important; }
  .em-label { color: #6b665e !important; }
  .em-value { color: #e0dbd3 !important; }
  .em-value-sec { color: #8a857d !important; }
  .em-msg-block { border-left-color: #3d3832 !important; }
  .em-msg { color: #c8c3bb !important; }
  .em-footer { color: #3d3832 !important; }
}
`;

function InquiryEmail({
  name,
  email,
  inquiryType,
  message,
}: InquiryEmailProps) {
  const typeLabel = TYPE_LABELS[inquiryType] ?? inquiryType;

  return (
    <Html>
      <Head>
        <style>{darkStyles}</style>
      </Head>
      <Preview>
        New {typeLabel.toLowerCase()} inquiry from {name}
      </Preview>
      <Body className="em-body" style={bodyStyle}>
        <Container className="em-container" style={container}>
          <Section style={header}>
            <Text className="em-brand" style={brandName}>
              GINEVRA RENIER
            </Text>
            <Text className="em-brand-sub" style={brandSub}>
              STUDIO
            </Text>
          </Section>

          <Hr className="em-divider" style={divider} />

          <Section style={introSection}>
            <Text className="em-intro" style={introText}>
              New inquiry received
            </Text>
          </Section>

          <Section className="em-card" style={card}>
            <Text className="em-label" style={label}>
              FROM
            </Text>
            <Text className="em-value" style={valuePrimary}>
              {name}
            </Text>
            <Text className="em-value-sec" style={valueSecondary}>
              {email}
            </Text>

            <Text className="em-label" style={labelSpaced}>
              REGARDING
            </Text>
            <Text className="em-value" style={valuePrimary}>
              {typeLabel}
            </Text>
          </Section>

          <Section style={messageSection}>
            <Text className="em-label" style={label}>
              MESSAGE
            </Text>
            <Section className="em-msg-block" style={messageBlock}>
              <Text className="em-msg" style={messageText}>
                {message}
              </Text>
            </Section>
          </Section>

          <Hr className="em-divider" style={divider} />

          <Section style={footer}>
            <Text className="em-footer" style={footerText}>
              ginevrarenier.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderInquiryEmail(
  props: InquiryEmailProps
): Promise<string> {
  return render(<InquiryEmail {...props} />);
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

const introSection: CSSProperties = {
  padding: "32px 0 28px 0",
};

const introText: CSSProperties = {
  color: "#8a857d",
  fontSize: "13px",
  fontWeight: 400,
  letterSpacing: "0.3px",
  margin: "0",
};

const card: CSSProperties = {
  backgroundColor: "#f8f6f3",
  padding: "28px",
  marginBottom: "28px",
  borderRadius: "2px",
};

const label: CSSProperties = {
  color: "#8a857d",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "2px",
  margin: "0 0 8px 0",
};

const labelSpaced: CSSProperties = {
  ...label,
  marginTop: "20px",
};

const valuePrimary: CSSProperties = {
  color: "#1a1816",
  fontSize: "16px",
  fontWeight: 400,
  margin: "0 0 2px 0",
  lineHeight: "1.5",
};

const valueSecondary: CSSProperties = {
  color: "#6b665e",
  fontSize: "14px",
  fontWeight: 400,
  margin: "0",
};

const messageSection: CSSProperties = {
  paddingBottom: "36px",
};

const messageBlock: CSSProperties = {
  borderLeft: "2px solid #d4cfc7",
  paddingLeft: "20px",
};

const messageText: CSSProperties = {
  color: "#3a3530",
  fontSize: "15px",
  fontWeight: 400,
  lineHeight: "1.8",
  margin: "0",
  whiteSpace: "pre-wrap",
};

const footer: CSSProperties = {
  textAlign: "center",
  padding: "28px 0 0 0",
};

const footerText: CSSProperties = {
  color: "#b8b3ab",
  fontSize: "11px",
  fontWeight: 300,
  letterSpacing: "2px",
  margin: "0",
};
