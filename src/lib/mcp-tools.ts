import { StudioProject, PropSchemaField, VideoConfig } from "@/types/studio";
import { STUDIO_TEMPLATES } from "@/lib/templates";
import { extractSequencesFromCode } from "@/lib/sequence-parser";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MASTER_STUDIO_TOOL: McpToolDefinition = {
  name: "manage_studio",
  description:
    "Omni Master Tool: Memberikan kendali penuh 100% kepada AI untuk mengontrol semua fitur PocketMotion & Remotion Studio dalam 1 pemanggilan terpadu. AI dapat mengubah template, rasio/resolusi kanvas (9:16 HP, 16:9 Laptop, 1:1 Feed), durasi, FPS, menulis/memodifikasi kode TSX, mengubah teks & parameter visual (warna, harga, judul), mengontrol timeline (seek frame & playback), toggle safe zone, dan berpindah tab UI secara serentak.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "orchestrate",
          "apply_template",
          "update_code",
          "update_visual_props",
          "update_video_config",
          "timeline_control",
          "ui_control",
          "get_full_state",
        ],
        description:
          "Tipe aksi kendali studio: 'orchestrate' (lakukan banyak perubahan sekaligus), 'apply_template', 'update_code', 'update_visual_props', 'update_video_config', 'timeline_control', 'ui_control', atau 'get_full_state'",
      },
      templateId: {
        type: "string",
        enum: [
          "swiss-editorial-reel",
          "linear-product-keynote",
          "brutalist-kinetic-square",
          "umkm-promo-flashsale",
          "umkm-review-testimoni",
        ],
        description: "Ganti basis template komposisi",
      },
      videoConfig: {
        type: "object",
        properties: {
          aspectRatio: { type: "string", enum: ["9:16", "16:9", "1:1"] },
          durationInFrames: { type: "number" },
          fps: { type: "number", enum: [24, 30, 60] },
        },
        description: "Pengaturan rasio aspek, durasi frame, dan frame rate",
      },
      props: {
        type: "object",
        description: "Nilai properti visual (judul, subtitle, nama produk, harga promo, warna, dsb.)",
      },
      propsSchema: {
        type: "array",
        description: "Schema bidang kontrol visual untuk antarmuka Inspector",
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            label: { type: "string" },
            type: { type: "string", enum: ["text", "color", "number", "boolean"] },
            defaultValue: {},
          },
        },
      },
      code: {
        type: "string",
        description: "Kode komponen React/Remotion TSX baru atau yang dimodifikasi untuk MainVideo.tsx",
      },
      seekFrame: {
        type: "number",
        description: "Posisikan scrubber timeline ke nomor frame tertentu (0 s/d durationInFrames)",
      },
      playbackAction: {
        type: "string",
        enum: ["play", "pause", "restart"],
        description: "Kontrol pemutar video (putar, jeda, ulangi dari awal)",
      },
      safeZone: {
        type: "boolean",
        description: "Aktifkan atau matikan overlay Safe Zone TikTok / Instagram Reels (true/false)",
      },
      activeTab: {
        type: "string",
        enum: ["controls", "chat", "code", "mcp"],
        description: "Pindahkan tab antarmuka studio yang sedang aktif",
      },
      notes: {
        type: "string",
        description: "Penjelasan singkat perubahan dari AI untuk pengguna",
      },
    },
    required: ["action"],
  },
};

export const MCP_TOOLS_LIST: McpToolDefinition[] = [
  MASTER_STUDIO_TOOL,
  {
    name: "list_project_files",
    description:
      "Membaca daftar file di Virtual File System (VFS) beserta konfigurasi video (width, height, fps, durationInFrames) dan daftar props aktif.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "read_component_code",
    description:
      "Membaca kode sumber komponen React/Remotion (.tsx) dari Virtual File System.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Nama file di VFS, default 'MainVideo.tsx'",
        },
      },
    },
  },
  {
    name: "write_component_code",
    description:
      "Menulis atau memperbarui kode komponen React/Remotion (.tsx) di Virtual File System. Gunakan hooks Remotion seperti useCurrentFrame, useVideoConfig, spring, interpolate, Sequence, dan AbsoluteFill.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Nama file target, default 'MainVideo.tsx'",
        },
        code: {
          type: "string",
          description: "Kode lengkap React/Remotion (.tsx) yang mengekspor default function.",
        },
        propsSchema: {
          type: "array",
          description: "Opsional: daftar schema props dinamis agar muncul sebagai slider/control di HP.",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              label: { type: "string" },
              type: { type: "string", enum: ["text", "color", "number", "boolean"] },
              defaultValue: {},
            },
          },
        },
      },
      required: ["code"],
    },
  },
  {
    name: "update_video_config",
    description:
      "Mengubah resolusi/rasio video (9:16 untuk HP/TikTok/Reels, 16:9 untuk Laptop/YouTube, 1:1 untuk Feed), FPS, atau durasi frame.",
    inputSchema: {
      type: "object",
      properties: {
        aspectRatio: {
          type: "string",
          enum: ["9:16", "16:9", "1:1"],
          description: "Rasio aspek video",
        },
        durationInFrames: {
          type: "number",
          description: "Total durasi dalam frame (misal 150 untuk 5 detik pada 30fps)",
        },
        fps: {
          type: "number",
          description: "Frame per detik (default 30 atau 60)",
        },
      },
    },
  },
  {
    name: "update_schema_props",
    description:
      "Mengubah nilai properti visual video secara instan (misal: mengganti teks headline, subheadline, warna primaryColor, accentColor, bgColor, kecepatan).",
    inputSchema: {
      type: "object",
      properties: {
        props: {
          type: "object",
          description: "Pasangan key-value properti yang ingin diubah",
        },
      },
      required: ["props"],
    },
  },
  {
    name: "apply_template_preset",
    description:
      "Mengganti basis template komposisi video ke salah satu preset ('swiss-editorial-reel', 'linear-product-keynote', 'brutalist-kinetic-square').",
    inputSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          enum: ["swiss-editorial-reel", "linear-product-keynote", "brutalist-kinetic-square"],
        },
      },
      required: ["templateId"],
    },
  },
  {
    name: "get_compile_diagnostics",
    description:
      "Mengambil status kompilasi kode TSX saat ini di browser untuk mengecek apakah ada error sintaks atau runtime.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export interface McpToolExecutionOutput {
  updatedProject: StudioProject;
  summary: string;
  data: any;
}

/**
 * Pure function that executes an MCP tool against a StudioProject state
 * and returns the updated project + tool output.
 */
export function executeMcpToolOnProject(
  project: StudioProject,
  toolName: string,
  args: Record<string, any> = {}
): McpToolExecutionOutput {
  const now = Date.now();
  const next: StudioProject = {
    ...project,
    files: { ...project.files },
    videoConfig: { ...project.videoConfig },
    propsValues: { ...project.propsValues },
    propsSchema: [...project.propsSchema],
    sequences: [...project.sequences],
    version: project.version + 1,
  };

  switch (toolName) {
    case "manage_studio":
    case "studio_controller": {
      const summaries: string[] = [];
      const uiCommands: Record<string, any> = {};

      // 1. Template switch if requested
      if (args.templateId) {
        const tpl =
          STUDIO_TEMPLATES.find((t) => t.id === args.templateId) || STUDIO_TEMPLATES[0];
        next.templateId = tpl.id;
        next.name = tpl.name;
        next.videoConfig = { ...tpl.videoConfig };
        next.files["MainVideo.tsx"] = {
          path: "MainVideo.tsx",
          content: tpl.code,
          language: "tsx",
          updatedAt: now,
        };
        next.files["schema.json"] = {
          path: "schema.json",
          content: JSON.stringify(tpl.propsSchema, null, 2),
          language: "json",
          updatedAt: now,
        };
        next.propsSchema = [...tpl.propsSchema];
        next.propsValues = { ...tpl.propsValues };
        next.sequences = [...tpl.sequences];
        summaries.push(`Template -> '${tpl.name}'`);
      }

      // 2. Video config updates
      const cfg = args.videoConfig || {};
      if (cfg.aspectRatio) {
        if (cfg.aspectRatio === "9:16") {
          next.videoConfig.aspectRatio = "9:16";
          next.videoConfig.width = 1080;
          next.videoConfig.height = 1920;
        } else if (cfg.aspectRatio === "16:9") {
          next.videoConfig.aspectRatio = "16:9";
          next.videoConfig.width = 1920;
          next.videoConfig.height = 1080;
        } else if (cfg.aspectRatio === "1:1") {
          next.videoConfig.aspectRatio = "1:1";
          next.videoConfig.width = 1080;
          next.videoConfig.height = 1080;
        }
        summaries.push(`Rasio ${cfg.aspectRatio}`);
      }
      if (typeof cfg.durationInFrames === "number" && cfg.durationInFrames >= 30) {
        next.videoConfig.durationInFrames = Math.min(900, Math.round(cfg.durationInFrames));
        summaries.push(`Durasi ${next.videoConfig.durationInFrames}F`);
      }
      if (typeof cfg.fps === "number" && (cfg.fps === 24 || cfg.fps === 30 || cfg.fps === 60)) {
        next.videoConfig.fps = cfg.fps;
        summaries.push(`FPS ${cfg.fps}`);
      }

      // 3. Props schema updates
      if (Array.isArray(args.propsSchema) && args.propsSchema.length > 0) {
        next.propsSchema = args.propsSchema as PropSchemaField[];
        const freshProps: Record<string, any> = {};
        for (const field of next.propsSchema) {
          if (field.defaultValue !== undefined) {
            freshProps[field.key] = field.defaultValue;
          }
        }
        next.propsValues = freshProps;
        next.files["schema.json"] = {
          path: "schema.json",
          content: JSON.stringify(next.propsSchema, null, 2),
          language: "json",
          updatedAt: now,
        };
        summaries.push(`Schema visual (${next.propsSchema.length} field)`);
      }

      // 4. Props values updates
      if (args.props && typeof args.props === "object") {
        next.propsValues = {
          ...next.propsValues,
          ...args.props,
        };
        for (const [k, v] of Object.entries(args.props)) {
          const exists = next.propsSchema.some((s) => s.key === k);
          if (!exists) {
            const isColor = typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v);
            const isNumber = typeof v === "number";
            const isBool = typeof v === "boolean";
            next.propsSchema.push({
              key: k,
              label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
              type: isColor ? "color" : isNumber ? "number" : isBool ? "boolean" : "text",
              defaultValue: v,
            });
          }
        }
        summaries.push(`Visual props (${Object.keys(args.props).length} diubah)`);
      }

      // 5. Code writing
      if (typeof args.code === "string" && args.code.trim().length > 0) {
        const targetPath = args.targetFile || "MainVideo.tsx";
        next.files[targetPath] = {
          path: targetPath,
          content: args.code,
          language: targetPath.endsWith(".json") ? "json" : "tsx",
          updatedAt: now,
        };
        if (targetPath === "MainVideo.tsx") {
          next.sequences = extractSequencesFromCode(args.code, next.videoConfig.durationInFrames);
        }
        summaries.push(`Kode ${targetPath} (${args.code.split("\n").length} baris)`);
      }

      // 6. UI & Playback Controls
      if (typeof args.seekFrame === "number") {
        uiCommands.seekFrame = Math.max(
          0,
          Math.min(next.videoConfig.durationInFrames - 1, Math.round(args.seekFrame))
        );
        summaries.push(`Seek f-${uiCommands.seekFrame}`);
      }
      if (args.playbackAction) {
        uiCommands.playbackAction = args.playbackAction;
        summaries.push(`Playback: ${args.playbackAction}`);
      }
      if (typeof args.safeZone === "boolean") {
        uiCommands.safeZone = args.safeZone;
        summaries.push(`Safe Zone: ${args.safeZone ? "ON" : "OFF"}`);
      }
      if (args.activeTab) {
        uiCommands.activeTab = args.activeTab;
        summaries.push(`Tab: ${args.activeTab}`);
      }

      const finalSummary =
        summaries.length > 0
          ? `Kendali Penuh Studio: ${summaries.join(" • ")}`
          : "Kendali Penuh Studio: Status siap & tersinkronisasi.";

      return {
        updatedProject: next,
        summary: finalSummary,
        data: {
          success: true,
          action: args.action,
          projectVersion: next.version,
          videoConfig: next.videoConfig,
          propsValues: next.propsValues,
          files: Object.keys(next.files),
          uiCommands,
        },
      };
    }

    case "list_project_files": {
      const fileList = Object.keys(next.files);
      return {
        updatedProject: project,
        summary: `Membaca ${fileList.length} file proyek & konfigurasi (${next.videoConfig.aspectRatio}, ${next.videoConfig.durationInFrames} frames)`,
        data: {
          files: fileList,
          videoConfig: next.videoConfig,
          propsValues: next.propsValues,
          propsSchema: next.propsSchema,
        },
      };
    }

    case "read_component_code": {
      const targetPath = args.path || "MainVideo.tsx";
      const file = next.files[targetPath];
      if (!file) {
        return {
          updatedProject: project,
          summary: `File ${targetPath} tidak ditemukan`,
          data: { error: `File '${targetPath}' not found in VFS.` },
        };
      }
      return {
        updatedProject: project,
        summary: `Membaca kode ${targetPath} (${file.content.split("\n").length} baris)`,
        data: {
          path: targetPath,
          content: file.content,
          videoConfig: next.videoConfig,
        },
      };
    }

    case "write_component_code": {
      const targetPath = args.path || "MainVideo.tsx";
      const code = String(args.code || "");
      next.files[targetPath] = {
        path: targetPath,
        content: code,
        language: targetPath.endsWith(".json") ? "json" : "tsx",
        updatedAt: now,
      };

      if (Array.isArray(args.propsSchema) && args.propsSchema.length > 0) {
        next.propsSchema = args.propsSchema as PropSchemaField[];
        const freshProps: Record<string, any> = {};
        for (const field of next.propsSchema) {
          if (field.defaultValue !== undefined) {
            freshProps[field.key] = field.defaultValue;
          }
        }
        next.propsValues = freshProps;
        next.files["schema.json"] = {
          path: "schema.json",
          content: JSON.stringify(next.propsSchema, null, 2),
          language: "json",
          updatedAt: now,
        };
      }

      if (targetPath === "MainVideo.tsx") {
        next.sequences = extractSequencesFromCode(code, next.videoConfig.durationInFrames);
      }

      return {
        updatedProject: next,
        summary: `Menulis kode komponen baru ke ${targetPath} (${code.split("\n").length} baris)`,
        data: {
          success: true,
          path: targetPath,
          detectedSequences: next.sequences.length,
        },
      };
    }

    case "update_video_config": {
      const ratio = args.aspectRatio as VideoConfig["aspectRatio"] | undefined;
      if (ratio === "9:16") {
        next.videoConfig.aspectRatio = "9:16";
        next.videoConfig.width = 1080;
        next.videoConfig.height = 1920;
      } else if (ratio === "16:9") {
        next.videoConfig.aspectRatio = "16:9";
        next.videoConfig.width = 1920;
        next.videoConfig.height = 1080;
      } else if (ratio === "1:1") {
        next.videoConfig.aspectRatio = "1:1";
        next.videoConfig.width = 1080;
        next.videoConfig.height = 1080;
      }

      if (typeof args.durationInFrames === "number" && args.durationInFrames >= 30) {
        next.videoConfig.durationInFrames = Math.min(900, Math.round(args.durationInFrames));
      }
      if (typeof args.fps === "number" && (args.fps === 24 || args.fps === 30 || args.fps === 60)) {
        next.videoConfig.fps = args.fps;
      }

      return {
        updatedProject: next,
        summary: `Update konfigurasi video: ${next.videoConfig.aspectRatio} (${next.videoConfig.width}x${next.videoConfig.height}), ${next.videoConfig.durationInFrames}f @ ${next.videoConfig.fps}fps`,
        data: { videoConfig: next.videoConfig },
      };
    }

    case "update_schema_props": {
      const incoming = args.props || {};
      next.propsValues = {
        ...next.propsValues,
        ...incoming,
      };

      // Ensure any new prop key also exists in propsSchema so it appears in mobile Quick Controls
      for (const [k, v] of Object.entries(incoming)) {
        const exists = next.propsSchema.some((s) => s.key === k);
        if (!exists) {
          const isColor = typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v);
          const isNumber = typeof v === "number";
          const isBool = typeof v === "boolean";
          next.propsSchema.push({
            key: k,
            label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
            type: isColor ? "color" : isNumber ? "number" : isBool ? "boolean" : "text",
            defaultValue: v,
          });
        }
      }

      return {
        updatedProject: next,
        summary: `Memperbarui ${Object.keys(incoming).length} parameter visual (${Object.keys(incoming).join(", ")})`,
        data: { propsValues: next.propsValues },
      };
    }

    case "apply_template_preset": {
      const tpl =
        STUDIO_TEMPLATES.find((t) => t.id === args.templateId) || STUDIO_TEMPLATES[0];
      next.templateId = tpl.id;
      next.name = tpl.name;
      next.videoConfig = { ...tpl.videoConfig };
      next.files["MainVideo.tsx"] = {
        path: "MainVideo.tsx",
        content: tpl.code,
        language: "tsx",
        updatedAt: now,
      };
      next.files["schema.json"] = {
        path: "schema.json",
        content: JSON.stringify(tpl.propsSchema, null, 2),
        language: "json",
        updatedAt: now,
      };
      next.propsSchema = [...tpl.propsSchema];
      next.propsValues = { ...tpl.propsValues };
      next.sequences = [...tpl.sequences];

      return {
        updatedProject: next,
        summary: `Mengaktifkan template '${tpl.name}' (${tpl.videoConfig.aspectRatio})`,
        data: { templateId: tpl.id, videoConfig: next.videoConfig },
      };
    }

    case "get_compile_diagnostics": {
      return {
        updatedProject: project,
        summary: project.diagnostics.hasError
          ? `Terdeteksi error kompilasi: ${project.diagnostics.message}`
          : "Kompilasi TSX bersih tanpa error",
        data: project.diagnostics,
      };
    }

    default:
      return {
        updatedProject: project,
        summary: `Tool MCP '${toolName}' tidak dikenal`,
        data: { error: `Unknown tool: ${toolName}` },
      };
  }
}

