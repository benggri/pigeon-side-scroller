import Game from "@/components/Game";

export default function Home() {
  return (
    <main style={{ padding: "12px 16px", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Game />
    </main>
  );
}
