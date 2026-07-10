import type { Metadata } from "next";
import type { ReactNode } from "react";

const pageUrl = "https://www.sitemix.com.tr/on-muhasebe/kayit";
const title = "Sitemix Kaydol | 7 Gün Ücretsiz Ön Muhasebe Denemesi";
const description =
  "Sitemix Ön Muhasebe hesabınızı oluşturun. 7 gün ücretsiz deneyerek cari, stok, kasa, satış fişi ve rapor ekranlarını kullanmaya başlayın.";

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

export default function KayitLayout({ children }: { children: ReactNode }) {
  return children;
}
