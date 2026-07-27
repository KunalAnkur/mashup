import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Free, Couple, and Crowd Plans",
  description:
    "Compare Movmash Free, Couple, and Crowd plans for room size, watch time, video calls, and screen share quality.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
