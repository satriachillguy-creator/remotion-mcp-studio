import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If Claude points directly to root '/' with MCP POST or Event-Stream, route to /api/mcp
  if (pathname === "/") {
    const isMcpCall =
      req.method === "POST" ||
      req.method === "OPTIONS" ||
      req.headers.get("accept")?.includes("text/event-stream") ||
      req.headers.get("content-type")?.includes("application/json") ||
      req.headers.has("mcp-session-id");

    if (isMcpCall) {
      return NextResponse.rewrite(new URL("/api/mcp", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};

