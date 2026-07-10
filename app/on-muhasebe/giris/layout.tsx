import type { Metadata } from "next";
import type { ReactNode } from "react";

const pageUrl = "https://www.sitemix.com.tr/on-muhasebe/giris";
const title = "Sitemix Giriş | Ön Muhasebe Paneli";
const description =
  "Sitemix Ön Muhasebe kullanıcı girişi. Cari, stok, kasa, fiş ve rapor ekranlarına güvenli şekilde giriş yapın.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: pageUrl,
    siteName: "Sitemix",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GirisLayout({ children }: { children: ReactNode }) {
  return children;
}
