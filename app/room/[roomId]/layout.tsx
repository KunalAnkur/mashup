import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";
import RoomProviderWrapper from "./RoomProviderWrapper";

const baseUrl = constants.seo.SITE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: "Watch Party Room",
    description: `Join the watch party room and watch videos together with friends in perfect sync. Chat, react, and share the moment in real-time.`,
    keywords: constants.seo.roomKeywords.join(", "),
    openGraph: {
      title: "Watch Party Room - Movmash",
      description: `Join the watch party room and watch videos together with friends in perfect sync.`,
      url: `${baseUrl}/room/${roomId}`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Watch Party Room - Movmash",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Watch Party Room - Movmash",
      description: `Join the watch party room and watch videos together with friends.`,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: `${baseUrl}/room/${roomId}`,
    },
    robots: {
      index: false, // Room pages shouldn't be indexed (private rooms)
      follow: true,
    },
  };
}

export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: baseUrl },
          { name: "Room", url: `${baseUrl}/room/${roomId}` },
        ]}
      />
      <RoomProviderWrapper>{children}</RoomProviderWrapper>
    </>
  );
}
