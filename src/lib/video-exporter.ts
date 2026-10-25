import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { toCanvas } from "html-to-image";
import { StudioProject } from "@/types/studio";

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
  statusText: string;
}

/**
 * Fallback deterministic canvas renderer if DOM capture is blocked by browser security policy.
 */
function drawFallbackFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  project: StudioProject,
  frame: number
) {
  const { width, height, fps, durationInFrames } = project.videoConfig;
  const props = project.propsValues;

  const bgColor = props.bgColor || "#000000";
  const primaryColor = props.primaryColor || "#FFFFFF";
  const accentColor = props.accentColor || "#A3A3A3";
  const headline = String(props.headline || project.name);
  const subheadline = String(props.subheadline || "REMOTION // MCP STUDIO");
  const ctaText = String(props.ctaText || "ARCHIVE");

  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const seconds = Math.floor(frame / fps);
  const remFrames = frame % fps;
  const timecode = `00:00:${String(seconds).padStart(2, "0")}:${String(remFrames).padStart(2, "0")}`;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Structural hairline border
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 64, width - 128, height - 128);

  // Top Header
  ctx.fillStyle = primaryColor;
  ctx.fillRect(96, 96, 20, 20);
  ctx.fillStyle = accentColor;
  ctx.font = "700 22px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SYS.REMOTION // ${width}x${height}`, 132, 114);

  ctx.fillStyle = primaryColor;
  ctx.textAlign = "right";
  ctx.fillText(timecode, width - 96, 114);

  // Headline
  ctx.textAlign = "left";
  ctx.fillStyle = accentColor;
  const fontSize = width >= 1400 ? 84 : 88;
  ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;

  const words = headline.toUpperCase().split(" ");
  words.forEach((word, idx) => {
    ctx.fillStyle = idx === words.length - 1 ? primaryColor : accentColor;
    ctx.fillText(word, 96, height * 0.34 + idx * (fontSize * 1.05));
  });

  // Subheadline
  ctx.fillStyle = "rgba(244,244,246,0.68)";
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  ctx.fillText(
    subheadline.slice(0, 58),
    96,
    height * 0.34 + words.length * (fontSize * 1.05) + 32
  );

  // Bottom bar
  ctx.fillStyle = accentColor;
  ctx.font = "700 24px monospace";
  ctx.fillText(ctaText, 96, height - 124);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(96, height - 96, width - 192, 10);
  ctx.fillStyle = primaryColor;
  ctx.fillRect(96, height - 96, (width - 192) * progress, 10);
}

/**
 * Captures the actual rendered Remotion <Player /> DOM container frame-by-frame
 * and encodes it to H.264 .mp4 via WebCodecs + mp4-muxer.
 */
export async function exportProjectToMp4(
  project: StudioProject,
  onProgress: (p: ExportProgress) => void,
  onSeekFrame?: (frame: number) => void,
  playerDomElement?: HTMLElement | null
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const width = Math.floor(project.videoConfig.width / 2) * 2;
  const height = Math.floor(project.videoConfig.height / 2) * 2;
  const fps = project.videoConfig.fps;
  const totalFrames = project.videoConfig.durationInFrames;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia.");
  }

  const renderFrameToCanvas = async (frame: number) => {
    if (onSeekFrame) {
      onSeekFrame(frame);
      // Wait for React & @remotion/player to paint the new frame
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      );
    }

    if (playerDomElement) {
      try {
        const capturedCanvas = await toCanvas(playerDomElement, {
          canvasWidth: width,
          canvasHeight: height,
          pixelRatio: 1,
          skipAutoScale: true,
          cacheBust: false,
        });
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(capturedCanvas, 0, 0, width, height);
        return;
      } catch {
        // Fallback if DOM capture fails on a specific element
      }
    }

    drawFallbackFrameToCanvas(ctx, project, frame);
  };

  const hasWebCodecs =
    typeof window !== "undefined" &&
    "VideoEncoder" in window &&
    "VideoFrame" in window;

  if (hasWebCodecs) {
    try {
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: {
          codec: "avc",
          width,
          height,
        },
        fastStart: "in-memory",
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => {
          muxer.addVideoChunk(chunk, meta);
        },
        error: (err) => {
          console.error("WebCodecs VideoEncoder error:", err);
        },
      });

      encoder.configure({
        codec: "avc1.640033",
        width,
        height,
        bitrate: 6_000_000,
        framerate: fps,
      });

      for (let frame = 0; frame < totalFrames; frame++) {
        await renderFrameToCanvas(frame);

        const timestampUs = Math.round((frame / fps) * 1_000_000);
        const durationUs = Math.round((1 / fps) * 1_000_000);

        const videoFrame = new VideoFrame(canvas, {
          timestamp: timestampUs,
          duration: durationUs,
        });

        encoder.encode(videoFrame, { keyFrame: frame % fps === 0 });
        videoFrame.close();

        onProgress({
          currentFrame: frame + 1,
          totalFrames,
          percent: Math.round(((frame + 1) / totalFrames) * 100),
          statusText: `ENCODING H.264 // FRAME ${String(frame + 1).padStart(3, "0")} OF ${totalFrames}`,
        });
      }

      await encoder.flush();
      muxer.finalize();

      const buffer = target.buffer;
      const blob = new Blob([buffer], { type: "video/mp4" });
      const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        blob,
        filename: `${safeName}-${project.videoConfig.aspectRatio.replace(":", "x")}.mp4`,
        mimeType: "video/mp4",
      };
    } catch (webCodecsErr) {
      console.warn("WebCodecs fallback triggered:", webCodecsErr);
    }
  }

  // Fallback: MediaRecorder stream
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/mp4")
    ? "video/mp4"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  for (let frame = 0; frame < totalFrames; frame++) {
    await renderFrameToCanvas(frame);
    onProgress({
      currentFrame: frame + 1,
      totalFrames,
      percent: Math.round(((frame + 1) / totalFrames) * 100),
      statusText: `STREAM CAPTURE // FRAME ${String(frame + 1).padStart(3, "0")} OF ${totalFrames}`,
    });
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });

  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    blob: new Blob(chunks, { type: mimeType }),
    filename: `${safeName}.${ext}`,
    mimeType,
  };
}
