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
  const masterArgs: Record<string, any> = { action: "orchestrate" };
  const explanations: string[] = [];

  // 1. Template selection
  if (lower.includes("flash sale") || lower.includes("flashsale") || lower.includes("promo umkm") || lower.includes("diskon")) {
    masterArgs.templateId = "umkm-promo-flashsale";
    explanations.push("Menerapkan template **Promo Flash Sale UMKM (9:16)**.");
  } else if (lower.includes("review") || lower.includes("testimoni") || lower.includes("ulasan") || lower.includes("bintang 5")) {
    masterArgs.templateId = "umkm-review-testimoni";
    explanations.push("Menerapkan template **Testimoni & Review UMKM (9:16)**.");
  } else if (lower.includes("keynote") || lower.includes("telemetry") || lower.includes("dashboard")) {
    masterArgs.templateId = "linear-product-keynote";
    explanations.push("Menerapkan template **Monochrome Telemetry (16:9)**.");
  } else if (lower.includes("kinetic") || lower.includes("square") || lower.includes("poster")) {
    masterArgs.templateId = "brutalist-kinetic-square";
    explanations.push("Menerapkan template **Kinetic Monochrome (1:1)**.");
  } else if (lower.includes("editorial") || lower.includes("swiss")) {
    masterArgs.templateId = "swiss-editorial-reel";
    explanations.push("Menerapkan template **Minimalist Editorial (9:16)**.");
  }

  // 2. Aspect Ratio & Dimensions
  const videoConfigUpdates: Record<string, any> = {};
  if (
    lower.includes("16:9") ||
    lower.includes("youtube") ||
    lower.includes("laptop") ||
    lower.includes("landscape") ||
    lower.includes("widescreen")
  ) {
    videoConfigUpdates.aspectRatio = "16:9";
    explanations.push("Mengatur dimensi kanvas ke **16:9 (1920×1080)**.");
  } else if (
    lower.includes("9:16") ||
    lower.includes("tiktok") ||
    lower.includes("reels") ||
    lower.includes("vertikal") ||
    lower.includes("hp")
  ) {
    videoConfigUpdates.aspectRatio = "9:16";
    explanations.push("Mengatur dimensi kanvas ke **9:16 (1080×1920)**.");
  } else if (lower.includes("1:1") || lower.includes("square") || lower.includes("kotak")) {
    videoConfigUpdates.aspectRatio = "1:1";
    explanations.push("Mengatur dimensi kanvas ke **1:1 (1080×1080)**.");
  }

  // Duration & FPS
  const secMatch = lower.match(/(\d+)\s*(detik|second|sec|s\b)/);
  if (secMatch) {
    const secs = Math.min(30, Math.max(2, parseInt(secMatch[1], 10)));
    const targetFps = lower.includes("60 fps") || lower.includes("60fps") ? 60 : project.videoConfig.fps;
    videoConfigUpdates.durationInFrames = secs * targetFps;
    explanations.push(`Mengatur durasi video menjadi **${secs} detik (${secs * targetFps} frame)**.`);
  }
  if (lower.includes("60 fps") || lower.includes("60fps")) {
    videoConfigUpdates.fps = 60;
    explanations.push("Mengatur frame rate menjadi **60 FPS**.");
  } else if (lower.includes("30 fps") || lower.includes("30fps")) {
    videoConfigUpdates.fps = 30;
    explanations.push("Mengatur frame rate menjadi **30 FPS**.");
  }
  if (Object.keys(videoConfigUpdates).length > 0) {
    masterArgs.videoConfig = videoConfigUpdates;
  }

  // 3. Visual Properties & Content
  const propsUpdates: Record<string, any> = {};

  const quoteMatch = prompt.match(/["']([^"']+)["']/);
  if (quoteMatch) {
    propsUpdates.headline = quoteMatch[1];
    propsUpdates.productName = quoteMatch[1];
    explanations.push(`Memperbarui teks konten menjadi **"${quoteMatch[1]}"**.`);
  }

  // Colors
  for (const [colorName, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(`warna ${colorName}`) || lower.includes(`${colorName} color`)) {
      if (colorName === "putih" || colorName === "white") {
        propsUpdates.primaryColor = "#000000";
        propsUpdates.bgColor = "#FFFFFF";
        propsUpdates.accentColor = "#525252";
        explanations.push("Mengubah skema warna ke **Light Mode Monokrom**.");
      } else if (colorName === "hitam" || colorName === "black") {
        propsUpdates.primaryColor = "#FFFFFF";
        propsUpdates.bgColor = "#000000";
        propsUpdates.accentColor = "#A3A3A3";
        explanations.push("Mengubah skema warna ke **Dark Mode Monokrom**.");
      } else {
        propsUpdates.accentColor = hex;
        explanations.push(`Mengatur warna aksen ke **${colorName.toUpperCase()}** (\`${hex}\`).`);
      }
      break;
    }
  }

  if (Object.keys(propsUpdates).length > 0) {
    masterArgs.props = propsUpdates;
  }

  // 4. Code Generation
  if (lower.includes("countdown") || lower.includes("hitung mundur") || lower.includes("timer")) {
    masterArgs.code = buildCountdownRemotionCode();
    explanations.push("Membuat kode komponen baru **Countdown Dial Kinetik** di `MainVideo.tsx`.");
  } else if (lower.includes("campaign") || lower.includes("editorial")) {
    masterArgs.code = buildEditorialPromoCode();
    explanations.push("Membuat kode komponen baru **Editorial Campaign Display** di `MainVideo.tsx`.");
  }

  // 5. UI & Playback Controls
  if (lower.includes("safe zone") || lower.includes("zona aman")) {
    const isDisable = lower.includes("matikan") || lower.includes("tutup") || lower.includes("off");
    masterArgs.safeZone = !isDisable;
    explanations.push(`Mengatur overlay Safe Zone TikTok/Reels ke **${!isDisable ? "AKTIF" : "NONAKTIF"}**.`);
  }

  if (lower.includes("buka kode") || lower.includes("lihat kode") || lower.includes("tab code")) {
    masterArgs.activeTab = "code";
    explanations.push("Membuka tab **Code Editor**.");
  } else if (lower.includes("inspector") || lower.includes("kontrol")) {
    masterArgs.activeTab = "controls";
    explanations.push("Membuka tab **Property Inspector**.");
  }

  if (lower.includes("putar") || lower.includes("play")) {
    masterArgs.playbackAction = "play";
    explanations.push("Memulai pemutaran video di player.");
  } else if (lower.includes("jeda") || lower.includes("pause") || lower.includes("stop")) {
    masterArgs.playbackAction = "pause";
    explanations.push("Menjeda video di player.");
  } else if (lower.includes("ulang") || lower.includes("restart")) {
    masterArgs.playbackAction = "restart";
    explanations.push("Memutar ulang video dari frame 0.");
  }

  if (
    !masterArgs.templateId &&
    !masterArgs.videoConfig &&
    !masterArgs.props &&
    !masterArgs.code &&
    masterArgs.safeZone === undefined &&
    !masterArgs.activeTab &&
    !masterArgs.playbackAction
  ) {
    const cleanText = prompt.length <= 42 ? prompt.toUpperCase() : prompt.slice(0, 38).toUpperCase();
    masterArgs.props = { headline: cleanText, productName: cleanText };
    explanations.push(`Memperbarui judul video menjadi **"${cleanText}"**.`);
  }

  const toolCalls: AgentToolCall[] = [
    {
      toolName: "manage_studio",
      args: masterArgs,
    },
  ];

  const reply = [
    "**[Studio Omni Master Tool → Eksekusi Penuh]**",
    ...explanations.map((e) => `- ${e}`),
    "",
    "Semua perubahan telah disinkronkan ke dalam studio secara serentak.",
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
