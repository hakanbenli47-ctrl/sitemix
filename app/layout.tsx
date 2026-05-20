import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      "Sitemix | İşletmelere Özel Web Sitesi, Google Uyumlu Dijital Çözümler",
    template: "%s | Sitemix",
  },

  description:
    "Sitemix; işletmeler için modern, mobil uyumlu, Google görünürlüğü güçlü ve WhatsApp dönüşüm odaklı web siteleri hazırlar. 1 saat içinde demo, 3 gün içinde yayına hazır profesyonel web çözümleri.",

  keywords: [
    "Sitemix",
    "web sitesi tasarımı",
    "işletme web sitesi",
    "kurumsal web sitesi",
    "Google uyumlu web sitesi",
    "SEO uyumlu web sitesi",
    "WhatsApp entegre web sitesi",
    "mobil uyumlu web sitesi",
    "küçük işletme web sitesi",
    "esnaf web sitesi",
    "kuaför web sitesi",
    "güzellik salonu web sitesi",
    "restoran web sitesi",
    "butik web sitesi",
    "ürün satış sitesi",
    "e ticaret sitesi",
    "reklam destekli web sitesi",
    "dijital tanıtım",
    "web tasarım Türkiye",
  ],

  authors: [{ name: "Sitemix" }],
  creator: "Sitemix",
  publisher: "Sitemix",

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Sitemix",
    title:
      "Sitemix | İşletmelere Özel Web Sitesi ve Dijital Tanıtım Çözümleri",
    description:
      "İşletmeniz için modern, mobil uyumlu, Google odaklı ve WhatsApp dönüşümlü web sitesi çözümleri. Demo hızlı hazırlanır, site kısa sürede yayına alınır.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sitemix Web Sitesi ve Dijital Tanıtım Çözümleri",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Sitemix | İşletmelere Özel Web Sitesi ve Dijital Tanıtım Çözümleri",
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

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}