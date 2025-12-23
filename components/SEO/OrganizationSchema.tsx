const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.movmash.com';

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Movmash",
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description: "Watch videos together with friends in perfect sync. Chat, react, and share the moment — no matter the distance.",
    sameAs: [
      // Add your social media links here when available
      // "https://twitter.com/movmash",
      // "https://facebook.com/movmash",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@movmash.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

