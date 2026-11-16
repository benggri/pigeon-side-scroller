import AdUnit from "@/components/AdUnit";
import Game from "@/components/Game";
import { AD_SLOT_BELOW_GAME } from "@/lib/ads";

export default function Home() {
  return (
    <main style={{ padding: "12px 16px", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Game />
      <AdUnit slot={AD_SLOT_BELOW_GAME} />
    </main>
  );
}
