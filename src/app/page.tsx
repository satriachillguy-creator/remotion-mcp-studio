import dynamic from "next/dynamic";

const StudioApp = dynamic(() => import("@/components/StudioApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-screen bg-[#09090B] text-[#8E8E99] flex flex-col items-center justify-center gap-3 font-mono text-xs tracking-widest uppercase">
      <div className="w-4 h-4 border border-[#FF5500] border-t-transparent animate-spin" />
      <span>INITIALIZING REMOTION // MCP WORKSPACE</span>
    </div>
  ),
});

export default function HomePage() {
  return <StudioApp />;
}
