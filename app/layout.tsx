import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { cookies } from "next/headers";
import { defaultLocale, locales, isRtlLocale, type Locale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";
import * as constants from "../constants";
import OrganizationSchema from "@/components/SEO/OrganizationSchema";
import WebsiteSchema from "@/components/SEO/WebsiteSchema";
import WebPageSchema from "@/components/SEO/WebPageSchema";
import BreadcrumbSchema from "@/components/SEO/BreadcrumbSchema";
import "./globals.css";
import ClientRoot from "./ClientRoot";

const baseUrl = constants.seo.SITE_URL;

// Force dynamic rendering to ensure cookies are read on every request
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Create Party | Movmash",
    template: "%s | Movmash",
  },
  description: constants.seo.BRAND_DESCRIPTION,
  keywords: (constants.seo.extendedKeywords || constants.seo.baseKeywords || []).join(", "),
  authors: [{ name: "Movmash" }],
  creator: "Movmash",
  publisher: "Movmash",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Movmash",
    title: "Movmash - Watch Together, Anywhere",
    description: constants.seo.BRAND_DESCRIPTION,
    images: [
      {
        url: `${baseUrl}/assets/logo-square.png`,
        width: 1200,
        height: 630,
        alt: "Movmash - Watch Together, Anywhere",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Movmash - Watch Together, Anywhere",
    description: constants.seo.BRAND_DESCRIPTION,
    creator: "@movmash",
    images: [`${baseUrl}/assets/logo-square.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-512x512.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-KJN3WCKBHG';
  
  // Get locale from cookie, fallback to default
  let locale: Locale = defaultLocale;
  
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE');
    
    console.log('[layout.tsx] Server-side cookie check:');
    console.log('[layout.tsx] - localeCookie:', localeCookie);
    console.log('[layout.tsx] - localeCookie value:', localeCookie?.value);
    
    if (localeCookie?.value && locales.includes(localeCookie.value as Locale)) {
      locale = localeCookie.value as Locale;
      console.log('[layout.tsx] - Using cookie locale:', locale);
    } else {
      console.log('[layout.tsx] - Using default locale:', locale);
    }
  } catch (error) {
    console.log('[layout.tsx] - Cookie read error:', error);
  }
  
  console.log('[layout.tsx] Final locale:', locale);
  const isRtl = isRtlLocale(locale);

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} data-scroll-behavior="smooth">
      <body
        className="font-parkinsans antialiased text-smoothWhite bg-primaryDark "
        suppressHydrationWarning
      >
        <OrganizationSchema />
        <WebsiteSchema />
        <WebPageSchema
          title="Create Party | Movmash"
          description={constants.seo.BRAND_DESCRIPTION}
          url={baseUrl}
        />
        <BreadcrumbSchema
          items={[
            { name: "Home", url: baseUrl },
          ]}
        />
        <I18nProvider initialLocale={locale}>
          <ClientRoot>{children}</ClientRoot>
        </I18nProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
