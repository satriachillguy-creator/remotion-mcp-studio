import { StudioProject, PropSchemaField, SequenceLayer, VideoConfig } from "@/types/studio";

export interface TemplatePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  videoConfig: VideoConfig;
  code: string;
  propsSchema: PropSchemaField[];
  propsValues: Record<string, any>;
  sequences: SequenceLayer[];
}

export const STUDIO_TEMPLATES: TemplatePreset[] = [
  {
    id: "swiss-editorial-reel",
    name: "01 / Minimalist Editorial",
    badge: "9:16 Vertical",
    description:
      "Desain monokrom hitam-putih minimalis dengan tipografi bersih, grid halus, dan ritme pegas modern.",
    videoConfig: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 150,
      aspectRatio: "9:16",
    },
    propsSchema: [
      { key: "headline", label: "Headline", type: "text", defaultValue: "LESS BUT BETTER" },
      { key: "subheadline", label: "Subheadline", type: "text", defaultValue: "Minimalist Programmatic Video Studio" },
      { key: "ctaText", label: "Footer Label", type: "text", defaultValue: "EDITION 01 — MONO" },
      { key: "primaryColor", label: "Primary Ink", type: "color", defaultValue: "#FFFFFF" },
      { key: "accentColor", label: "Muted Ink", type: "color", defaultValue: "#A3A3A3" },
      { key: "bgColor", label: "Background", type: "color", defaultValue: "#000000" },
      { key: "speedMultiplier", label: "Tempo", type: "number", defaultValue: 1, min: 0.4, max: 2.5, step: 0.1 },
      { key: "showGrid", label: "Architectural Lines", type: "boolean", defaultValue: true },
    ],
    propsValues: {
      headline: "LESS BUT BETTER",
      subheadline: "Minimalist Programmatic Video Studio",
      ctaText: "EDITION 01 — MONO",
      primaryColor: "#FFFFFF",
      accentColor: "#A3A3A3",
      bgColor: "#000000",
      speedMultiplier: 1,
      showGrid: true,
    },
    sequences: [
      { id: "seq-grid", name: "Minimalist Frame Structure", from: 0, durationInFrames: 150, color: "#737373" },
      { id: "seq-hero", name: "Display Typography Reveal", from: 0, durationInFrames: 150, color: "#FFFFFF" },
      { id: "seq-specs", name: "Index Specification Rows", from: 28, durationInFrames: 122, color: "#D4D4D4" },
      { id: "seq-footer", name: "Progress & Colophon", from: 60, durationInFrames: 90, color: "#A3A3A3" },
    ],
    code: `import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export default function MinimalistEditorialComposition(props) {
  const {
    headline = "LESS BUT BETTER",
    subheadline = "Minimalist Programmatic Video Studio",
    ctaText = "EDITION 01 — MONO",
    primaryColor = "#FFFFFF",
    accentColor = "#A3A3A3",
    bgColor = "#000000",
    speedMultiplier = 1,
    showGrid = true,
  } = props;

  const rawFrame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const frame = rawFrame * speedMultiplier;

  const titleReveal = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 130, mass: 0.9 },
  });

  const subOpacity = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progressPct = interpolate(rawFrame, [0, durationInFrames - 1], [0, 100], {
    extrapolateRight: 'clamp',
  });

  const seconds = Math.floor(rawFrame / fps);
  const remFrames = rawFrame % fps;
  const timecode = \`00:00:\${String(seconds).padStart(2, '0')}:\${String(remFrames).padStart(2, '0')}\`;

  const specs = [
    { idx: "01", label: "AESTHETIC", value: "PURE MONOCHROME" },
    { idx: "02", label: "PROTOCOL", value: "MCP JSON-RPC 2.0" },
    { idx: "03", label: "ENGINE", value: "REMOTION + WEBCODECS" },
  ];

  const words = String(headline).split(' ');

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        color: primaryColor,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: 72,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Subtle Minimalist Hairline Grid */}
      {showGrid && (
        <AbsoluteFill
          style={{
            padding: 72,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: \`1px solid \${primaryColor}33\`,
          paddingBottom: 24,
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: primaryColor,
            }}
          />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 3,
            }}
          >
            STUDIO // {width}×{height}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 20,
            color: accentColor,
            letterSpacing: 2,
          }}
        >
          {timecode}
        </span>
      </div>

      {/* Center Display Typography */}
      <Sequence from={0} durationInFrames={150} name="Display Typography">
        <div
          style={{
            marginTop: 150,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {words.map((word, i) => {
              const wordSpring = spring({
                frame: frame - i * 5,
                fps,
                config: { damping: 18, stiffness: 140 },
              });
              const isLast = i === words.length - 1;
              return (
                <div key={i} style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: width < 900 ? 74 : 112,
                      fontWeight: isLast ? 300 : 800,
                      fontStyle: isLast ? 'italic' : 'normal',
                      lineHeight: 0.94,
                      letterSpacing: -4,
                      textTransform: 'uppercase',
                      color: primaryColor,
                      transform: \`translateY(\${(1 - wordSpring) * 105}%)\`,
                    }}
                  >
                    {word}
                  </div>
                </div>
              );
            })}
          </div>

          <p
            style={{
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.4,
              color: accentColor,
              maxWidth: '85%',
              margin: 0,
              opacity: subOpacity,
              transform: \`translateY(\${(1 - titleReveal) * 20}px)\`,
            }}
          >
            {subheadline}
          </p>
        </div>
      </Sequence>

      {/* Specification List */}
      <Sequence from={28} durationInFrames={122} name="Specification Index">
        <div
          style={{
            marginTop: 'auto',
            marginBottom: 180,
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            zIndex: 2,
          }}
        >
          {specs.map((row, idx) => {
            const rowProgress = spring({
              frame: frame - 28 - idx * 6,
              fps,
              config: { damping: 20, stiffness: 130 },
            });
            return (
              <div
                key={row.idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '26px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.16)',
                  opacity: rowProgress,
                  transform: \`translateY(\${(1 - rowProgress) * 20}px)\`,
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <span style={{ fontSize: 20, color: accentColor }}>
                    {row.idx}
                  </span>
                  <span style={{ fontSize: 22, color: accentColor }}>
                    {row.label}
                  </span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 600, color: primaryColor, letterSpacing: 1 }}>
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>
      </Sequence>

      {/* Bottom Progress Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: 3 }}>
            {ctaText}
          </span>
          <span style={{ fontSize: 20, color: accentColor }}>
            {Math.round(progressPct)}%
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.14)',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: \`\${progressPct}%\`,
              height: '100%',
              backgroundColor: primaryColor,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}
`,
  },
  {
    id: "linear-product-keynote",
    name: "02 / Monochrome Telemetry",
    badge: "16:9 Widescreen",
    description:
      "Presentasi widescreen minimalis hitam-putih dengan tipografi kontras tinggi dan grafik bar monokrom.",
    videoConfig: {
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 180,
      aspectRatio: "16:9",
    },
    propsSchema: [
      { key: "headline", label: "Keynote Title", type: "text", defaultValue: "Pure Monochrome Precision" },
      { key: "subheadline", label: "Summary", type: "text", defaultValue: "Zero distractions. Direct AST compilation and WebCodecs rendering in the browser." },
      { key: "metricValue", label: "Benchmark Number", type: "number", defaultValue: 99, min: 10, max: 999, step: 1 },
      { key: "metricSuffix", label: "Unit Label", type: "text", defaultValue: ".8% EFFICIENCY" },
      { key: "primaryColor", label: "Primary Ink", type: "color", defaultValue: "#FFFFFF" },
      { key: "accentColor", label: "Secondary Ink", type: "color", defaultValue: "#8E8E93" },
      { key: "bgColor", label: "Surface Background", type: "color", defaultValue: "#000000" },
    ],
    propsValues: {
      headline: "Pure Monochrome Precision",
      subheadline: "Zero distractions. Direct AST compilation and WebCodecs rendering in the browser.",
      metricValue: 99,
      metricSuffix: ".8% EFFICIENCY",
      primaryColor: "#FFFFFF",
      accentColor: "#8E8E93",
      bgColor: "#000000",
    },
    sequences: [
      { id: "seq-header", name: "Keynote Narrative Column", from: 0, durationInFrames: 180, color: "#FFFFFF" },
      { id: "seq-telemetry", name: "Tabular Telemetry Counter", from: 20, durationInFrames: 160, color: "#D4D4D4" },
      { id: "seq-bars", name: "Signal Distribution Array", from: 36, durationInFrames: 144, color: "#737373" },
    ],
    code: `import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export default function MonochromeTelemetryComposition(props) {
  const {
    headline = "Pure Monochrome Precision",
    subheadline = "Zero distractions. Direct AST compilation and WebCodecs rendering in the browser.",
    metricValue = 99,
    metricSuffix = ".8% EFFICIENCY",
    primaryColor = "#FFFFFF",
    accentColor = "#8E8E93",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const counterProgress = interpolate(frame, [20, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentNumber = Math.round(counterProgress * metricValue);

  const series = [24, 38, 46, 58, 52, 74, 68, 86, 92, 100];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        color: primaryColor,
        fontFamily: 'Inter, -apple-system, sans-serif',
        padding: 104,
        display: 'grid',
        gridTemplateColumns: '1.15fr 0.85fr',
        gap: 80,
        alignItems: 'center',
      }}
    >
      {/* Left Narrative Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            alignSelf: 'flex-start',
            padding: '8px 18px',
            border: '1px solid rgba(255,255,255,0.22)',
            fontFamily: 'monospace',
            fontSize: 16,
            letterSpacing: 3,
            color: primaryColor,
          }}
        >
          <span>SYSTEM // TELEMETRY</span>
        </div>

        <h1
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -3,
            margin: 0,
            transform: \`translateY(\${(1 - reveal) * 28}px)\`,
            opacity: reveal,
          }}
        >
          {headline}
        </h1>

        <p
          style={{
            fontSize: 28,
            color: accentColor,
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 760,
            opacity: reveal,
          }}
        >
          {subheadline}
        </p>

        <Sequence from={20} durationInFrames={160} name="Telemetry Counter">
          <div
            style={{
              marginTop: 16,
              paddingTop: 32,
              borderTop: '1px solid rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ fontSize: 88, fontWeight: 700, color: primaryColor, letterSpacing: -3 }}>
              {currentNumber}
            </span>
            <span style={{ fontSize: 28, fontWeight: 500, color: accentColor, letterSpacing: 2 }}>
              {metricSuffix}
            </span>
          </div>
        </Sequence>
      </div>

      {/* Right Monochrome Card */}
      <div
        style={{
          height: 600,
          backgroundColor: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.16)',
          padding: 48,
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
            fontSize: 16,
            color: accentColor,
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            paddingBottom: 20,
            letterSpacing: 2,
          }}
        >
          <span>THROUGHPUT</span>
          <span style={{ color: primaryColor }}>30.0 FPS</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: 360,
            gap: 14,
            paddingTop: 24,
          }}
        >
          {series.map((val, idx) => {
            const barSpring = spring({
              frame: frame - 32 - idx * 4,
              fps,
              config: { damping: 18, stiffness: 130 },
            });
            const isPeak = idx === series.length - 1;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: \`\${Math.max(4, val * barSpring)}%\`,
                  backgroundColor: isPeak ? primaryColor : 'rgba(255,255,255,0.28)',
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            fontSize: 15,
            color: accentColor,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.12)',
            letterSpacing: 1.5,
          }}
        >
          <span>00MS</span>
          <span>MONOCHROME PIPELINE</span>
          <span>16.6MS</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
`,
  },
  {
    id: "brutalist-kinetic-square",
    name: "03 / Kinetic Monochrome",
    badge: "1:1 Square",
    description:
      "Komposisi tipografi hitam-putih kontras tinggi dengan inversi blok kata aktif per ketukan frame.",
    videoConfig: {
      width: 1080,
      height: 1080,
      fps: 30,
      durationInFrames: 120,
      aspectRatio: "1:1",
    },
    propsSchema: [
      { key: "headline", label: "Statement Text", type: "text", defaultValue: "SIMPLICITY IS THE ULTIMATE FORM" },
      { key: "subheadline", label: "Index Label", type: "text", defaultValue: "MONO // ARCHIVE" },
      { key: "primaryColor", label: "Primary Ink", type: "color", defaultValue: "#FFFFFF" },
      { key: "accentColor", label: "Secondary Ink", type: "color", defaultValue: "#737373" },
      { key: "bgColor", label: "Background", type: "color", defaultValue: "#000000" },
    ],
    propsValues: {
      headline: "SIMPLICITY IS THE ULTIMATE FORM",
      subheadline: "MONO // ARCHIVE",
      primaryColor: "#FFFFFF",
      accentColor: "#737373",
      bgColor: "#000000",
    },
    sequences: [
      { id: "seq-words", name: "Inverted Word Matrix", from: 0, durationInFrames: 120, color: "#FFFFFF" },
      { id: "seq-meta", name: "Index Metadata Bar", from: 0, durationInFrames: 120, color: "#737373" },
    ],
    code: `import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion';

export default function KineticMonochromeComposition(props) {
  const {
    headline = "SIMPLICITY IS THE ULTIMATE FORM",
    subheadline = "MONO // ARCHIVE",
    primaryColor = "#FFFFFF",
    accentColor = "#737373",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = String(headline).split(' ').filter(Boolean);

  const activeWordIndex = Math.floor(
    (frame / durationInFrames) * words.length * 1.5
  ) % Math.max(1, words.length);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        fontFamily: 'Inter, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'monospace',
          fontSize: 18,
          color: accentColor,
          letterSpacing: 3,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: 20,
        }}
      >
        <span>{subheadline}</span>
        <span style={{ color: primaryColor }}>F.{String(frame).padStart(3, '0')}</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
        }}
      >
        {words.map((word, index) => {
          const entrance = spring({
            frame: frame - index * 5,
            fps,
            config: { damping: 18, stiffness: 150 },
          });
          const isActive = index === activeWordIndex;
          return (
            <div
              key={index}
              style={{
                padding: '12px 26px',
                backgroundColor: isActive ? primaryColor : 'transparent',
                border: \`1.5px solid \${isActive ? primaryColor : 'rgba(255,255,255,0.22)'}\`,
                color: isActive ? bgColor : primaryColor,
                fontSize: 74,
                fontWeight: 800,
                letterSpacing: -2.5,
                textTransform: 'uppercase',
                transform: \`scale(\${0.9 + entrance * 0.1})\`,
                opacity: entrance,
              }}
            >
              {word}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: 20,
          fontFamily: 'monospace',
          fontSize: 16,
          color: accentColor,
          letterSpacing: 2,
        }}
      >
        <span>1080×1080 // MONO</span>
        <span style={{ color: primaryColor }}>[{activeWordIndex + 1}/{words.length}]</span>
      </div>
    </AbsoluteFill>
  );
}
`,
  },
];

export function createInitialProject(templateId = "swiss-editorial-reel"): StudioProject {
  const tpl =
    STUDIO_TEMPLATES.find((t) => t.id === templateId) || STUDIO_TEMPLATES[0];
  const now = Date.now();
  return {
    id: "proj-default",
    name: tpl.name,
    templateId: tpl.id,
    videoConfig: { ...tpl.videoConfig },
    files: {
      "MainVideo.tsx": {
        path: "MainVideo.tsx",
        content: tpl.code,
        language: "tsx",
        updatedAt: now,
      },
      "schema.json": {
        path: "schema.json",
        content: JSON.stringify(tpl.propsSchema, null, 2),
        language: "json",
        updatedAt: now,
      },
    },
    activeFile: "MainVideo.tsx",
    propsSchema: [...tpl.propsSchema],
    propsValues: { ...tpl.propsValues },
    sequences: [...tpl.sequences],
    diagnostics: {
      hasError: false,
      message: null,
      updatedAt: now,
    },
    version: 1,
  };
}
