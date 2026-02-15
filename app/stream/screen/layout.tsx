import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Screen Share",
  description: "Share your screen with friends and watch together. Perfect for streaming Netflix, Disney+, or any other content in perfect sync.",
  keywords: constants.seo.screenShareKeywords.join(", "),
  openGraph: {
    title: "Screen Share - Movmash",
    description: "Share your screen with friends and watch together. Perfect for streaming Netflix, Disney+, or any other content.",
    url: `${baseUrl}/stream/screen`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/assets/logo-square.png`,
        width: 1200,
        height: 630,
        alt: "Screen Share - Movmash",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Screen Share - Movmash",
    description: "Share your screen with friends and watch together.",
    images: [`${baseUrl}/assets/logo-square.png`],
  },
  alternates: {
    canonical: `${baseUrl}/stream/screen`,
  },
};

export default function ScreenShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: baseUrl },
          { name: "Stream Options", url: `${baseUrl}/stream` },
          { name: "Screen Share", url: `${baseUrl}/stream/screen` },
        ]}
      />
      {children}
    </>
  );
}
