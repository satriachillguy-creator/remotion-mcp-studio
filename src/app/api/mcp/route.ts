import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS_LIST } from "@/lib/mcp-tools";
import {
  getServerMcpStore,
  runServerMcpTool,
  syncClientProjectToServer,
} from "@/lib/mcp-store";

export async function GET() {
  const store = getServerMcpStore();
  return NextResponse.json({
    protocol: "Model Context Protocol (MCP)",
    protocolVersion: "2025-03-26",
    serverInfo: {
      name: "remotion-mcp-studio-server",
      version: "1.0.0",
      description: "Remote & Built-in MCP Server for Mobile/Desktop Remotion Video Studio",
    },
    tools: MCP_TOOLS_LIST,
    project: store.project,
    logs: store.logs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle Studio UI state synchronization
    if (body.method === "studio/sync" && body.project) {
      const synced = syncClientProjectToServer(body.project);
      return NextResponse.json({
        ok: true,
        project: synced,
        logs: getServerMcpStore().logs,
      });
    }

    // 2. Standard JSON-RPC 2.0 MCP Protocol Handler
    const { jsonrpc = "2.0", id = null, method, params = {} } = body;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: {
            tools: { listChanged: true },
          },
          serverInfo: {
            name: "remotion-mcp-studio-server",
            version: "1.0.0",
          },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          tools: MCP_TOOLS_LIST,
        },
      });
    }

    if (method === "tools/call") {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      const source = params._source || "remote-mcp";

      const { output, logEntry, project } = runServerMcpTool(
        toolName,
        toolArgs,
        source
      );

      return NextResponse.json({
        jsonrpc,
        id,
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
      });
    }

    return NextResponse.json(
      {
        jsonrpc,
        id,
        error: {
          code: -32601,
          message: `Method '${method}' not found on Remotion MCP Server.`,
        },
      },
      { status: 400 }
    );
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
      { status: 500 }
    );
  }
}

