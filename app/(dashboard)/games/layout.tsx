import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Play Games Together",
  description:
    "Play Tic-Tac-Toe and more with friends in a live room. Pick a game, share the link, and play together with chat alongside.",
  openGraph: {
    title: "Play Games Together - Movmash",
    description:
      "Pick a game, share the link, and play together with friends. Chat and voice included.",
    url: `${baseUrl}/games`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/assets/logo-square.png`,
        width: 1200,
        height: 630,
        alt: "Play Games Together - Movmash",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Games Together - Movmash",
    description: "Pick a game, share the link, and play together with friends.",
    images: [`${baseUrl}/assets/logo-square.png`],
  },
  alternates: {
    canonical: `${baseUrl}/games`,
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: baseUrl },
          { name: "Games", url: `${baseUrl}/games` },
        ]}
      />
      {children}
    </>
  );
}
