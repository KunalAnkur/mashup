import type { Metadata } from "next";
import * as constants from "@/constants";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Watch Together",
  description: "Start your watch party! Choose from YouTube, Vimeo, Twitch, screen sharing, or upload your own videos. Watch together with friends in perfect sync.",
  keywords: constants.seo.homePageKeywords.join(", "),
  openGraph: {
    title: "Movmash - Start Your Watch Party",
    description: "Start your watch party! Choose from YouTube, Vimeo, Twitch, screen sharing, or upload your own videos.",
    url: baseUrl,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Movmash - Start Your Watch Party",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Movmash - Start Your Watch Party",
    description: "Start your watch party! Choose from YouTube, Vimeo, Twitch, screen sharing, or upload your own videos.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

