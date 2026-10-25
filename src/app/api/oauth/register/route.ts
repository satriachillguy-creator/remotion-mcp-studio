import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * RFC 7591 OAuth 2.0 Dynamic Client Registration Endpoint for Claude / MCP Connectors
 */
export async function POST(req: NextRequest) {
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const now = Math.floor(Date.now() / 1000);
  const clientId = `pocketmotion-client-${now}`;
  const clientSecret = `pocketmotion-secret-${now}`;

  const responsePayload = {
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: now,
    client_secret_expires_at: 0,
    client_name: body.client_name || "Claude MCP Connector",
    redirect_uris: Array.isArray(body.redirect_uris)
      ? body.redirect_uris
      : ["https://claude.ai/api/mcp/auth_callback"],
    grant_types: Array.isArray(body.grant_types)
      ? body.grant_types
      : ["authorization_code", "refresh_token"],
    response_types: Array.isArray(body.response_types)
      ? body.response_types
      : ["code"],
    token_endpoint_auth_method:
      body.token_endpoint_auth_method || "none",
    scope: body.scope || "mcp openid profile email",
  };

  return NextResponse.json(responsePayload, {
    status: 201,
    headers: CORS_HEADERS,
  });
}

