import { NextRequest, NextResponse } from "next/server";
import { runExternalLlmMcpAgent } from "@/lib/ai-agent";
import {
  syncClientProjectToServer,
  runServerMcpTool,
  getServerMcpStore,
} from "@/lib/mcp-store";
import { AIProviderSettings, StudioProject } from "@/types/studio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body.prompt || "";
    const clientProject: StudioProject = body.project;
    const settings: AIProviderSettings = body.settings || {
      provider: "smart-builtin",
      apiKey: "",
      model: "",
    };

    if (clientProject) {
      syncClientProjectToServer(clientProject);
    }

    const currentProject = getServerMcpStore().project;
    const agentResponse = await runExternalLlmMcpAgent(
      prompt,
      currentProject,
      settings
    );

    const executedTools: {
      toolName: string;
      args: Record<string, any>;
      summary: string;
    }[] = [];

    let latestProject = currentProject;

    for (const call of agentResponse.toolCalls) {
      const { output, project } = runServerMcpTool(
        call.toolName,
        call.args,
        "built-in-ai"
      );
      latestProject = project;
      executedTools.push({
        toolName: call.toolName,
        args: call.args,
        summary: output.summary,
      });
    }

    return NextResponse.json({
      reply: agentResponse.reply,
      toolCalls: executedTools,
      project: latestProject,
      logs: getServerMcpStore().logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Gagal memproses permintaan AI MCP",
      },
      { status: 500 }
    );
  }
}

