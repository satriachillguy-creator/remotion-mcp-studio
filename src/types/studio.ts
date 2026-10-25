export type PropFieldType = "text" | "color" | "number" | "boolean" | "select";

export interface PropSchemaField {
  key: string;
  label: string;
  type: PropFieldType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  aspectRatio: "9:16" | "16:9" | "1:1";
}

export interface VirtualFile {
  path: string;
  content: string;
  language: "tsx" | "ts" | "json";
  updatedAt: number;
}

export interface SequenceLayer {
  id: string;
  name: string;
  from: number;
  durationInFrames: number;
  color: string;
}

export interface CompileDiagnostic {
  hasError: boolean;
  message: string | null;
  line?: number;
  column?: number;
  file?: string;
  updatedAt: number;
}

export interface McpExecutionLog {
  id: string;
  toolName: string;
  args: Record<string, any>;
  result: string;
  status: "success" | "error" | "running";
  source: "built-in-ai" | "remote-mcp" | "studio-ui";
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: {
    toolName: string;
    args: Record<string, any>;
    summary: string;
  }[];
  timestamp: string;
}

export interface StudioProject {
  id: string;
  name: string;
  templateId: string;
  videoConfig: VideoConfig;
  files: Record<string, VirtualFile>;
  activeFile: string;
  propsSchema: PropSchemaField[];
  propsValues: Record<string, any>;
  sequences: SequenceLayer[];
  diagnostics: CompileDiagnostic;
  version: number;
}

export interface AIProviderSettings {
  provider: "smart-builtin" | "gemini" | "openai" | "anthropic";
  apiKey: string;
  model: string;
}

