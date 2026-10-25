import { SequenceLayer } from "@/types/studio";

const SEQUENCE_COLORS = [
  "#FFFFFF",
  "#D4D4D4",
  "#A3A3A3",
  "#737373",
  "#E5E5E5",
  "#8A8A8A",
];

/**
 * Pure server/client safe regex parser that extracts <Sequence from={...} durationInFrames={...}>
 * from TSX source code without importing client-only Remotion modules.
 */
export function extractSequencesFromCode(
  code: string,
  totalDuration: number
): SequenceLayer[] {
  const layers: SequenceLayer[] = [];
  const regex = /<Sequence\s+([^>]+)>/g;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(code)) !== null) {
    const attrs = match[1];
    const fromMatch = attrs.match(/from=\{(\d+)\}/);
    const durMatch = attrs.match(/durationInFrames=\{(\d+)\}/);
    const nameMatch = attrs.match(/name=["']([^"']+)["']/);

    const from = fromMatch ? parseInt(fromMatch[1], 10) : 0;
    const durationInFrames = durMatch
      ? parseInt(durMatch[1], 10)
      : Math.max(15, totalDuration - from);

    layers.push({
      id: `seq-auto-${idx}`,
      name: nameMatch ? nameMatch[1] : `Sequence #${idx + 1} (f:${from})`,
      from,
      durationInFrames,
      color: SEQUENCE_COLORS[idx % SEQUENCE_COLORS.length],
    });
    idx++;
  }

  if (layers.length === 0) {
    layers.push({
      id: "seq-main",
      name: "Main Composition Layer",
      from: 0,
      durationInFrames: totalDuration,
      color: "#FFFFFF",
    });
  }

  return layers;
}
