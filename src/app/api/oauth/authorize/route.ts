import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

/**
 * OAuth 2.0 Authorization Endpoint for Claude / Remote MCP Connectors
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectUri =
    searchParams.get("redirect_uri") ||
    "https://claude.ai/api/mcp/auth_callback";
  const state = searchParams.get("state") || "";
  const clientId = searchParams.get("client_id") || "pocketmotion-mcp-client";

  const authCode = `pm_code_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const targetUrl = new URL(redirectUri);
  targetUrl.searchParams.set("code", authCode);
  if (state) targetUrl.searchParams.set("state", state);
  const finalRedirect = targetUrl.toString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorize PocketMotion MCP for Claude</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #0a0a0a;
      border: 1px solid #262626;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.9);
      text-align: center;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: #171717;
      border: 1px solid #333333;
      color: #e5e5e5;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 16px;
    }
    p {
      font-size: 13px;
      color: #a3a3a3;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      background: #ffffff;
      color: #000000;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
      border: none;
    }
    .btn:hover {
      background: #e5e5e5;
      transform: translateY(-1px);
    }
    .btn:active {
      transform: translateY(0);
    }
    .footer {
      margin-top: 18px;
      font-size: 11px;
      color: #525252;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Model Context Protocol 2.1</div>
    <div class="brand">
      <div class="dot"></div>
      <h1>Connect Claude to PocketMotion</h1>
    </div>
    <p>
      Allow Claude to access your Remotion video studio tools (inspect layers, update parameters, edit templates, and generate animations).
    </p>
    <a id="authBtn" class="btn" href="${finalRedirect.replace(/"/g, "&quot;")}">
      Authorize &amp; Connect to Claude
    </a>
    <div class="footer">
      Redirecting to: ${new URL(redirectUri).hostname}
    </div>
  </div>
  <script>
    // Auto-click if inside an automated popup or webview
    const btn = document.getElementById('authBtn');
    if (window.location.search.includes('auto=1') || window.location.search.includes('approve=1')) {
      window.location.href = btn.href;
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
