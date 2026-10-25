import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      sub: "pocketmotion-user-1",
      name: "PocketMotion Studio User",
      email: "creator@pocketmotion.app",
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  return GET(req);
}

