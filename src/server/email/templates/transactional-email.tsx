import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface TransactionalEmailProps {
  preview: string;
  heading: string;
  greeting: string;
  intro: string;
  details: ReadonlyArray<{ label: string; value: string }>;
  cta?: { label: string; href: string };
}

const colors = { text: "#18181b", muted: "#71717a", border: "#e4e4e7", brand: "#4f46e5", surface: "#fafafa" };

/** Shared corporate layout for every transactional e-mail. */
export function TransactionalEmail({ preview, heading, greeting, intro, details, cta }: TransactionalEmailProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.surface, fontFamily: "Inter, -apple-system, Segoe UI, sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: 520, margin: "32px auto", backgroundColor: "#ffffff", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: colors.text, margin: "0 0 24px" }}>HedeflerBir</Text>
          <Heading as="h1" style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
            {heading}
          </Heading>
          <Text style={{ fontSize: 14, lineHeight: "22px", color: colors.text, margin: "0 0 8px" }}>{greeting}</Text>
          <Text style={{ fontSize: 14, lineHeight: "22px", color: colors.text, margin: "0 0 20px" }}>{intro}</Text>

          <Section style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px" }}>
            {details.map((row) => (
              <Text key={row.label} style={{ fontSize: 13, lineHeight: "20px", margin: "8px 0", color: colors.text }}>
                <span style={{ color: colors.muted }}>{row.label}: </span>
                {row.value}
              </Text>
            ))}
          </Section>

          {cta ? (
            <Button
              href={cta.href}
              style={{ display: "inline-block", marginTop: 24, backgroundColor: colors.brand, color: "#ffffff", fontSize: 14, fontWeight: 600, borderRadius: 8, padding: "10px 18px", textDecoration: "none" }}
            >
              {cta.label}
            </Button>
          ) : null}

          <Hr style={{ borderColor: colors.border, margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
            Bu e-posta HedeflerBir platformundaki hesabınızla ilgili bir işlem nedeniyle gönderildi.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
