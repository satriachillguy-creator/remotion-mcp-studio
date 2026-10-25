import { StudioProject, AIProviderSettings } from "@/types/studio";
import { MCP_TOOLS_LIST } from "@/lib/mcp-tools";

export interface AgentToolCall {
  toolName: string;
  args: Record<string, any>;
}

export interface AgentTurnResponse {
  reply: string;
  toolCalls: AgentToolCall[];
}

const COLOR_MAP: Record<string, string> = {
  merah: "#EF4444",
  red: "#EF4444",
  oranye: "#FF5500",
  orange: "#FF5500",
  biru: "#3B82F6",
  blue: "#3B82F6",
  hijau: "#10B981",
  green: "#10B981",
  emas: "#F59E0B",
  gold: "#F59E0B",
  kuning: "#EAB308",
  yellow: "#EAB308",
  putih: "#F4F4F6",
  white: "#F4F4F6",
  hitam: "#09090B",
  black: "#09090B",
  cyan: "#06B6D4",
  ungu: "#8B5CF6",
};

/**
 * Editorial Countdown Composition (Clean Swiss/Industrial aesthetic, zero emoji bloat)
 */
function buildCountdownRemotionCode(): string {
  return `import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export default function CountdownComposition(props) {
  const {
    headline = "SEQUENCE START",
    subheadline = "SYNCHRONIZED TIMECODE // READY",
    ctaText = "LIVE",
    primaryColor = "#FFFFFF",
    accentColor = "#A3A3A3",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const totalSeconds = Math.max(1, Math.floor(durationInFrames / fps));
  const currentSec = Math.max(0, totalSeconds - Math.floor(frame / fps));
  const frameInSec = frame % fps;

  const numberPop = spring({
    frame: frameInSec,
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  const sweepDeg = interpolate(frameInSec, [0, fps - 1], [0, 360], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: accentColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 72,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.16)',
          paddingBottom: 20,
          fontFamily: 'monospace',
          fontSize: 22,
          letterSpacing: 2,
        }}
      >
        <span>{headline}</span>
        <span style={{ color: primaryColor }}>T-MINUS 00:0{currentSec}</span>
      </div>

      {/* Precision Optical Dial */}
      <div
        style={{
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: \`conic-gradient(\${primaryColor} \${sweepDeg}deg, rgba(255,255,255,0.08) 0deg)\`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: currentSec === 0 ? 84 : 210,
              fontWeight: 800,
              letterSpacing: -6,
              color: currentSec === 0 ? primaryColor : accentColor,
              transform: \`scale(\${0.88 + numberPop * 0.12})\`,
            }}
          >
            {currentSec === 0 ? ctaText : \`0\${currentSec}\`}
          </span>
        </div>
      </div>

      <Sequence from={0}>
        <div
          style={{
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            fontSize: 20,
            color: 'rgba(244,244,246,0.6)',
          }}
        >
          <span>{subheadline}</span>
          <span>{frame} / {durationInFrames} F</span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}
`;
}

/**
 * Editorial Commercial / Campaign Composition (Clean typographic layout)
 */
function buildEditorialPromoCode(): string {
  return `import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export default function EditorialCampaignComposition(props) {
  const {
    headline = "SEASON ARCHIVE 70%",
    subheadline = "LIMITED RELEASE // DIRECT DISPATCH",
    ctaText = "ACQUIRE NOW",
    primaryColor = "#FFFFFF",
    accentColor = "#A3A3A3",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardReveal = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const barWidth = interpolate(frame, [0, durationInFrames - 1], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: accentColor,
        padding: 72,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: 22,
          borderBottom: '1px solid rgba(255,255,255,0.18)',
          paddingBottom: 20,
        }}
      >
        <span style={{ color: primaryColor, fontWeight: 700 }}>CAMPAIGN // INDEX</span>
        <span>EDITION 2026</span>
      </div>

      <div
        style={{
          border: \`2px solid \${accentColor}\`,
          padding: '64px 52px',
          transform: \`translateY(\${(1 - cardReveal) * 40}px)\`,
          opacity: cardReveal,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            backgroundColor: primaryColor,
            color: '#09090B',
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 22,
            padding: '8px 18px',
            letterSpacing: 1.5,
          }}
        >
          {subheadline}
        </div>

        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 0.96,
            letterSpacing: -3,
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          {headline}
        </h1>
      </div>

      <Sequence from={20}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              padding: '28px 40px',
              backgroundColor: accentColor,
              color: bgColor,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{ctaText}</span>
            <span style={{ fontFamily: 'monospace' }}>→</span>
          </div>
          <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <div style={{ width: \`\${barWidth}%\`, height: '100%', backgroundColor: primaryColor }} />
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}
`;
}

/**
 * Local Deterministic Command Parser (Offline Mode — when no external LLM API key is configured).
 */
export function runSmartBuiltinMcpAgent(
  prompt: string,
  project: StudioProject
): AgentTurnResponse {
  const lower = prompt.toLowerCase();
  const toolCalls: AgentToolCall[] = [];
  const explanations: string[] = [];

  if (
    lower.includes("perbaiki") ||
    lower.includes("fix") ||
    lower.includes("error") ||
    project.diagnostics.hasError
  ) {
    toolCalls.push({ toolName: "get_compile_diagnostics", args: {} });
    toolCalls.push({
      toolName: "apply_template_preset",
      args: { templateId: project.templateId || "swiss-editorial-reel" },
    });
    explanations.push(
      "Memeriksa diagnostik AST via `get_compile_diagnostics` dan memulihkan komposisi TSX ke state valid."
    );
  }

  // Aspect ratio
  if (
    lower.includes("16:9") ||
    lower.includes("youtube") ||
    lower.includes("laptop") ||
    lower.includes("landscape") ||
    lower.includes("widescreen")
  ) {
    toolCalls.push({
      toolName: "update_video_config",
      args: { aspectRatio: "16:9" },
    });
    explanations.push("Mengatur dimensi kanvas ke **16:9 (1920×1080)**.");
  } else if (
    lower.includes("9:16") ||
    lower.includes("tiktok") ||
    lower.includes("reels") ||
    lower.includes("vertikal") ||
    lower.includes("hp")
  ) {
    toolCalls.push({
      toolName: "update_video_config",
      args: { aspectRatio: "9:16" },
    });
    explanations.push("Mengatur dimensi kanvas ke **9:16 (1080×1920)**.");
  } else if (lower.includes("1:1") || lower.includes("square") || lower.includes("kotak")) {
    toolCalls.push({
      toolName: "update_video_config",
      args: { aspectRatio: "1:1" },
    });
    explanations.push("Mengatur dimensi kanvas ke **1:1 (1080×1080)**.");
  }

  // Duration
  const secMatch = lower.match(/(\d+)\s*(detik|second|sec|s\b)/);
  if (secMatch) {
    const secs = Math.min(25, Math.max(2, parseInt(secMatch[1], 10)));
    const frames = secs * project.videoConfig.fps;
    toolCalls.push({
      toolName: "update_video_config",
      args: { durationInFrames: frames },
    });
    explanations.push(`Mengubah durasi timeline menjadi **${secs}s (${frames} frame @ ${project.videoConfig.fps}fps)**.`);
  }

  // Scene templates / TSX writers
  if (lower.includes("countdown") || lower.includes("hitung mundur") || lower.includes("timer")) {
    toolCalls.push({
      toolName: "write_component_code",
      args: {
        path: "MainVideo.tsx",
        code: buildCountdownRemotionCode(),
      },
    });
    explanations.push(
      "Menulis komponen `CountdownComposition` ke `MainVideo.tsx` menggunakan dial optik `conic-gradient` dan `spring` per detik."
    );
  } else if (
    lower.includes("promo") ||
    lower.includes("diskon") ||
    lower.includes("sale") ||
    lower.includes("campaign")
  ) {
    toolCalls.push({
      toolName: "write_component_code",
      args: {
        path: "MainVideo.tsx",
        code: buildEditorialPromoCode(),
      },
    });
    explanations.push(
      "Menulis komponen `EditorialCampaignComposition` ke `MainVideo.tsx` dengan tipografi kontras tinggi."
    );
  } else if (
    lower.includes("telemetry") ||
    lower.includes("keynote") ||
    lower.includes("chart") ||
    lower.includes("saas") ||
    lower.includes("data")
  ) {
    toolCalls.push({
      toolName: "apply_template_preset",
      args: { templateId: "linear-product-keynote" },
    });
    explanations.push("Mengaktifkan preset `02 / Keynote Telemetry` (16:9).");
  } else if (lower.includes("kinetic") || lower.includes("tipografi") || lower.includes("brutalist")) {
    toolCalls.push({
      toolName: "apply_template_preset",
      args: { templateId: "brutalist-kinetic-square" },
    });
    explanations.push("Mengaktifkan preset `03 / Kinetic Type System` (1:1).");
  } else if (lower.includes("swiss") || lower.includes("editorial") || lower.includes("grid")) {
    toolCalls.push({
      toolName: "apply_template_preset",
      args: { templateId: "swiss-editorial-reel" },
    });
    explanations.push("Mengaktifkan preset `01 / Swiss Editorial Grid` (9:16).");
  }

  // Props extraction
  const propUpdates: Record<string, any> = {};
  const quotedMatches = prompt.match(/["'“”]([^"'“”]{2,60})["'“”]/g);
  if (quotedMatches && quotedMatches.length > 0) {
    propUpdates.headline = quotedMatches[0].replace(/^["'“”]|["'“”]$/g, "");
    if (quotedMatches.length > 1) {
      propUpdates.subheadline = quotedMatches[1].replace(/^["'“”]|["'“”]$/g, "");
    }
  } else {
    const titleMatch = prompt.match(/(?:judul|headline|teks|tulisan)\s+(?:jadi|ke|menjadi|:)\s+([^\n,.]+)/i);
    if (titleMatch) {
      propUpdates.headline = titleMatch[1].trim();
    }
  }

  const matchedColors: string[] = [];
  for (const [word, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(word)) {
      matchedColors.push(hex);
    }
  }
  if (matchedColors.length > 0) {
    propUpdates.primaryColor = matchedColors[0];
    if (matchedColors.length > 1) {
      propUpdates.accentColor = matchedColors[1];
    }
  }

  if (lower.includes("invert") || lower.includes("terang") || lower.includes("light")) {
    propUpdates.bgColor = "#F4F4F6";
    propUpdates.accentColor = "#09090B";
    propUpdates.primaryColor = "#FF5500";
  }

  if (Object.keys(propUpdates).length > 0) {
    toolCalls.push({
      toolName: "update_schema_props",
      args: { props: propUpdates },
    });
    explanations.push(
      `Memperbarui parameter skema melalui \`update_schema_props\`: \`${JSON.stringify(propUpdates)}\`.`
    );
  }

  if (toolCalls.length === 0) {
    const cleanHeadline =
      prompt.length <= 42 ? prompt.toUpperCase() : prompt.slice(0, 38).toUpperCase();
    toolCalls.push({
      toolName: "update_schema_props",
      args: {
        props: {
          headline: cleanHeadline,
        },
      },
    });
    explanations.push(
      `Memperbarui properti \`headline\` menjadi **"${cleanHeadline}"** via \`update_schema_props\`.`
    );
  }

  const reply = [
    "**[Local Rule Parser → MCP Tools]**",
    ...explanations.map((e) => `- ${e}`),
    "",
    "*Catatan: Saat ini berjalan dalam mode parser perintah lokal (tanpa API key). Untuk generasi kode TSX bebas menggunakan LLM penuh, masukkan API Key Gemini atau OpenAI pada menu Settings.*",
  ].join("\n");

  return { reply, toolCalls };
}

/**
 * External LLM MCP Agent (Gemini / OpenAI) with fallback to local rule parser.
 */
export async function runExternalLlmMcpAgent(
  prompt: string,
  project: StudioProject,
  settings: AIProviderSettings
): Promise<AgentTurnResponse> {
  if (!settings.apiKey || settings.provider === "smart-builtin") {
    return runSmartBuiltinMcpAgent(prompt, project);
  }

  const systemPrompt = `You are a senior motion graphics engineer writing React/Remotion code via Model Context Protocol (MCP) tools.
Design principles:
- Use Swiss editorial / brutalist / high-craft typography, hairline borders, and clean spacing.
- Avoid generic purple/cyan neon gradients or emojis.
- Current videoConfig: ${JSON.stringify(project.videoConfig)}
- Current propsValues: ${JSON.stringify(project.propsValues)}
- Current MainVideo.tsx:
\`\`\`tsx
${project.files["MainVideo.tsx"]?.content || ""}
\`\`\`

Available MCP Tools: ${MCP_TOOLS_LIST.map((t) => t.name).join(", ")}.
Respond ONLY with valid JSON matching:
{
  "reply": "Concise technical summary in Indonesian of what was changed",
  "toolCalls": [
    { "toolName": "tool_name", "args": { ... } }
  ]
}`;

  try {
    if (settings.provider === "gemini") {
      const model = settings.model || "gemini-2.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed.toolCalls)) {
        return {
          reply: parsed.reply || "Perubahan berhasil dieksekusi melalui Gemini MCP.",
          toolCalls: parsed.toolCalls,
        };
      }
    } else if (settings.provider === "openai") {
      const model = settings.model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
      if (Array.isArray(parsed.toolCalls)) {
        return {
          reply: parsed.reply || "Perubahan berhasil dieksekusi melalui OpenAI MCP.",
          toolCalls: parsed.toolCalls,
        };
      }
    }
  } catch (err: any) {
    const fallback = runSmartBuiltinMcpAgent(prompt, project);
    return {
      reply: `*(Koneksi API LLM gagal: ${err.message} — menggunakan Local Rule Parser)*\n\n${fallback.reply}`,
      toolCalls: fallback.toolCalls,
    };
  }

  return runSmartBuiltinMcpAgent(prompt, project);
}
