import type { Metadata, Viewport } from "next";
import { Jua } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GOOGLE_SITE_VERIFICATION, NAVER_SITE_VERIFICATION, SITE_URL } from "@/lib/site";
import "./globals.css";

const jua = Jua({ weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: "구구 대모험 - 비둘기 횡스크롤 게임",
  description: "비둘기 구구가 공원을 달리며 점프로 장애물과 몬스터를 피하는 귀여운 횡스크롤 게임",
  // Google Search Console · 네이버 서치어드바이저 소유 확인
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    other: { "naver-site-verification": NAVER_SITE_VERIFICATION },
  },
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
      </body>
    </html>
  );
}
