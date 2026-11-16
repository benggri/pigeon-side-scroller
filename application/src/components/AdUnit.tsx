"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/ads";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

/** 반응형 애드센스 디스플레이 광고 단위. slot 이 비어 있으면 아무것도 그리지 않는다. */
export default function AdUnit({ slot }: { slot: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return; // 개발 모드 StrictMode 이중 실행 방지
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 광고 차단기 등으로 실패해도 게임은 계속 */
    }
  }, [slot]);

  if (!slot) return null;
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: "16px auto 0", minHeight: 90 }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
