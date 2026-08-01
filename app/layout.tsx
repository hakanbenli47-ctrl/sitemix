import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = "https://www.sitemix.com.tr";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SiteMix Studio",
  alternateName: ["SiteMix", "SiteMix Ön Muhasebe"],
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "İşletmelerin konuşarak mobil uyumlu web sitesi oluşturmasını, yönetmesini ve yayınlamasını sağlayan site platformu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#070811",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SiteMix Studio | Söyle. Siten olsun.",
    template: "%s | SiteMix",
  },
  description: "İşletmeni birkaç cümleyle anlat. SiteMix sektörüne uygun, mobil uyumlu siteni oluştursun; canlı ön izlemede düzenle, yönet ve yayınla.",
  keywords: [
    "SiteMix",
    "konuşarak site oluşturma",
    "işletme web sitesi",
    "mobil uyumlu web sitesi",
    "kuaför web sitesi",
    "berber web sitesi",
    "halı yıkama web sitesi",
    "esnaf web sitesi",
    "WhatsApp web sitesi",
    "site yönetim paneli",
  ],
  authors: [{ name: "SiteMix" }],
  creator: "SiteMix",
  publisher: "SiteMix",
  verification: {
    google: "unGw4gq1-Xi7UAWpsZrcaJCEevzBcb5GLozv6o8Xqxs",
  },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "SiteMix Studio",
    title: "Söyle. Siten olsun.",
    description: "İşletmeni anlat, siteni canlı gör, istediğin gibi düzenle ve yayınla.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "SiteMix Studio — Söyle. Siten olsun." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Söyle. Siten olsun.",
    description: "İşletmeni anlat, siteni canlı gör, istediğin gibi düzenle ve yayınla.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  category: "business",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-18187004518" strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18187004518');
          `}
        </Script>
        <Script id="google-ads-conversion-click" strategy="afterInteractive">
          {`
            function gtag_report_conversion(url) {
              var callback = function () {
                if (typeof(url) != 'undefined') window.location = url;
              };
              gtag('event', 'conversion', {
                'send_to': 'AW-18187004518/N5pSCJX4jLMcEObUnuBD',
                'event_callback': callback
              });
              return false;
            }
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
