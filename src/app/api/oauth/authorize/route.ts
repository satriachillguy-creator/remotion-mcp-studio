import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth 2.0 Authorization Endpoint for Claude / Remote MCP Connectors
 * Supports both direct redirect and interactive Google/PocketMotion approval page
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectUri =
    searchParams.get("redirect_uri") ||
    "https://claude.ai/api/mcp/auth_callback";
  const state = searchParams.get("state") || "";
  const clientId = searchParams.get("client_id") || "pocketmotion-mcp-client";
  const autoApprove = searchParams.get("approve") === "1";

  const authCode = `pm_code_${Date.now()}`;

  if (autoApprove) {
    const target = new URL(redirectUri);
    target.searchParams.set("code", authCode);
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target.toString(), 302);
  }

  const targetUrl = new URL(redirectUri);
  targetUrl.searchParams.set("code", authCode);
  if (state) targetUrl.searchParams.set("state", state);
  const finalRedirect = targetUrl.toString();

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorize PocketMotion MCP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", monospace, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #080808;
      border: 1px solid #262626;
      border-radius: 16px;
      max-width: 420px;
      width: 100%;
      padding: 28px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.8);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
      padding-bottom: 16px;
      border-bottom: 1px solid #171717;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ffffff;
    }
    h1 {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 13px;
      color: #a3a3a3;
      line-height: 1.6;
      margin-bottom: 18px;
    }
    .meta {
      background: #0d0d0d;
      border: 1px solid #1f1f1f;
      border-radius: 10px;
      padding: 12px;
      font-family: monospace;
      font-size: 11px;
      color: #d4d4d4;
      margin-bottom: 20px;
      word-break: break-all;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      background: #ffffff;
      color: #000000;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }
    .btn:hover {
      background: #e5e5e5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="dot"></div>
      <h1>PocketMotion — MCP OAuth 2.1</h1>
    </div>
    <p>
      Izinkan konektor eksternal (Claude / MCP Client) mengakses 7 Remotion MCP Tools di workspace PocketMotion Anda.
    </p>
    <div class="meta">
      CLIENT: ${clientId.replace(/[<>"']/g, "")}<br/>
      SCOPE: mcp:tools read/write
    </div>
    <a class="btn" href="${finalRedirect.replace(/"/g, "&quot;")}">
      Approve &amp; Connect PocketMotion
    </a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}

