import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Login",
  description: "Login to Movmash to start creating watch parties. Join friends, sync videos, and watch together in perfect harmony.",
  keywords: constants.seo.loginKeywords.join(", "),
  openGraph: {
    title: "Login to Movmash",
    description: "Login to Movmash to start creating watch parties. Join friends, sync videos, and watch together.",
    url: `${baseUrl}/login`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Login to Movmash",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login to Movmash",
    description: "Login to Movmash to start creating watch parties.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/login`,
  },
  robots: {
    index: false, // Login pages typically shouldn't be indexed
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: baseUrl },
          { name: "Login", url: `${baseUrl}/login` },
        ]}
      />
      {children}
    </>
  );
}

