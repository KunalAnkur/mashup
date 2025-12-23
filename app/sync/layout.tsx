import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Enter Source URL",
  description: "Watch videos together from YouTube, Vimeo, Twitch, Dailymotion, and more. Enter a URL and sync playback with friends in real-time.",
  keywords: constants.seo.syncKeywords.join(", "),
  openGraph: {
    title: "Enter Source URL - Movmash",
    description: "Watch videos together from YouTube, Vimeo, Twitch, Dailymotion, and more. Enter a URL and sync playback with friends.",
    url: `${baseUrl}/sync`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Enter Source URL - Movmash",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enter Source URL - Movmash",
    description: "Watch videos together from YouTube, Vimeo, Twitch, and more.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/sync`,
  },
};

export default function SyncLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: baseUrl },
          { name: "Enter Source URL", url: `${baseUrl}/sync` },
        ]}
      />
      {children}
    </>
  );
}

