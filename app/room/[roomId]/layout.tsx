import type { Metadata } from "next";
import * as constants from "@/constants";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";
import RoomProviderWrapper from "./RoomProviderWrapper";

const baseUrl = constants.seo.SITE_URL;
const fallbackTitle = "Join a Live Watch Party on Movmash - Stream and Chat";
const logoUrl = `${baseUrl}/assets/logo-square.png`;

function sanitizeHostName(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 50);
}

function buildRoomTitle(hostName: string | null): string {
  if (!hostName) return fallbackTitle;
  const shortHost = hostName.length > 24 ? `${hostName.slice(0, 24)}...` : hostName;
  return `Join ${shortHost}'s Watch Party on Movmash - Chat Live`;
}

function buildRoomDescription(hostName: string | null): string {
  if (!hostName) {
    return "Join this Movmash watch party to stream in perfect sync, chat with friends, and react in real time. Tap to join instantly.";
  }

  return `Join ${hostName}'s Movmash watch party to stream in perfect sync, chat with friends, and react in real time. Tap to join instantly.`;
}

async function fetchHostNameFromApi(roomId: string): Promise<string | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return null;

  const endpoints = [
    `${apiBase}/api/v1/room/public-room-info/${roomId}`,
    `${apiBase}/api/v1/room/room-info/${roomId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { next: { revalidate: 60 } });
      if (!response.ok) continue;

      const payload = await response.json();
      const data = payload?.data ?? payload;
      const hostName = sanitizeHostName(
        data?.host?.username ||
          data?.user?.username ||
          data?.hostName ||
          data?.username
      );

      if (hostName) return hostName;
    } catch {
      // Ignore fetch failures and fallback to default metadata.
    }
  }

  return null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams?:
    | Promise<{ host?: string; username?: string }>
    | { host?: string; username?: string };
}): Promise<Metadata> {
  const { roomId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const hostNameFromQuery = sanitizeHostName(query?.host || query?.username);
  const hostName = hostNameFromQuery || (await fetchHostNameFromApi(roomId));
  const pageTitle = buildRoomTitle(hostName);
  const description = buildRoomDescription(hostName);
  const roomUrl = `${baseUrl}/room/${roomId}`;

  return {
    title: pageTitle,
    description,
    keywords: constants.seo.roomKeywords.join(", "),
    openGraph: {
      title: pageTitle,
      description,
      url: roomUrl,
      type: "website",
      images: [
        {
          url: logoUrl,
          alt: "Movmash logo",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
      images: [logoUrl],
    },
    alternates: {
      canonical: roomUrl,
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
