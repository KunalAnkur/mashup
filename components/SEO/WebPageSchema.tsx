const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.movmash.com';

interface WebPageSchemaProps {
  title?: string;
  description?: string;
  url?: string;
}

export default function WebPageSchema({
  title = "Movmash - Watch Together, Anywhere",
  description = "Watch videos together with friends in perfect sync. Chat, react, and share the moment — no matter the distance.",
  url = baseUrl,
}: WebPageSchemaProps) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description,
    url: url,
    publisher: {
      "@type": "Organization",
      name: "Movmash",
      url: baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

