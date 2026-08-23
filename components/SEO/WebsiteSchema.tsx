const baseUrl = 'https://app.movmash.com';

/**
 * No potentialAction/SearchAction here on purpose.
 *
 * It used to declare a Sitelinks Searchbox with the template `?search={search_term_string}`.
 * Google retired that feature in November 2024, so the markup bought nothing — and Googlebot
 * crawled the literal placeholder URL, which Search Console then reported as "Duplicate
 * without user-selected canonical". The app has no search page to point at either.
 */
export default function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "Movmash",
    url: baseUrl,
    description: "Watch videos together with friends in perfect sync. Chat, react, and share the moment — no matter the distance.",
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

