const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** JSON-LD reutilizável. `data` é serializado com segurança no <script>. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "InkVision",
        url: APP_URL,
        description:
          "SaaS para estúdios de tatuagem: descoberta de artistas, chat, simulação de tatuagem por IA, agendamento e pagamentos.",
      }}
    />
  );
}

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((i) => ({
          "@type": "Question",
          name: i.q,
          acceptedAnswer: { "@type": "Answer", text: i.a },
        })),
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "InkVision",
        url: APP_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${APP_URL}/tatuadores?q={query}` },
          "query-input": "required name=query",
        },
      }}
    />
  );
}
