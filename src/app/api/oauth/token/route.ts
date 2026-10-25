import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * OAuth 2.0 Token Endpoint for Claude / Remote MCP Connectors
 */
export async function POST(req: NextRequest) {
  let clientId = "pocketmotion-mcp-client";
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      if (json.client_id) clientId = json.client_id;
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      if (params.get("client_id")) clientId = params.get("client_id")!;
    }
  } catch {
    // ignore parse errors
  }

  const now = Date.now();
  return NextResponse.json(
    {
      access_token: `pm_mcp_access_${clientId}_${now}`,
      token_type: "Bearer",
      expires_in: 31536000,
      refresh_token: `pm_mcp_refresh_${now}`,
      scope: "mcp openid profile email",
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}

