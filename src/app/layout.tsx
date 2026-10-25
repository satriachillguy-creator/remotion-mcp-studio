import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KINETIC // Remotion MCP Studio",
  description:
    "Programmatic React/Remotion video environment with Model Context Protocol (MCP) integration for mobile and desktop.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#09090B] text-[#F4F4F6]">{children}</body>
    </html>
  );
}
