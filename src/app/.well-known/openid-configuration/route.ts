import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function getOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "pocketmotion.netlify.app";
  return `${proto}://${host}`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);

  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/api/oauth/authorize`,
      token_endpoint: `${origin}/api/oauth/token`,
      userinfo_endpoint: `${origin}/api/oauth/userinfo`,
      registration_endpoint: `${origin}/api/oauth/register`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256", "none"],
      scopes_supported: ["mcp", "openid", "profile", "email"],
      token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_post",
        "client_secret_basic",
      ],
      claims_supported: ["sub", "iss", "name", "email"],
      code_challenge_methods_supported: ["S256", "plain"],
    },
    { headers: CORS_HEADERS }
  );
}

