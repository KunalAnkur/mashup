import type { Metadata } from "next";
import * as constants from "@/constants";

const baseUrl = constants.seo.SITE_URL;

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Return to Movmash and start your watch party.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${baseUrl}/404`,
  },
};

export default function NotFoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

