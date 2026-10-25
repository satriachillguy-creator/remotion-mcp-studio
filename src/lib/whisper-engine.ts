"use client";

export interface WhisperChunk {
  text: string;
  timestamp: [number, number | null];
}

export interface WhisperTranscriptionResult {
  text: string;
  chunks: WhisperChunk[];
  durationSeconds: number;
  language: string;
}

export interface WhisperDownloadProgress {
  status: "initiating" | "download" | "progress" | "done" | "ready" | "error";
  file?: string;
  progress: number;
  loaded?: number;
  total?: number;
  message: string;
}

export type WhisperModelId = "Xenova/whisper-tiny" | "Xenova/whisper-base";

let cachedTranscriber: any = null;
let cachedModelId: string | null = null;

/**
 * Dynamically imports Transformers.js in the browser (WebAssembly / ONNX Runtime Web)
 * without triggering Next.js server-side webpack bundling issues.
 */
async function loadTransformersModule(): Promise<any> {
  const importer = new Function(
    'return import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2")'
  );
  const mod = await importer();
  if (mod.env) {
    mod.env.allowLocalModels = false;
    mod.env.useBrowserCache = true;
  }
  return mod;
}

/**
 * Downloads and initializes the Whisper ASR ONNX model in the browser Cache API.
 */
export async function installWhisperModel(
  modelId: WhisperModelId = "Xenova/whisper-tiny",
  onProgress?: (prog: WhisperDownloadProgress) => void
): Promise<boolean> {
  try {
    onProgress?.({
      status: "initiating",
      progress: 2,
      message: `INITIALIZING ONNX RUNTIME // ${modelId.toUpperCase()}`,
    });

    const { pipeline } = await loadTransformersModule();

    const transcriber = await pipeline("automatic-speech-recognition", modelId, {
      quantized: true,
      progress_callback: (data: any) => {
        if (!onProgress) return;
        const pct =
          typeof data.progress === "number"
            ? Math.round(data.progress)
            : data.status === "ready"
            ? 100
            : 15;

        const fileLabel = data.file ? data.file.split("/").pop() : "weights.onnx";
        onProgress({
          status: data.status || "progress",
          file: fileLabel,
          progress: pct,
          loaded: data.loaded,
          total: data.total,
          message:
            data.status === "ready"
              ? `WHISPER READY // ${modelId}`
              : `DOWNLOADING ${fileLabel} (${pct}%)`,
        });
      },
    });

    cachedTranscriber = transcriber;
    cachedModelId = modelId;

    if (typeof window !== "undefined") {
      localStorage.setItem("kinetic_whisper_installed_model", modelId);
    }

    onProgress?.({
      status: "ready",
      progress: 100,
      message: `INSTALLED // ${modelId.toUpperCase()} READY IN CACHE`,
    });

    return true;
  } catch (err: any) {
    onProgress?.({
      status: "error",
      progress: 0,
      message: `INSTALL FAILED: ${err?.message || "Network or WebAssembly error"}`,
    });
    throw err;
  }
}

/**
 * Decodes audio from a Video (.mp4, .webm, .mov) or Audio (.mp3, .wav, .m4a) file
 * into a 16kHz mono Float32Array for Whisper inference.
 */
export async function extractAudioFloat32FromMedia(
  file: File
): Promise<{ audioData: Float32Array; durationSeconds: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx({ sampleRate: 16000 });

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const durationSeconds = audioBuffer.duration;

    // Mix down to mono 16kHz
    let audioData: Float32Array;
    if (audioBuffer.numberOfChannels === 2) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      audioData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2;
      }
    } else {
      audioData = audioBuffer.getChannelData(0);
    }

    return { audioData, durationSeconds };
  } finally {
    await audioCtx.close().catch(() => {});
  }
}

/**
 * Runs Whisper speech-to-text transcription with timestamps on a video/audio file.
 */
export async function transcribeMediaWithWhisper(
  file: File,
  modelId: WhisperModelId = "Xenova/whisper-tiny",
  language = "indonesian",
  onStatus?: (msg: string) => void
): Promise<WhisperTranscriptionResult> {
  if (!cachedTranscriber || cachedModelId !== modelId) {
    onStatus?.(`LOADING MODEL ${modelId.toUpperCase()}...`);
    await installWhisperModel(modelId, (p) => onStatus?.(p.message));
  }

  onStatus?.(`EXTRACTING 16KHZ PCM AUDIO FROM ${file.name.toUpperCase()}...`);
  const { audioData, durationSeconds } = await extractAudioFloat32FromMedia(file);

  onStatus?.(
    `TRANSCRIBING AUDIO (${durationSeconds.toFixed(1)}S) VIA WHISPER ONNX...`
  );

  const output = await cachedTranscriber(audioData, {
    language: language === "auto" ? undefined : language,
    task: "transcribe",
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  const rawChunks: WhisperChunk[] = Array.isArray(output?.chunks)
    ? output.chunks.map((c: any) => ({
        text: String(c.text || "").trim(),
        timestamp: [
          Number(c.timestamp?.[0] ?? 0),
          c.timestamp?.[1] !== null && c.timestamp?.[1] !== undefined
            ? Number(c.timestamp[1])
            : durationSeconds,
        ] as [number, number],
      }))
    : [
        {
          text: String(output?.text || "").trim(),
          timestamp: [0, durationSeconds],
        },
      ];

  const nonEmptyChunks = rawChunks.filter((c) => c.text.length > 0);

  return {
    text: String(output?.text || "").trim(),
    chunks: nonEmptyChunks,
    durationSeconds,
    language,
  };
}

/**
 * Generates a Remotion TSX composition with frame-synchronized <Sequence> caption blocks
 * from Whisper timestamp chunks.
 */
export function generateWhisperCaptionRemotionCode(
  chunks: WhisperChunk[],
  fps: number,
  mediaUrl?: string,
  isVideoFile?: boolean
): string {
  const serializedChunks = JSON.stringify(
    chunks.map((c, idx) => {
      const startSec = c.timestamp[0] ?? 0;
      const endSec = c.timestamp[1] ?? startSec + 2.5;
      const from = Math.max(0, Math.round(startSec * fps));
      const durationInFrames = Math.max(12, Math.round((endSec - startSec) * fps));
      return {
        id: idx + 1,
        text: c.text,
        from,
        durationInFrames,
        startSec: Number(startSec.toFixed(2)),
        endSec: Number(endSec.toFixed(2)),
      };
    }),
    null,
    2
  );

  const sequenceTagsComment = chunks
    .map((c, idx) => {
      const startSec = c.timestamp[0] ?? 0;
      const endSec = c.timestamp[1] ?? startSec + 2.5;
      const from = Math.max(0, Math.round(startSec * fps));
      const dur = Math.max(12, Math.round((endSec - startSec) * fps));
      const shortLabel = c.text.slice(0, 22).replace(/["']/g, "");
      return `      {/* <Sequence from={${from}} durationInFrames={${dur}} name="Cap #${idx + 1}: ${shortLabel}"> */}`;
    })
    .join("\n");

  return `import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Video,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

const WHISPER_SEGMENTS = ${serializedChunks};
const SOURCE_MEDIA_URL = ${mediaUrl ? JSON.stringify(mediaUrl) : "null"};
const IS_VIDEO_MEDIA = ${Boolean(isVideoFile)};

export default function WhisperCaptionedComposition(props) {
  const {
    headline = "WHISPER // AUTO TRANSCRIPT",
    subheadline = "SYNCHRONIZED TIME-ALIGNED CAPTIONS",
    primaryColor = "#FFFFFF",
    accentColor = "#A3A3A3",
    bgColor = "#000000",
  } = props;

  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const progressPct = interpolate(frame, [0, durationInFrames - 1], [0, 100], {
    extrapolateRight: 'clamp',
  });

  const activeSegment =
    WHISPER_SEGMENTS.find(
      (s) => frame >= s.from && frame < s.from + s.durationInFrames
    ) || WHISPER_SEGMENTS[WHISPER_SEGMENTS.length - 1];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        color: accentColor,
        fontFamily: 'Inter, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
${sequenceTagsComment}
      {/* Optional Uploaded Media Layer */}
      {SOURCE_MEDIA_URL && IS_VIDEO_MEDIA && (
        <AbsoluteFill style={{ opacity: 0.72 }}>
          <Video
            src={SOURCE_MEDIA_URL}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      )}
      {SOURCE_MEDIA_URL && !IS_VIDEO_MEDIA && <Audio src={SOURCE_MEDIA_URL} />}

      {/* Dark Vignette Overlay for Caption Readability */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.85) 0%, rgba(9,9,11,0.25) 45%, rgba(9,9,11,0.92) 100%)',
          padding: 64,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top Metadata Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: 20,
            fontFamily: 'monospace',
            fontSize: 20,
            letterSpacing: 1.5,
          }}
        >
          <span style={{ color: primaryColor, fontWeight: 700 }}>{headline}</span>
          <span>
            SEG {activeSegment ? activeSegment.id : 0} / {WHISPER_SEGMENTS.length}
          </span>
        </div>

        {/* Synchronized Whisper Caption Sequences */}
        {WHISPER_SEGMENTS.map((seg) => (
          <Sequence
            key={seg.id}
            from={seg.from}
            durationInFrames={seg.durationInFrames}
            name={\`Caption #\${seg.id}\`}
          >
            {(() => {
              const localFrame = frame - seg.from;
              const pop = spring({
                frame: localFrame,
                fps,
                config: { damping: 16, stiffness: 160 },
              });
              const words = seg.text.split(' ').filter(Boolean);
              const activeWordIdx = Math.min(
                words.length - 1,
                Math.floor((localFrame / Math.max(1, seg.durationInFrames)) * words.length)
              );

              return (
                <div
                  style={{
                    position: 'absolute',
                    left: 64,
                    right: 64,
                    bottom: height * 0.16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    transform: \`translateY(\${(1 - pop) * 28}px)\`,
                    opacity: pop,
                  }}
                >
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      padding: '6px 14px',
                      backgroundColor: primaryColor,
                      color: '#09090B',
                      fontFamily: 'monospace',
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {seg.startSec.toFixed(2)}s → {seg.endSec.toFixed(2)}s
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 14,
                      padding: '32px 36px',
                      backgroundColor: 'rgba(12, 12, 14, 0.88)',
                      border: '1px solid rgba(255,255,255,0.22)',
                    }}
                  >
                    {words.map((w, wIdx) => {
                      const isCurrent = wIdx === activeWordIdx;
                      return (
                        <span
                          key={wIdx}
                          style={{
                            fontSize: width < 900 ? 52 : 64,
                            fontWeight: 900,
                            lineHeight: 1.1,
                            padding: '4px 12px',
                            backgroundColor: isCurrent ? primaryColor : 'transparent',
                            color: isCurrent ? '#09090B' : accentColor,
                            textTransform: 'uppercase',
                          }}
                        >
                          {w}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </Sequence>
        ))}

        {/* Bottom Progress & Subhead */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              fontSize: 18,
              color: 'rgba(244,244,246,0.6)',
            }}
          >
            <span>{subheadline}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.14)' }}>
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
    </AbsoluteFill>
  );
}
`;
}

