import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://www.sitemix.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "Sitemix | İşletmelere Özel Web Sitesi ve Müşteri Getiren Dijital Sistemler",
    template: "%s | Sitemix",
  },

  description:
    "Sitemix; işletmeler için modern, mobil uyumlu, Google görünürlüğü güçlü ve WhatsApp dönüşüm odaklı web siteleri hazırlar. İşletmenizi internette daha güvenilir gösteren, müşteri talebi almaya odaklı profesyonel web çözümleri sunar.",

  keywords: [
    "Sitemix",
    "web sitesi tasarımı",
    "işletme web sitesi",
    "kurumsal web sitesi",
    "müşteri getiren web sitesi",
    "Google uyumlu web sitesi",
    "SEO uyumlu web sitesi",
    "WhatsApp entegre web sitesi",
    "mobil uyumlu web sitesi",
    "küçük işletme web sitesi",
    "esnaf web sitesi",
    "yerel işletme web sitesi",
    "kuaför web sitesi",
    "güzellik salonu web sitesi",
    "restoran web sitesi",
    "butik web sitesi",
    "ürün satış sitesi",
    "WhatsApp sipariş sitesi",
    "dijital tanıtım",
    "web tasarım Türkiye",
    "Google görünürlük",
    "işletme tanıtım sitesi",
  ],

  authors: [{ name: "Sitemix" }],
  creator: "Sitemix",
  publisher: "Sitemix",

  verification: {
    google: "unGw4gq1-Xi7UAWpsZrcaJCEevzBcb5GLozv6o8Xqxs",
  },

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Sitemix",
    title:
      "Sitemix | İşletmelere Özel Web Sitesi ve Müşteri Getiren Dijital Sistemler",
    description:
      "İşletmeniz için modern, mobil uyumlu, Google odaklı ve WhatsApp dönüşümlü web sitesi çözümleri. Sitemix, işletmenizi internette daha güvenilir gösteren profesyonel web sistemleri hazırlar.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sitemix İşletmelere Özel Web Sitesi ve Dijital Tanıtım Çözümleri",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Sitemix | İşletmelere Özel Web Sitesi ve Müşteri Getiren Dijital Sistemler",
    description:
      "Google uyumlu, mobil uyumlu ve WhatsApp dönüşüm odaklı profesyonel web siteleri.",
    images: ["/og-image.jpg"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18187004518"
          strategy="afterInteractive"
        />

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
                if (typeof(url) != 'undefined') {
                  window.location = url;
                }
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