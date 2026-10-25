import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS_LIST } from "@/lib/mcp-tools";
import {
  getServerMcpStore,
  runServerMcpTool,
  syncClientProjectToServer,
} from "@/lib/mcp-store";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, PUT, HEAD",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function DELETE() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const accept = req.headers.get("accept") || "";

  // Support SSE stream if requested by an MCP client over GET
  if (accept.includes("text/event-stream")) {
    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // 1. Initial endpoint event required by MCP SSE transport
        controller.enqueue(
          encoder.encode(`event: endpoint\ndata: /api/mcp\n\n`)
        );

        // 2. Periodic keep-alive ping comment so the connection stays open
        const interval = setInterval(() => {
          if (isClosed) {
            clearInterval(interval);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: keepalive\n\n`));
          } catch {
            isClosed = true;
            clearInterval(interval);
          }
        }, 15000);
      },
      cancel() {
        isClosed = true;
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Mcp-Session-Id": "pocketmotion-session-1",
      },
    });
  }

  const store = getServerMcpStore();
  return NextResponse.json(
    {
      protocol: "Model Context Protocol (MCP)",
      protocolVersion: "2024-11-05",
      serverInfo: {
        name: "pocketmotion-remotion-mcp-server",
        version: "1.0.0",
        description:
          "Remote & Built-in MCP Server for Mobile/Desktop Remotion Video Studio",
      },
      tools: MCP_TOOLS_LIST,
      project: store.project,
      logs: store.logs,
    },
    { headers: CORS_HEADERS }
  );
}

function handleSingleJsonRpc(msg: any) {
  const { jsonrpc = "2.0", id, method, params = {} } = msg || {};

  // JSON-RPC notifications (no response required or empty 202/200)
  if (
    method === "notifications/initialized" ||
    method === "notifications/cancelled" ||
    (typeof method === "string" && method.startsWith("notifications/"))
  ) {
    return null;
  }

  if (method === "ping") {
    return { jsonrpc, id: id ?? null, result: {} };
  }

  if (method === "initialize") {
    const requestedVersion = params?.protocolVersion || "2024-11-05";
    return {
      jsonrpc,
      id: id ?? 1,
      result: {
        protocolVersion: requestedVersion,
        capabilities: {
          tools: { listChanged: true },
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: "pocketmotion-remotion-mcp-server",
          version: "1.0.0",
        },
      },
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc,
      id: id ?? 1,
      result: {
        tools: MCP_TOOLS_LIST,
      },
    };
  }

  if (method === "resources/list") {
    return {
      jsonrpc,
      id: id ?? 1,
      result: {
        resources: [],
      },
    };
  }

  if (method === "prompts/list") {
    return {
      jsonrpc,
      id: id ?? 1,
      result: {
        prompts: [],
      },
    };
  }

  if (method === "tools/call") {
    const toolName = params.name;
    const toolArgs = params.arguments || {};
    const source = params._source || "remote-mcp-claude";

    const { output, logEntry, project } = runServerMcpTool(
      toolName,
      toolArgs,
      source
    );

    return {
      jsonrpc,
      id: id ?? 1,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: output.summary,
                data: output.data,
                projectVersion: project.version,
              },
              null,
              2
            ),
          },
        ],
        isError: Boolean(output.data?.error),
        _studioProject: project,
        _mcpLog: logEntry,
      },
    };
  }

  return {
    jsonrpc,
    id: id ?? null,
    error: {
      code: -32601,
      message: `Method '${method}' not found on PocketMotion MCP Server.`,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle Studio UI state synchronization
    if (body && !Array.isArray(body) && body.method === "studio/sync" && body.project) {
      const synced = syncClientProjectToServer(body.project);
      return NextResponse.json(
        {
          ok: true,
          project: synced,
          logs: getServerMcpStore().logs,
        },
        { headers: CORS_HEADERS }
      );
    }

    // 2. Handle JSON-RPC batch array
    if (Array.isArray(body)) {
      const responses = body
        .map((item) => handleSingleJsonRpc(item))
        .filter((r) => r !== null);

      if (responses.length === 0) {
        return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
      }
      return NextResponse.json(responses, {
        headers: {
          ...CORS_HEADERS,
          "Mcp-Session-Id": "pocketmotion-session-1",
        },
      });
    }

    // 3. Handle single JSON-RPC message
    const responseObj = handleSingleJsonRpc(body);
    if (responseObj === null) {
      return new NextResponse(null, {
        status: 202,
        headers: {
          ...CORS_HEADERS,
          "Mcp-Session-Id": "pocketmotion-session-1",
        },
      });
    }

    return NextResponse.json(responseObj, {
      headers: {
        ...CORS_HEADERS,
        "Mcp-Session-Id": "pocketmotion-session-1",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: err?.message || "Invalid JSON payload",
        },
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
