import type { Metadata, Viewport } from "next";
import { Jua } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const ADSENSE_CLIENT = "ca-pub-9245086971599023";

const jua = Jua({ weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "구구 대모험 - 비둘기 횡스크롤 게임",
  description: "비둘기 구구가 공원을 달리며 점프로 장애물과 몬스터를 피하는 귀여운 횡스크롤 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8ec",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={jua.className}>
        {children}
        <SpeedInsights />
        <Script
          id="adsbygoogle"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
