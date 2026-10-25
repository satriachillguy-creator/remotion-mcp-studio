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
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
                  <span style={{ fontSize: 20, color: accentColor, fontFamily: 'monospace' }}>
                    {row.idx}
                  </span>
                  <span style={{ fontSize: 22, color: accentColor, letterSpacing: 1, marginRight: 16 }}>
                    {row.label}
                  </span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, color: primaryColor, letterSpacing: 1, textAlign: 'right', flexShrink: 0 }}>
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
  {
    id: "umkm-promo-flashsale",
    name: "04 / Promo Flash Sale UMKM",
    badge: "9:16 Flash Sale",
    description:
      "Video promo penjualan untuk TikTok Shop, Shopee & Reels. Menampilkan badge diskon, harga coret, dan animasi tombol beli.",
    videoConfig: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 150,
      aspectRatio: "9:16",
    },
    propsSchema: [
      { key: "productName", label: "Nama Produk", type: "text", defaultValue: "OVERSIZED HEAVYWEIGHT TEE" },
      { key: "discountTag", label: "Label Diskon", type: "text", defaultValue: "FLASH SALE 50% OFF" },
      { key: "normalPrice", label: "Harga Normal", type: "text", defaultValue: "Rp 199.000" },
      { key: "promoPrice", label: "Harga Promo", type: "text", defaultValue: "Rp 99.000" },
      { key: "storeName", label: "Nama Toko", type: "text", defaultValue: "OFFICIAL STORE // TIKTOK SHOP" },
      { key: "ctaText", label: "Tombol Aksi", type: "text", defaultValue: "CHECKOUT DI KERANJANG KUNING" },
      { key: "primaryColor", label: "Warna Utama", type: "color", defaultValue: "#FFFFFF" },
      { key: "accentColor", label: "Warna Aksen", type: "color", defaultValue: "#A3A3A3" },
      { key: "bgColor", label: "Warna Background", type: "color", defaultValue: "#000000" },
    ],
    propsValues: {
      productName: "OVERSIZED HEAVYWEIGHT TEE",
      discountTag: "FLASH SALE 50% OFF",
      normalPrice: "Rp 199.000",
      promoPrice: "Rp 99.000",
      storeName: "OFFICIAL STORE // TIKTOK SHOP",
      ctaText: "CHECKOUT DI KERANJANG KUNING",
      primaryColor: "#FFFFFF",
      accentColor: "#A3A3A3",
      bgColor: "#000000",
    },
    sequences: [
      { id: "seq-badge", name: "Badge Diskon Flash Sale", from: 0, durationInFrames: 150, color: "#FFFFFF" },
      { id: "seq-prod", name: "Judul Produk Kinetik", from: 10, durationInFrames: 140, color: "#D4D4D4" },
      { id: "seq-price", name: "Coret Harga & Harga Hemat", from: 25, durationInFrames: 125, color: "#FFFFFF" },
      { id: "seq-cta", name: "Tombol Keranjang Kuning", from: 45, durationInFrames: 105, color: "#A3A3A3" },
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

export default function UmkmPromoFlashSaleComposition(props) {
  const {
    productName = "OVERSIZED HEAVYWEIGHT TEE",
    discountTag = "FLASH SALE 50% OFF",
    normalPrice = "Rp 199.000",
    promoPrice = "Rp 99.000",
    storeName = "OFFICIAL STORE // TIKTOK SHOP",
    ctaText = "CHECKOUT DI KERANJANG KUNING",
    primaryColor = "#FFFFFF",
    accentColor = "#A3A3A3",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const badgeSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 140 } });
  const priceSpring = spring({ frame: frame - 25, fps, config: { damping: 16, stiffness: 160 } });
  const ctaSpring = spring({ frame: frame - 45, fps, config: { damping: 15, stiffness: 150 } });

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        color: primaryColor,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: 64,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header Store & Timer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: \`1px solid rgba(255,255,255,0.18)\`,
          paddingBottom: 22,
          fontFamily: 'monospace',
          fontSize: 20,
          letterSpacing: 2,
        }}
      >
        <span style={{ color: accentColor }}>{storeName}</span>
        <span style={{ color: primaryColor, fontWeight: 700 }}>LIVE PROMO</span>
      </div>

      {/* Main Flash Sale Body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, marginTop: 40 }}>
        {/* Flash Sale Tag */}
        <Sequence from={0} durationInFrames={150} name="Badge Diskon">
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              padding: '12px 28px',
              borderRadius: 999,
              backgroundColor: primaryColor,
              color: bgColor,
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 3,
              transform: \`scale(\${badgeSpring})\`,
              transformOrigin: 'left center',
            }}
          >
            {discountTag}
          </div>
        </Sequence>

        {/* Product Name */}
        <Sequence from={10} durationInFrames={140} name="Nama Produk">
          <h1
            style={{
              fontSize: 84,
              fontWeight: 900,
              lineHeight: 0.96,
              letterSpacing: -3,
              textTransform: 'uppercase',
              margin: 0,
              transform: \`translateY(\${(1 - titleSpring) * 40}px)\`,
              opacity: titleSpring,
            }}
          >
            {productName}
          </h1>
        </Sequence>

        {/* Price Tag with Strikethrough */}
        <Sequence from={25} durationInFrames={125} name="Harga Coret & Promo">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '28px 0',
              borderTop: '1px solid rgba(255,255,255,0.14)',
              borderBottom: '1px solid rgba(255,255,255,0.14)',
              transform: \`translateY(\${(1 - priceSpring) * 30}px)\`,
              opacity: priceSpring,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 28, color: accentColor, textDecoration: 'line-through' }}>
                {normalPrice}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontFamily: 'monospace',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: accentColor,
                }}
              >
                HEMAT
              </span>
            </div>
            <div
              style={{
                fontSize: 92,
                fontWeight: 900,
                color: primaryColor,
                letterSpacing: -2,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {promoPrice}
            </div>
          </div>
        </Sequence>
      </div>

      {/* Footer CTA & Progress */}
      <Sequence from={45} durationInFrames={105} name="Tombol Checkout">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            transform: \`translateY(\${(1 - ctaSpring) * 20}px)\`,
            opacity: ctaSpring,
          }}
        >
          <div
            style={{
              width: '100%',
              padding: '28px 24px',
              backgroundColor: primaryColor,
              color: bgColor,
              borderRadius: 18,
              textAlign: 'center',
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <span>👉</span>
            <span>{ctaText}</span>
          </div>

          <div
            style={{
              width: '100%',
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.16)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: \`\${progress}%\`,
                height: '100%',
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}
`,
  },
  {
    id: "umkm-review-testimoni",
    name: "05 / Testimoni & Review UMKM",
    badge: "9:16 Testimoni",
    description:
      "Video ulasan kepuasan pembeli dengan rating bintang 5, kutipan testimoni, dan lencana pembeli terverifikasi.",
    videoConfig: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 150,
      aspectRatio: "9:16",
    },
    propsSchema: [
      { key: "customerName", label: "Nama Pembeli", type: "text", defaultValue: "Rian Pratama (@rian.p)" },
      { key: "customerReview", label: "Kutipan Review", type: "text", defaultValue: "Jujur bahan bajunya tebel banget dan adem! Jahitannya rapi, pengiriman cuma 1 hari sampai. Bakal repeat order lagi sih!" },
      { key: "productName", label: "Produk Dibeli", type: "text", defaultValue: "Heavyweight Boxy Tee (Size L)" },
      { key: "ratingScore", label: "Rating Bintang", type: "text", defaultValue: "★★★★★ (5.0 / 5.0)" },
      { key: "verifiedBadge", label: "Lencana Verifikasi", type: "text", defaultValue: "VERIFIED BUYER // PESANAN SELESAI" },
      { key: "primaryColor", label: "Warna Utama", type: "color", defaultValue: "#FFFFFF" },
      { key: "accentColor", label: "Warna Aksen", type: "color", defaultValue: "#A3A3A3" },
      { key: "bgColor", label: "Warna Background", type: "color", defaultValue: "#000000" },
    ],
    propsValues: {
      customerName: "Rian Pratama (@rian.p)",
      customerReview: "Jujur bahan bajunya tebel banget dan adem! Jahitannya rapi, pengiriman cuma 1 hari sampai. Bakal repeat order lagi sih!",
      productName: "Heavyweight Boxy Tee (Size L)",
      ratingScore: "★★★★★ (5.0 / 5.0)",
      verifiedBadge: "VERIFIED BUYER // PESANAN SELESAI",
      primaryColor: "#FFFFFF",
      accentColor: "#A3A3A3",
      bgColor: "#000000",
    },
    sequences: [
      { id: "seq-stars", name: "Rating 5 Bintang", from: 0, durationInFrames: 150, color: "#FFFFFF" },
      { id: "seq-quote", name: "Kutipan Testimoni", from: 15, durationInFrames: 135, color: "#D4D4D4" },
      { id: "seq-buyer", name: "Identitas Pembeli", from: 35, durationInFrames: 115, color: "#FFFFFF" },
      { id: "seq-badge", name: "Lencana Pembeli Terverifikasi", from: 55, durationInFrames: 95, color: "#A3A3A3" },
    ],
    code: `import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion';

export default function UmkmReviewTestimoniComposition(props) {
  const {
    customerName = "Rian Pratama (@rian.p)",
    customerReview = "Jujur bahan bajunya tebel banget dan adem! Jahitannya rapi, pengiriman cuma 1 hari sampai. Bakal repeat order lagi sih!",
    productName = "Heavyweight Boxy Tee (Size L)",
    ratingScore = "★★★★★ (5.0 / 5.0)",
    verifiedBadge = "VERIFIED BUYER // PESANAN SELESAI",
    primaryColor = "#FFFFFF",
    accentColor = "#A3A3A3",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const starSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const quoteSpring = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 130 } });
  const userSpring = spring({ frame: frame - 35, fps, config: { damping: 16, stiffness: 150 } });

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
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.18)',
          paddingBottom: 24,
          fontFamily: 'monospace',
          fontSize: 20,
          color: accentColor,
        }}
      >
        <span>CUSTOMER REVIEW</span>
        <span style={{ color: primaryColor, fontWeight: 700 }}>100% REAL</span>
      </div>

      {/* Main Review Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          padding: '48px 40px',
          borderRadius: 24,
          backgroundColor: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        {/* Rating Stars */}
        <Sequence from={0} durationInFrames={150} name="Rating Stars">
          <div
            style={{
              fontSize: 36,
              color: primaryColor,
              letterSpacing: 6,
              transform: \`scale(\${starSpring})\`,
              transformOrigin: 'left center',
            }}
          >
            {ratingScore}
          </div>
        </Sequence>

        {/* Quote */}
        <Sequence from={15} durationInFrames={135} name="Review Text">
          <p
            style={{
              fontSize: 44,
              fontWeight: 500,
              lineHeight: 1.35,
              color: primaryColor,
              margin: 0,
              transform: \`translateY(\${(1 - quoteSpring) * 30}px)\`,
              opacity: quoteSpring,
            }}
          >
            "{customerReview}"
          </p>
        </Sequence>

        {/* Customer Details */}
        <Sequence from={35} durationInFrames={115} name="Customer Details">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 24,
              transform: \`translateY(\${(1 - userSpring) * 20}px)\`,
              opacity: userSpring,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 700, color: primaryColor }}>
              {customerName}
            </span>
            <span style={{ fontSize: 20, color: accentColor, fontFamily: 'monospace' }}>
              Beli: {productName}
            </span>
          </div>
        </Sequence>
      </div>

      {/* Bottom Verified Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'monospace',
          fontSize: 20,
          color: accentColor,
          borderTop: '1px solid rgba(255,255,255,0.18)',
          paddingTop: 24,
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: primaryColor }} />
        <span>{verifiedBadge}</span>
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
