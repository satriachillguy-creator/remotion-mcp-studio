import { StudioProject, McpExecutionLog } from "@/types/studio";
import { createInitialProject } from "@/lib/templates";
import { executeMcpToolOnProject } from "@/lib/mcp-tools";

/**
 * Global server-side project state store so that external MCP clients calling
 * `/api/mcp` and the browser UI polling/syncing `/api/mcp` share live state.
 */
interface GlobalMcpStore {
  project: StudioProject;
  logs: McpExecutionLog[];
}

const globalForMcp = globalThis as unknown as {
  __REMOTION_MCP_STORE__?: GlobalMcpStore;
};

if (!globalForMcp.__REMOTION_MCP_STORE__) {
  globalForMcp.__REMOTION_MCP_STORE__ = {
    project: createInitialProject("swiss-editorial-reel"),
    logs: [
      {
        id: "log-init",
        toolName: "mcp.server.initialize",
        args: { protocolVersion: "2025-03-26", transport: "HTTP-JSONRPC" },
        result: "Endpoint /api/mcp initialized (7 tools registered)",
        status: "success",
        source: "studio-ui",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      },
    ],
  };
}

export function getServerMcpStore(): GlobalMcpStore {
  return globalForMcp.__REMOTION_MCP_STORE__!;
}

export function syncClientProjectToServer(project: StudioProject): StudioProject {
  const store = getServerMcpStore();
  store.project = project;
  return store.project;
}

export function runServerMcpTool(
  toolName: string,
  args: Record<string, any>,
  source: McpExecutionLog["source"] = "remote-mcp"
) {
  const store = getServerMcpStore();
  const output = executeMcpToolOnProject(store.project, toolName, args);
  store.project = output.updatedProject;

  const logEntry: McpExecutionLog = {
    id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    toolName,
    args,
    result: output.summary,
    status: output.data?.error ? "error" : "success",
    source,
    timestamp: new Date().toLocaleTimeString("id-ID"),
  };

  store.logs = [logEntry, ...store.logs.slice(0, 49)];
  return {
    output,
    logEntry,
    project: store.project,
  };
}

