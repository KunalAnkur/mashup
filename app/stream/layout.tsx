import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Stream Options",
  description: "Stream videos from your device. Upload video files or share your screen to watch together with friends in perfect sync.",
  keywords: constants.seo.streamKeywords.join(", "),
  openGraph: {
    title: "Stream Options - Movmash",
    description: "Stream videos from your device. Upload video files or share your screen to watch together with friends.",
    url: `${baseUrl}/stream`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/assets/logo-square.png`,
        width: 1200,
        height: 630,
        alt: "Stream Options - Movmash",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stream Options - Movmash",
    description: "Stream videos from your device. Upload video files or share your screen.",
    images: [`${baseUrl}/assets/logo-square.png`],
  },
  alternates: {
    canonical: `${baseUrl}/stream`,
  },
};

export default function StreamLayout({
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
        ]}
      />
      {children}
    </>
  );
}
