"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Sliders,
  Code2,
  Cpu,
  Smartphone,
  Monitor,
  AlertTriangle,
  Settings,
  Share2,
  Terminal,
  Copy,
  Check,
  SkipBack,
  SkipForward,
  MessageSquare,
  ChevronRight,
  X,
  Mic,
  Upload,
  FileVideo,
  CheckCircle2,
  Loader2,
  LogOut,
  User,
  ShieldCheck,
  Save,
  Undo2,
  Redo2,
  PlusCircle,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  StudioProject,
  ChatMessage,
  McpExecutionLog,
  AIProviderSettings,
  VideoConfig,
} from "@/types/studio";
import { STUDIO_TEMPLATES, createInitialProject } from "@/lib/templates";
import { compileRemotionCode } from "@/lib/compiler";
import { MCP_TOOLS_LIST, executeMcpToolOnProject } from "@/lib/mcp-tools";
import { exportProjectToMp4, ExportProgress } from "@/lib/video-exporter";
import {
  installWhisperModel,
  transcribeMediaWithWhisper,
  generateWhisperCaptionRemotionCode,
  WhisperDownloadProgress,
  WhisperModelId,
  WhisperTranscriptionResult,
} from "@/lib/whisper-engine";
import {
  GoogleUserProfile,
  getSavedGoogleUserSession,
  clearGoogleUserSession,
  getSavedGoogleClientId,
  saveGoogleClientId,
  signInWithGoogleOAuthPopup,
  signInWithInstantGoogleAccount,
  saveProjectForGoogleUser,
  loadProjectForGoogleUser,
  loadGoogleIdentityScript,
} from "@/lib/google-auth";

/**
 * Error boundary around @remotion/player
 */
class RemotionErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError: (msg: string) => void;
    resetKey: string | number;
  },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || "Runtime Render Error" };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error?.message || "Runtime Render Error");
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMsg: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black border border-neutral-800 p-6 text-center font-mono">
          <AlertTriangle className="w-5 h-5 text-white mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-white">
            RUNTIME EXCEPTION
          </p>
          <p className="text-[11px] text-neutral-400 mt-1.5 max-w-md break-all">
            {this.state.errorMsg}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const PRESET_COMMANDS = [
  { label: "Flash Sale UMKM", prompt: "Ganti ke template promo flash sale umkm" },
  { label: "Review Pembeli", prompt: "Ganti ke template ulasan testimoni pembeli" },
  { label: "Editorial 9:16", prompt: "Ganti ke template editorial monokrom 9:16" },
  { label: "Keynote 16:9", prompt: "Ubah ke template keynote telemetry 16:9" },
  { label: "Kinetic 1:1", prompt: "Ubah ke template kinetic type 1:1" },
  { label: "Durasi 10s", prompt: "Ubah durasi jadi 10 detik 30 fps" },
];

function renderMarkdownText(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return (
      <div key={lIdx} className={line.trim() === "" ? "h-2" : "leading-relaxed"}>
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return (
              <em key={pIdx} className="italic text-neutral-300">
                {part.slice(1, -1)}
              </em>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={pIdx}
                className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-white"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    );
  });
}

function formatSmpteTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const remFrames = frame % fps;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(
    remFrames
  ).padStart(2, "0")}`;
}

export default function StudioApp() {
  const [project, setProject] = useState<StudioProject>(() =>
    createInitialProject("swiss-editorial-reel")
  );
  const [activeMobileTab, setActiveMobileTab] = useState<
    "chat" | "controls" | "code" | "mcp"
  >("controls");
  const [activeDesktopRightTab, setActiveDesktopRightTab] = useState<
    "controls" | "code" | "mcp"
  >("controls");
  const [layoutMode, setLayoutMode] = useState<"auto" | "mobile-sim">("auto");

  // Player & DOM Capture Refs
  const playerRef = useRef<PlayerRef>(null);
  const playerDomRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // Command Console & MCP State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      role: "assistant",
      content:
        "Workspace siap. Sesuaikan properti visual di **Inspector**, instal **Whisper** untuk membuat transkripsi subtitle video otomatis, atau jalankan perintah lewat **Console**.",
      timestamp: "00:00",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [mcpLogs, setMcpLogs] = useState<McpExecutionLog[]>([]);
  const [copiedMcpUrl, setCopiedMcpUrl] = useState<boolean>(false);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [aiSettings, setAiSettings] = useState<AIProviderSettings>({
    provider: "smart-builtin",
    apiKey: "",
    model: "gemini-2.5-flash",
  });

  // Whisper Installer & Transcription Modal State
  const [showWhisperModal, setShowWhisperModal] = useState<boolean>(false);
  const [whisperModelId, setWhisperModelId] = useState<WhisperModelId>("Xenova/whisper-tiny");
  const [whisperLang, setWhisperLang] = useState<string>("indonesian");
  const [isWhisperInstalled, setIsWhisperInstalled] = useState<boolean>(false);
  const [isInstallingWhisper, setIsInstallingWhisper] = useState<boolean>(false);
  const [whisperInstallProg, setWhisperInstallProg] = useState<WhisperDownloadProgress | null>(
    null
  );
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [selectedMediaBlobUrl, setSelectedMediaBlobUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string>("");
  const [transcriptionResult, setTranscriptionResult] =
    useState<WhisperTranscriptionResult | null>(null);

  // Export MP4 State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<{
    url: string;
    filename: string;
    blob: Blob;
  } | null>(null);

  // Google Auth State
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [instantEmail, setInstantEmail] = useState<string>("");
  const [instantName, setInstantName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Undo / Redo & Workspace Extras
  const [history, setHistory] = useState<StudioProject[]>([project]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);
  const [codeWordWrap, setCodeWordWrap] = useState<boolean>(false);
  const [mcpConnected, setMcpConnected] = useState<boolean>(true);

  // Push next project state with undo/redo stack & autosave
  const pushProjectState = useCallback((nextState: StudioProject) => {
    setProject(nextState);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const nextStack = [...sliced, nextState];
      if (nextStack.length > 30) nextStack.shift();
      return nextStack;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("kinetic_autosave_project_v2", JSON.stringify(nextState));
      } catch {
        // ignore quota
      }
    }
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setProject(target);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setProject(target);
    }
  }, [historyIndex, history]);

  const handleCreateBlankProject = () => {
    if (confirm("Mulai proyek baru? Proyek yang belum disimpan ke akun akan direset.")) {
      const blank = createInitialProject("swiss-editorial-reel");
      blank.name = "Proyek Baru";
      blank.version = 1;
      pushProjectState(blank);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Try autosave project restoration
      try {
        const autosaved = localStorage.getItem("kinetic_autosave_project_v2");
        if (autosaved) {
          const parsed = JSON.parse(autosaved);
          if (parsed && parsed.files && parsed.videoConfig) {
            setProject(parsed);
            setHistory([parsed]);
            setHistoryIndex(0);
          }
        }
      } catch {
        // ignore
      }

      const savedModel = localStorage.getItem("kinetic_whisper_installed_model");
      if (savedModel === "Xenova/whisper-tiny" || savedModel === "Xenova/whisper-base") {
        setWhisperModelId(savedModel);
        setIsWhisperInstalled(true);
      }

      // Restore Google session & user project if available
      const savedUser = getSavedGoogleUserSession();
      if (savedUser) {
        setGoogleUser(savedUser);
        const userProj = loadProjectForGoogleUser(savedUser.email);
        if (userProj && userProj.files && userProj.videoConfig) {
          setProject(userProj);
          setHistory([userProj]);
          setHistoryIndex(0);
        }
      }
      setGoogleClientId(getSavedGoogleClientId());
      loadGoogleIdentityScript().catch(() => {});
    }
  }, []);

  // Auto-save project to user's Google account profile whenever modified
  useEffect(() => {
    if (googleUser?.email) {
      saveProjectForGoogleUser(googleUser.email, project);
    }
  }, [project, googleUser]);

  // Keyboard Shortcuts: Space (Play/Pause), Left/Right (Frame scrub), Ctrl+Z / Ctrl+Y (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Ctrl + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey && !isInput) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl + Y or Ctrl + Shift + Z = Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !isInput) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z" && !isInput)
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Spacebar = Toggle Play/Pause
      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        togglePlay();
        return;
      }

      // ArrowLeft = Frame -1 (-5 with Shift)
      if (e.key === "ArrowLeft" && !isInput) {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        seekToFrame(currentFrame - delta);
        return;
      }

      // ArrowRight = Frame +1 (+5 with Shift)
      if (e.key === "ArrowRight" && !isInput) {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        seekToFrame(currentFrame + delta);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, currentFrame, project.videoConfig.durationInFrames]);

  // In-Browser TSX Compilation
  const mainCode = project.files["MainVideo.tsx"]?.content || "";
  const compiled = useMemo(() => {
    return compileRemotionCode(
      mainCode,
      project.files,
      project.videoConfig.durationInFrames
    );
  }, [mainCode, project.files, project.videoConfig.durationInFrames]);

  useEffect(() => {
    setProject((prev) => {
      const hasErr = Boolean(compiled.error);
      if (
        prev.diagnostics.hasError === hasErr &&
        prev.diagnostics.message === compiled.error &&
        prev.sequences.length === compiled.detectedSequences.length
      ) {
        return prev;
      }
      return {
        ...prev,
        sequences:
          compiled.detectedSequences.length > 0
            ? compiled.detectedSequences
            : prev.sequences,
        diagnostics: {
          hasError: hasErr,
          message: compiled.error,
          line: compiled.line,
          column: compiled.column,
          file: "MainVideo.tsx",
          updatedAt: Date.now(),
        },
      };
    });
  }, [compiled]);

  // Poll frame position from @remotion/player
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player) {
        try {
          setCurrentFrame(player.getCurrentFrame());
          setIsPlaying(player.isPlaying());
        } catch {
          // ignore
        }
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/mcp")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.logs)) setMcpLogs(data.logs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/mcp");
        if (!res.ok) return;
        const data = await res.json();
        if (data.project && data.project.version > project.version) {
          setProject(data.project);
        }
        if (Array.isArray(data.logs)) {
          setMcpLogs(data.logs);
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [project.version]);

  const syncProjectWithServer = useCallback(async (nextProj: StudioProject) => {
    setProject(nextProj);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "studio/sync", project: nextProj }),
      });
      const data = await res.json();
      if (Array.isArray(data.logs)) setMcpLogs(data.logs);
    } catch {
      // ignore
    }
  }, []);

  const invokeLocalMcpTool = useCallback(
    async (toolName: string, args: Record<string, any>) => {
      const { updatedProject } = executeMcpToolOnProject(project, toolName, args);
      setProject(updatedProject);

      try {
        const res = await fetch("/api/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: "tools/call",
            params: {
              name: toolName,
              arguments: args,
              _source: "studio-ui",
            },
          }),
        });
        const data = await res.json();
        if (data?.result?._mcpLog) {
          setMcpLogs((prev) => [data.result._mcpLog, ...prev.slice(0, 49)]);
        }
      } catch {
        // local state already updated
      }
    },
    [project]
  );

  const handleInstallWhisper = async () => {
    if (isInstallingWhisper) return;
    setIsInstallingWhisper(true);
    try {
      await installWhisperModel(whisperModelId, (prog) => {
        setWhisperInstallProg(prog);
      });
      setIsWhisperInstalled(true);
    } catch (err: any) {
      setWhisperInstallProg({
        status: "error",
        progress: 0,
        message: `ERROR: ${err?.message || "Gagal mengunduh model Whisper"}`,
      });
    } finally {
      setIsInstallingWhisper(false);
    }
  };

  const handleSelectMediaFile = (file: File | null) => {
    if (!file) return;
    if (selectedMediaBlobUrl) {
      URL.revokeObjectURL(selectedMediaBlobUrl);
    }
    const url = URL.createObjectURL(file);
    setSelectedMediaFile(file);
    setSelectedMediaBlobUrl(url);
    setTranscriptionResult(null);
    setTranscribeStatus(
      `READY // ${file.name.toUpperCase()} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );
  };

  const handleRunWhisperTranscription = async () => {
    if (!selectedMediaFile || isTranscribing) return;
    setIsTranscribing(true);
    setTranscribeStatus("STARTING WHISPER ASR PIPELINE...");
    try {
      const result = await transcribeMediaWithWhisper(
        selectedMediaFile,
        whisperModelId,
        whisperLang,
        (msg) => setTranscribeStatus(msg)
      );
      setIsWhisperInstalled(true);
      setTranscriptionResult(result);
      setTranscribeStatus(
        `COMPLETED // ${result.chunks.length} SEGMENTS (${result.durationSeconds.toFixed(1)}S)`
      );
    } catch (err: any) {
      setTranscribeStatus(
        `ERROR: ${err?.message || "Gagal mengekstrak atau mentranskripsi audio"}`
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleApplyTranscriptToTimeline = async () => {
    if (!transcriptionResult || transcriptionResult.chunks.length === 0) return;

    const fps = project.videoConfig.fps;
    const totalFrames = Math.max(
      60,
      Math.min(900, Math.ceil(transcriptionResult.durationSeconds * fps))
    );
    const isVideo = Boolean(selectedMediaFile?.type.startsWith("video/"));

    const generatedCode = generateWhisperCaptionRemotionCode(
      transcriptionResult.chunks,
      fps,
      selectedMediaBlobUrl || undefined,
      isVideo
    );

    const step1 = executeMcpToolOnProject(project, "update_video_config", {
      durationInFrames: totalFrames,
    });
    const step2 = executeMcpToolOnProject(step1.updatedProject, "write_component_code", {
      path: "MainVideo.tsx",
      code: generatedCode,
    });

    await syncProjectWithServer(step2.updatedProject);

    setMessages((prev) => [
      ...prev,
      {
        id: `whisper-${Date.now()}`,
        role: "assistant",
        content: `Transkripsi selesai (${transcriptionResult.chunks.length} segmen). Komponen **WhisperCaptionedComposition** telah diterapkan ke \`MainVideo.tsx\` (${totalFrames} frame).`,
        toolCalls: [
          {
            toolName: "update_video_config",
            args: { durationInFrames: totalFrames },
            summary: `Duration set to ${totalFrames}F`,
          },
          {
            toolName: "write_component_code",
            args: { path: "MainVideo.tsx" },
            summary: `${transcriptionResult.chunks.length} caption sequences written`,
          },
        ],
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setShowWhisperModal(false);
    seekToFrame(0);
  };

  const handleExportSubtitleSrt = () => {
    if (!transcriptionResult || transcriptionResult.chunks.length === 0) return;
    let srtText = "";
    transcriptionResult.chunks.forEach((chunk, index) => {
      const startSec = chunk.timestamp[0] ?? 0;
      const endSec = chunk.timestamp[1] ?? (startSec + 2);
      const fmtTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 1000);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
      };
      srtText += `${index + 1}\n${fmtTime(startSec)} --> ${fmtTime(endSec)}\n${chunk.text.trim()}\n\n`;
    });
    const blob = new Blob([srtText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_subtitles.srt`;
    a.click();
  };

  const seekToFrame = (f: number) => {
    const clamped = Math.max(0, Math.min(project.videoConfig.durationInFrames - 1, f));
    playerRef.current?.seekTo(clamped);
    setCurrentFrame(clamped);
  };

  const handleSendPrompt = async (customPrompt?: string) => {
    const text = (customPrompt ?? chatInput).trim();
    if (!text || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          project,
          settings: aiSettings,
        }),
      });
      const data = await res.json();

      if (data.project) setProject(data.project);
      if (Array.isArray(data.logs)) setMcpLogs(data.logs);

      // Execute unified AI UI / timeline commands if emitted by manage_studio
      if (data.uiCommands) {
        if (typeof data.uiCommands.seekFrame === "number") {
          seekToFrame(data.uiCommands.seekFrame);
        }
        if (data.uiCommands.playbackAction === "play") {
          playerRef.current?.play();
          setIsPlaying(true);
        } else if (data.uiCommands.playbackAction === "pause") {
          playerRef.current?.pause();
          setIsPlaying(false);
        } else if (data.uiCommands.playbackAction === "restart") {
          seekToFrame(0);
          playerRef.current?.play();
          setIsPlaying(true);
        }
        if (typeof data.uiCommands.safeZone === "boolean") {
          setShowSafeZone(data.uiCommands.safeZone);
        }
        if (data.uiCommands.activeTab) {
          setActiveMobileTab(data.uiCommands.activeTab);
          if (data.uiCommands.activeTab !== "chat") {
            setActiveDesktopRightTab(data.uiCommands.activeTab);
          }
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || "MCP tool sequence executed.",
        toolCalls: data.toolCalls || [],
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Execution error: ${err?.message || "Unknown error"}`,
          timestamp: "ERR",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportedVideoUrl(null);
    setExportProgress({
      currentFrame: 0,
      totalFrames: project.videoConfig.durationInFrames,
      percent: 0,
      statusText: "INITIALIZING WEBCODECS PIPELINE...",
    });

    try {
      playerRef.current?.pause();
      setIsPlaying(false);

      const result = await exportProjectToMp4(
        project,
        (prog) => setExportProgress(prog),
        (frame) => {
          playerRef.current?.seekTo(frame);
          setCurrentFrame(frame);
        },
        playerDomRef.current
      );

      const url = URL.createObjectURL(result.blob);
      setExportedVideoUrl({
        url,
        filename: result.filename,
        blob: result.blob,
      });
    } catch (err: any) {
      alert(`Export error: ${err?.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareVideo = async () => {
    if (!exportedVideoUrl) return;
    const file = new File([exportedVideoUrl.blob], exportedVideoUrl.filename, {
      type: exportedVideoUrl.blob.type || "video/mp4",
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: project.name,
          text: "Rendered with Remotion MCP Studio",
          files: [file],
        });
        return;
      } catch {
        // fallback to download
      }
    }
    const a = document.createElement("a");
    a.href = exportedVideoUrl.url;
    a.download = exportedVideoUrl.filename;
    a.click();
  };

  const applyAuthenticatedGoogleUser = (profile: GoogleUserProfile) => {
    setGoogleUser(profile);
    const savedProj = loadProjectForGoogleUser(profile.email);
    if (savedProj && savedProj.files && savedProj.videoConfig) {
      setProject(savedProj);
    } else {
      saveProjectForGoogleUser(profile.email, project);
    }
    setShowGoogleAuthModal(false);
    setAuthError("");
    setMessages((prev) => [
      ...prev,
      {
        id: `auth-${Date.now()}`,
        role: "assistant",
        content: `Login berhasil sebagai **${profile.name}** (\`${profile.email}\`). Workspace proyek Anda kini otomatis tersimpan ke profil Google ini.`,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const handleOfficialGoogleSignIn = async () => {
    setAuthError("");
    if (!googleClientId.trim()) {
      setAuthError(
        "Masukkan Google OAuth Client ID terlebih dahulu, atau gunakan Login Akun Google Instan di atas."
      );
      return;
    }
    saveGoogleClientId(googleClientId);
    setIsGoogleSigningIn(true);
    try {
      const profile = await signInWithGoogleOAuthPopup(googleClientId);
      applyAuthenticatedGoogleUser(profile);
    } catch (err: any) {
      setAuthError(err?.message || "Gagal login menggunakan Google OAuth.");
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleInstantGoogleSignIn = (emailOverride?: string, nameOverride?: string) => {
    setAuthError("");
    try {
      const emailToUse = emailOverride ?? instantEmail;
      const nameToUse = nameOverride ?? instantName;
      const profile = signInWithInstantGoogleAccount(emailToUse, nameToUse);
      applyAuthenticatedGoogleUser(profile);
    } catch (err: any) {
      setAuthError(err?.message || "Masukkan email Google yang valid.");
    }
  };

  const handleGoogleSignOut = () => {
    clearGoogleUserSession();
    setGoogleUser(null);
    setShowUserDropdown(false);
  };

  const handleManualSaveToAccount = () => {
    if (!googleUser) return;
    saveProjectForGoogleUser(googleUser.email, project);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const SafeVideoComponent = useMemo(() => {
    if (compiled.Component) return compiled.Component;
    return function FallbackErrorScene() {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#000000",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
            AST COMPILATION ERROR
          </div>
          <div style={{ fontSize: 18, color: "#A3A3A3", maxWidth: 800 }}>
            {compiled.error}
          </div>
        </div>
      );
    };
  }, [compiled]);

  // ============================================================================
  // MINIMALIST MONOCHROME SUB-PANELS
  // ============================================================================

  const renderCommandConsole = () => (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="px-4 py-3 border-b border-neutral-900 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
          CONSOLE
        </span>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-white hover:text-white transition"
        >
          {aiSettings.provider === "smart-builtin"
            ? "LOCAL PARSER"
            : aiSettings.provider.toUpperCase()}
        </button>
      </div>

      {/* Minimalist Prompt Pills with Scroll Indicator */}
      <div className="relative border-b border-neutral-900">
        <div className="px-4 py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {PRESET_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(cmd.prompt)}
              disabled={isAiLoading}
              className="shrink-0 text-[11px] px-3 py-1 rounded-full bg-neutral-950 hover:bg-white hover:text-black border border-neutral-800 text-neutral-300 transition"
            >
              {cmd.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent" />
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                m.role === "user"
                  ? "bg-white text-black border-white font-medium"
                  : "bg-[#0A0A0A] border-neutral-800 text-neutral-200"
              }`}
            >
              <div>{renderMarkdownText(m.content)}</div>

              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800 space-y-1">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                    MCP CALLS ({m.toolCalls.length})
                  </div>
                  {m.toolCalls.map((tc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 bg-black border border-neutral-800 rounded-md px-2.5 py-1 text-[11px] font-mono"
                    >
                      <span className="text-white shrink-0">{tc.toolName}()</span>
                      <span className="text-neutral-500 truncate text-[10px]">
                        {tc.summary}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-neutral-600 mt-1 px-1">
              {m.timestamp}
            </span>
          </div>
        ))}

        {isAiLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Executing MCP tools...</span>
          </div>
        )}
      </div>

      {/* Minimalist Command Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt();
        }}
        className="p-3 border-t border-neutral-900 bg-black flex items-center gap-2"
      >
        <div className="flex-1 flex items-center bg-[#0A0A0A] border border-neutral-800 focus-within:border-white rounded-lg px-3 py-2 transition">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-500 mr-1.5 shrink-0" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Command via MCP..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-600 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isAiLoading || !chatInput.trim()}
          className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 disabled:opacity-25 text-black font-medium text-xs transition shrink-0"
        >
          Run
        </button>
      </form>
    </div>
  );

  const renderPropertyInspector = () => (
    <div className="flex flex-col h-full overflow-y-auto bg-black divide-y divide-neutral-900">
      {/* Whisper Minimalist Card */}
      <div className="p-4 flex items-center justify-between gap-3 bg-[#050505]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Mic className="w-3.5 h-3.5 text-white" />
            <span>Whisper Transcription</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
            {isWhisperInstalled
              ? `Ready (${whisperModelId.split("/")[1]})`
              : "Install local ONNX model for video captions"}
          </p>
        </div>
        <button
          onClick={() => setShowWhisperModal(true)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            isWhisperInstalled
              ? "bg-neutral-950 border-neutral-700 text-white hover:border-white"
              : "bg-white border-white text-black hover:bg-neutral-200"
          }`}
        >
          {isWhisperInstalled ? "Transcribe" : "Install Whisper"}
        </button>
      </div>

      {/* Composition Geometry */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            FORMAT
          </span>
          <span className="text-[11px] font-mono text-neutral-300 tabular-nums">
            {project.videoConfig.width}×{project.videoConfig.height}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(["9:16", "16:9", "1:1"] as VideoConfig["aspectRatio"][]).map((ratio) => {
            const active = project.videoConfig.aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() =>
                  invokeLocalMcpTool("update_video_config", { aspectRatio: ratio })
                }
                className={`py-2 px-2 rounded-lg text-xs font-mono border transition flex flex-col items-center gap-0.5 ${
                  active
                    ? "bg-white border-white text-black font-semibold"
                    : "bg-[#0A0A0A] border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white"
                }`}
              >
                <span>{ratio}</span>
                <span className="text-[9px] opacity-70">
                  {ratio === "9:16"
                    ? "Vertical"
                    : ratio === "16:9"
                    ? "Widescreen"
                    : "Square"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-1 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-400">Duration</span>
            <span className="font-mono text-white tabular-nums">
              {(project.videoConfig.durationInFrames / project.videoConfig.fps).toFixed(1)}s (
              {project.videoConfig.durationInFrames}f)
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={450}
            step={15}
            value={project.videoConfig.durationInFrames}
            onChange={(e) =>
              invokeLocalMcpTool("update_video_config", {
                durationInFrames: Number(e.target.value),
              })
            }
            className="w-full studio-slider"
          />
        </div>
      </div>

      {/* Schema Properties */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            PARAMETERS
          </span>
          <span className="text-[10px] font-mono text-neutral-600">
            {project.propsSchema.length} PROPS
          </span>
        </div>

        <div className="space-y-3">
          {project.propsSchema.map((field) => {
            const val = project.propsValues[field.key] ?? field.defaultValue;
            return (
              <div
                key={field.key}
                className="grid grid-cols-12 items-center gap-2"
              >
                <label
                  className="col-span-5 text-xs text-neutral-400 truncate"
                  title={field.label}
                >
                  {field.label}
                </label>

                <div className="col-span-7">
                  {field.type === "text" && (
                    <input
                      type="text"
                      value={String(val ?? "")}
                      onChange={(e) =>
                        invokeLocalMcpTool("update_schema_props", {
                          props: { [field.key]: e.target.value },
                        })
                      }
                      className="w-full bg-[#0A0A0A] border border-neutral-800 focus:border-white rounded-md px-2.5 py-1.5 text-xs text-white outline-none transition"
                    />
                  )}

                  {field.type === "color" && (
                    <div className="flex items-center gap-1.5">
                      <label className="w-6 h-6 shrink-0 rounded-md border border-neutral-700 cursor-pointer relative overflow-hidden">
                        <input
                          type="color"
                          value={String(val || "#FFFFFF")}
                          onChange={(e) =>
                            invokeLocalMcpTool("update_schema_props", {
                              props: { [field.key]: e.target.value },
                            })
                          }
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <span
                          className="block w-full h-full"
                          style={{ backgroundColor: String(val || "#FFFFFF") }}
                        />
                      </label>
                      <input
                        type="text"
                        value={String(val || "#FFFFFF")}
                        onChange={(e) =>
                          invokeLocalMcpTool("update_schema_props", {
                            props: { [field.key]: e.target.value },
                          })
                        }
                        className="flex-1 bg-[#0A0A0A] border border-neutral-800 focus:border-white rounded-md px-2.5 py-1 text-xs font-mono text-white uppercase outline-none"
                      />
                    </div>
                  )}

                  {field.type === "number" && (
                    <div className="flex items-center gap-2.5">
                      <input
                        type="range"
                        min={field.min ?? 0}
                        max={field.max ?? 100}
                        step={field.step ?? 1}
                        value={Number(val ?? 1)}
                        onChange={(e) =>
                          invokeLocalMcpTool("update_schema_props", {
                            props: { [field.key]: Number(e.target.value) },
                          })
                        }
                        className="flex-1 studio-slider"
                      />
                      <span className="text-xs font-mono text-white tabular-nums w-9 text-right">
                        {val}
                      </span>
                    </div>
                  )}

                  {field.type === "boolean" && (
                    <button
                      type="button"
                      onClick={() =>
                        invokeLocalMcpTool("update_schema_props", {
                          props: { [field.key]: !val },
                        })
                      }
                      className={`w-full py-1.5 px-3 rounded-md text-xs font-mono border transition flex items-center justify-between ${
                        val
                          ? "bg-white border-white text-black font-medium"
                          : "bg-[#0A0A0A] border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span>{val ? "On" : "Off"}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          val ? "bg-black" : "bg-neutral-600"
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCodeEditor = () => {
    const activeFileObj =
      project.files[project.activeFile] || project.files["MainVideo.tsx"];
    const lineCount = (activeFileObj?.content || "").split("\n").length;

    return (
      <div className="flex flex-col h-full bg-black">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-900">
          <div className="flex items-center gap-1.5">
            {Object.keys(project.files).map((filePath) => (
              <button
                key={filePath}
                onClick={() =>
                  setProject((prev) => ({ ...prev, activeFile: filePath }))
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                  project.activeFile === filePath
                    ? "bg-white text-black font-semibold"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {filePath}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCodeWordWrap((v) => !v)}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 text-neutral-400 hover:text-white transition"
              title="Toggle Word Wrap"
            >
              {codeWordWrap ? "Wrap: ON" : "Wrap: OFF"}
            </button>

            {compiled.error ? (
              <button
                onClick={() =>
                  handleSendPrompt("Perbaiki error kompilasi TSX pada kode saat ini")
                }
                className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white text-black font-semibold"
              >
                Restore AST
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Compiled
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          <div className="w-11 py-3 bg-[#050505] border-r border-neutral-900 text-right pr-2.5 select-none font-mono text-[11px] leading-[1.6] text-neutral-600 overflow-hidden shrink-0">
            {Array.from({ length: Math.min(lineCount, 600) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={activeFileObj?.content || ""}
            onChange={(e) => {
              const newContent = e.target.value;
              const target = project.activeFile;
              const nextProj: StudioProject = {
                ...project,
                version: project.version + 1,
                files: {
                  ...project.files,
                  [target]: {
                    ...activeFileObj,
                    content: newContent,
                    updatedAt: Date.now(),
                  },
                },
              };
              syncProjectWithServer(nextProj);
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const target = e.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const val = target.value;
                target.value = val.substring(0, start) + "  " + val.substring(end);
                target.selectionStart = target.selectionEnd = start + 2;
                target.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }}
            spellCheck={false}
            className={`flex-1 w-full bg-black text-neutral-200 font-mono text-[11.5px] leading-[1.6] p-3 outline-none resize-none selection:bg-white selection:text-black ${
              codeWordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
            }`}
          />
        </div>

        {compiled.error && (
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-300 font-mono">
            ERROR: {compiled.error}
          </div>
        )}
      </div>
    );
  };

  const renderMcpInspector = () => {
    const mcpEndpoint =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/mcp`
        : "http://localhost:3001/api/mcp";

    return (
      <div className="flex flex-col h-full overflow-y-auto bg-black divide-y divide-neutral-900">
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              MCP ENDPOINT
            </span>
            <span className="text-[10px] font-mono text-white">JSON-RPC 2.0</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-neutral-800 rounded-lg p-2">
            <code className="text-[11px] text-neutral-200 font-mono flex-1 truncate">
              {mcpEndpoint}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(mcpEndpoint);
                setCopiedMcpUrl(true);
                setTimeout(() => setCopiedMcpUrl(false), 2000);
              }}
              className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-white hover:text-black text-[10px] font-mono text-neutral-200 flex items-center gap-1 transition"
            >
              {copiedMcpUrl ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            TOOLS ({MCP_TOOLS_LIST.length})
          </div>
          <div className="divide-y divide-neutral-900 border border-neutral-800 rounded-lg bg-[#050505] overflow-hidden">
            {MCP_TOOLS_LIST.map((tool) => (
              <div
                key={tool.name}
                className="p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-mono font-medium text-white">
                    {tool.name}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {tool.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (tool.name === "update_schema_props") {
                      invokeLocalMcpTool("update_schema_props", {
                        props: { headline: "MINIMALIST MOTION" },
                      });
                    } else if (tool.name === "update_video_config") {
                      invokeLocalMcpTool("update_video_config", {
                        aspectRatio:
                          project.videoConfig.aspectRatio === "9:16" ? "16:9" : "9:16",
                      });
                    } else {
                      invokeLocalMcpTool(tool.name, {});
                    }
                  }}
                  className="shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 text-neutral-300 transition"
                >
                  Test
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-white" /> EVENT LOG
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono">
            {mcpLogs.map((log) => (
              <div
                key={log.id}
                className="text-[11px] bg-[#080808] border border-neutral-900 rounded-md p-2.5"
              >
                <div className="flex items-center justify-between text-neutral-500 text-[10px]">
                  <span className="text-white">{log.toolName}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-neutral-400 mt-1 leading-snug">{log.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const isMobileSim = layoutMode === "mobile-sim";

  return (
    <div className="min-h-screen h-screen w-screen overflow-hidden flex flex-col bg-black text-white select-none">
      {/* =====================================================================
          MODERN MINIMALIST MONOCHROME HEADER
         ===================================================================== */}
      <header className="h-13 shrink-0 border-b border-neutral-900 bg-black px-4 flex items-center justify-between gap-3 z-20">
        {/* Left: Minimalist Brand + Preset Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-white" />
            <span className="font-semibold text-sm tracking-tight text-white">
              Kinetic
            </span>
          </div>

          <span className="text-neutral-800 hidden sm:inline">/</span>

          <select
            value={project.templateId}
            onChange={(e) =>
              invokeLocalMcpTool("apply_template_preset", {
                templateId: e.target.value,
              })
            }
            className="bg-[#0A0A0A] border border-neutral-800 hover:border-neutral-600 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none max-w-[150px] sm:max-w-[210px] transition"
          >
            {STUDIO_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.badge})
              </option>
            ))}
          </select>

          {/* New Project & Undo/Redo Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreateBlankProject}
              className="p-1.5 rounded-lg border border-neutral-800 bg-[#0A0A0A] text-neutral-400 hover:text-white hover:border-neutral-600 transition"
              title="Mulai Proyek Baru / Reset Canvas"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg border border-neutral-800 bg-[#0A0A0A] text-neutral-400 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition"
              title="Undo Perubahan (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg border border-neutral-800 bg-[#0A0A0A] text-neutral-400 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition"
              title="Redo Perubahan (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Viewport Mode Switcher & MCP Status */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080808] border border-neutral-800 text-[10px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                compiled.error
                  ? "bg-red-400"
                  : mcpConnected
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-neutral-600"
              }`}
            />
            <span className={compiled.error ? "text-red-400" : "text-neutral-400"}>
              {compiled.error ? "AST COMPILER ERROR" : "MCP SERVER: ONLINE"}
            </span>
          </div>

          <div className="flex items-center rounded-lg border border-neutral-800 bg-[#080808] p-0.5">
            <button
              onClick={() => setLayoutMode("auto")}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                layoutMode === "auto"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setLayoutMode("mobile-sim")}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                layoutMode === "mobile-sim"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>

        {/* Right: Actions (Safe Zone, Whisper, Engine, Export, Google Login) */}
        <div className="flex items-center gap-2">
          {project.videoConfig.aspectRatio === "9:16" && (
            <button
              onClick={() => setShowSafeZone((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 ${
                showSafeZone
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-[#0A0A0A] border-neutral-800 text-neutral-400 hover:text-white"
              }`}
              title="Toggle Safe Zone TikTok / Reels / Shorts"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Safe Zone</span>
            </button>
          )}
          <button
            onClick={() => setShowWhisperModal(true)}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 text-xs font-medium ${
              isWhisperInstalled
                ? "bg-[#0A0A0A] hover:border-white border-neutral-700 text-white"
                : "bg-[#0A0A0A] hover:bg-white hover:text-black border-neutral-700 text-white"
            }`}
            title="Install Whisper & Transcribe Video"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isWhisperInstalled ? "Whisper ASR" : "Install Whisper"}
            </span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg bg-[#0A0A0A] hover:border-neutral-600 border border-neutral-800 text-neutral-300 hover:text-white transition"
            title="Engine Configuration"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Encoding..." : "Export MP4"}</span>
          </button>

          {/* GOOGLE LOGIN BUTTON / PROFILE PILL */}
          {!googleUser ? (
            <button
              onClick={() => {
                setAuthError("");
                setShowGoogleAuthModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-white hover:text-black border border-neutral-700 text-white text-xs font-medium flex items-center gap-2 transition"
              title="Login dengan Google"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.79 0-.8-.08-1.57-.22-2.31z"
                />
                <path
                  fill="currentColor"
                  d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.43.96-3.26 1.53-5.42 1.53-4.17 0-7.7-2.81-8.96-6.59H.05v3.73C2.69 18.42 7.09 22 12.18 22z"
                />
                <path
                  fill="currentColor"
                  d="M3.22 9.44C2.9 8.48 2.72 7.45 2.72 6.38s.18-2.1.5-3.06V-.41H.05C-1.03 1.74-1.64 4.19-1.64 6.38s.61 4.64 1.69 6.79l3.17-3.73z"
                />
                <path
                  fill="currentColor"
                  d="M12.18 2.75c2.35 0 4.46.81 6.12 2.4l4.59-4.59C20.12-2.02 16.5-.62 12.18-.62 7.09-.62 2.69 2.96.05 8.21l3.17 3.73c1.26-3.78 4.79-6.59 8.96-6.59z"
                />
              </svg>
              <span>Sign in</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown((v) => !v)}
                className="pl-1.5 pr-2.5 py-1 rounded-full bg-[#0A0A0A] hover:border-white border border-neutral-700 text-white text-xs font-medium flex items-center gap-2 transition"
                title={`Logged in as ${googleUser.email}`}
              >
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-neutral-600"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white text-black font-bold text-[10px] flex items-center justify-center uppercase">
                    {googleUser.name.charAt(0)}
                  </div>
                )}
                <span className="max-w-[90px] truncate hidden sm:inline">
                  {googleUser.name.split(" ")[0]}
                </span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#080808] border border-neutral-800 shadow-2xl p-3 z-50 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-900">
                    {googleUser.picture ? (
                      <img
                        src={googleUser.picture}
                        alt={googleUser.name}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center uppercase shrink-0">
                        {googleUser.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white truncate">
                        {googleUser.name}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate">
                        {googleUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-neutral-900 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span>Workspace Auto-Sync</span>
                    </span>
                    <span className="font-mono text-[10px] text-white">ON</span>
                  </div>

                  <button
                    onClick={handleManualSaveToAccount}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-white hover:text-black text-white flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {savedNotice ? "Workspace Saved!" : "Save Project Now"}
                      </span>
                    </span>
                    {savedNotice && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowGoogleAuthModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Switch Google Account</span>
                  </button>

                  <button
                    onClick={handleGoogleSignOut}
                    className="w-full py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white flex items-center gap-2 transition border-t border-neutral-900 pt-2.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE
         ===================================================================== */}
      <main className="flex-1 min-h-0 flex justify-center overflow-hidden bg-[#050505]">
        {/* 1. MOBILE VIEWPORT */}
        <div
          className={`${
            isMobileSim
              ? "flex w-[396px] my-3 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden"
              : "flex lg:hidden w-full"
          } flex-col h-full bg-black`}
        >
          <div className="h-[44%] shrink-0 flex flex-col bg-studio-dots border-b border-neutral-900 relative">
            <div className="flex-1 min-h-0 flex items-center justify-center p-3 relative overflow-hidden">
              <div
                className="relative flex items-center justify-center max-w-full max-h-full"
                style={{
                  aspectRatio: `${project.videoConfig.width} / ${project.videoConfig.height}`,
                  height: project.videoConfig.aspectRatio === "9:16" ? "100%" : "auto",
                  width: project.videoConfig.aspectRatio === "16:9" ? "100%" : "auto",
                }}
              >
                <RemotionErrorBoundary
                  resetKey={project.version}
                  onError={(msg) =>
                    setProject((p) => ({
                      ...p,
                      diagnostics: {
                        hasError: true,
                        message: msg,
                        updatedAt: Date.now(),
                      },
                    }))
                  }
                >
                  <Player
                    ref={playerRef}
                    component={SafeVideoComponent}
                    inputProps={project.propsValues}
                    durationInFrames={project.videoConfig.durationInFrames}
                    compositionWidth={project.videoConfig.width}
                    compositionHeight={project.videoConfig.height}
                    fps={project.videoConfig.fps}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "1px solid #262626",
                    }}
                    controls={false}
                    loop
                    autoPlay
                  />
                </RemotionErrorBoundary>

                {/* Safe Zone Overlay for 9:16 Vertical Video */}
                {showSafeZone && project.videoConfig.aspectRatio === "9:16" && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between border-2 border-dashed border-red-500/40">
                    <div className="h-[14%] bg-red-500/10 border-b border-dashed border-red-500/40 p-1.5 flex justify-between text-[8px] font-mono text-red-300">
                      <span>HEADER SAFE ZONE</span>
                      <span>14%</span>
                    </div>
                    <div className="flex-1 flex justify-end">
                      <div className="w-[18%] bg-red-500/10 border-l border-dashed border-red-500/40 p-1 flex items-center justify-center text-[8px] font-mono text-red-300 text-center leading-tight">
                        TOMBOL<br />ACTION
                      </div>
                    </div>
                    <div className="h-[22%] bg-red-500/10 border-t border-dashed border-red-500/40 p-1.5 flex flex-col justify-end text-[8px] font-mono text-red-300">
                      <span>CAPTION SAFE ZONE (22%)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-3.5 py-2.5 bg-black border-t border-neutral-900 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={project.videoConfig.durationInFrames - 1}
                value={currentFrame}
                onChange={(e) => seekToFrame(Number(e.target.value))}
                className="flex-1 studio-slider"
              />
              <span className="text-[11px] font-mono text-neutral-300 tabular-nums shrink-0">
                {formatSmpteTimecode(currentFrame, project.videoConfig.fps)}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeMobileTab === "controls" && renderPropertyInspector()}
              {activeMobileTab === "chat" && renderCommandConsole()}
              {activeMobileTab === "code" && renderCodeEditor()}
              {activeMobileTab === "mcp" && renderMcpInspector()}
            </div>

            <nav className="h-13 shrink-0 bg-black border-t border-neutral-900 grid grid-cols-4">
              {[
                { id: "controls", label: "Inspector", icon: Sliders },
                { id: "chat", label: "Console", icon: MessageSquare },
                { id: "code", label: "Code", icon: Code2 },
                { id: "mcp", label: "MCP", icon: Cpu },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeMobileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMobileTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                      active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 2. DESKTOP 3-COLUMN MINIMALIST STUDIO */}
        {!isMobileSim && (
          <div className="hidden lg:grid lg:grid-cols-12 w-full h-full overflow-hidden">
            <div className="col-span-3 border-r border-neutral-900 flex flex-col h-full min-h-0">
              {renderCommandConsole()}
            </div>

            <div className="col-span-5 border-r border-neutral-900 flex flex-col h-full min-h-0 bg-studio-dots">
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-neutral-500 z-10 pointer-events-none">
                  <span>{project.videoConfig.aspectRatio} // {project.videoConfig.width}×{project.videoConfig.height}</span>
                  <span className="text-white tabular-nums">
                    {formatSmpteTimecode(currentFrame, project.videoConfig.fps)}
                  </span>
                </div>

                <div
                  className="flex items-center justify-center w-full h-full p-2 relative overflow-hidden"
                >
                  <div
                    ref={playerDomRef}
                    className="relative max-w-full max-h-full flex items-center justify-center shadow-[0_24px_70px_rgba(0,0,0,0.9)] border border-neutral-800"
                    style={{
                      aspectRatio: `${project.videoConfig.width} / ${project.videoConfig.height}`,
                      height: project.videoConfig.aspectRatio === "9:16" ? "100%" : "auto",
                      width: project.videoConfig.aspectRatio === "16:9" ? "100%" : "auto",
                    }}
                  >
                    <RemotionErrorBoundary
                      resetKey={project.version}
                      onError={(msg) =>
                        setProject((p) => ({
                          ...p,
                          diagnostics: {
                            hasError: true,
                            message: msg,
                            updatedAt: Date.now(),
                          },
                        }))
                      }
                    >
                      <Player
                        ref={playerRef}
                        component={SafeVideoComponent}
                        inputProps={project.propsValues}
                        durationInFrames={project.videoConfig.durationInFrames}
                        compositionWidth={project.videoConfig.width}
                        compositionHeight={project.videoConfig.height}
                        fps={project.videoConfig.fps}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        controls={false}
                        loop
                        autoPlay
                      />
                    </RemotionErrorBoundary>

                    {/* Safe Zone Overlay for 9:16 Vertical Video */}
                    {showSafeZone && project.videoConfig.aspectRatio === "9:16" && (
                      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between border-2 border-dashed border-red-500/40">
                        <div className="h-[14%] bg-red-500/10 border-b border-dashed border-red-500/40 p-2 flex justify-between text-[10px] font-mono text-red-300">
                          <span>HEADER SAFE ZONE (TIKTOK / REELS)</span>
                          <span>14%</span>
                        </div>
                        <div className="flex-1 flex justify-end">
                          <div className="w-[18%] bg-red-500/10 border-l border-dashed border-red-500/40 p-1 flex items-center justify-center text-[9px] font-mono text-red-300 text-center leading-tight">
                            ACTION<br />BUTTONS
                          </div>
                        </div>
                        <div className="h-[22%] bg-red-500/10 border-t border-dashed border-red-500/40 p-2 flex flex-col justify-end text-[10px] font-mono text-red-300">
                          <span>CAPTION SAFE ZONE (22%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Minimalist Monochrome Timeline */}
              <div className="h-52 shrink-0 border-t border-neutral-900 bg-black flex flex-col">
                <div className="h-11 px-4 border-b border-neutral-900 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => seekToFrame(0)}
                      className="p-1.5 rounded-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
                      title="Reset to Frame 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => seekToFrame(currentFrame - 1)}
                      className="p-1.5 rounded-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
                      title="Previous Frame"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="px-3.5 py-1 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center gap-1.5 text-xs font-medium transition"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3 h-3" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" /> Play
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => seekToFrame(currentFrame + 1)}
                      className="p-1.5 rounded-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
                      title="Next Frame"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                    <span className="text-white">
                      {formatSmpteTimecode(currentFrame, project.videoConfig.fps)}
                    </span>
                    <span className="text-neutral-500">
                      {String(currentFrame).padStart(3, "0")} / {project.videoConfig.durationInFrames}F
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3.5 space-y-2 relative">
                  {project.sequences.map((seq) => {
                    const total = project.videoConfig.durationInFrames;
                    const leftPct = Math.min(100, (seq.from / total) * 100);
                    const widthPct = Math.min(
                      100 - leftPct,
                      (seq.durationInFrames / total) * 100
                    );
                    return (
                      <div key={seq.id} className="flex items-center gap-3 text-[11px] font-mono">
                        <div className="w-40 truncate text-neutral-400 shrink-0">
                          {seq.name}
                        </div>
                        <div
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickRatio = (e.clientX - rect.left) / rect.width;
                            seekToFrame(
                              Math.round(
                                clickRatio * project.videoConfig.durationInFrames
                              )
                            );
                          }}
                          className="flex-1 h-6 bg-[#080808] rounded-md relative overflow-hidden cursor-ew-resize border border-neutral-900"
                        >
                          <div
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            className="absolute top-0.5 bottom-0.5 rounded-xs bg-neutral-900 border-l-2 border-l-white flex items-center px-2 text-[10px] text-neutral-300 truncate"
                          >
                            {seq.from}f — {seq.from + seq.durationInFrames}f
                          </div>
                          {/* Crisp White Playhead Needle */}
                          <div
                            style={{
                              left: `${
                                (currentFrame / project.videoConfig.durationInFrames) *
                                100
                              }%`,
                            }}
                            className="absolute top-0 bottom-0 w-[1.5px] bg-white pointer-events-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-span-4 flex flex-col h-full min-h-0">
              <div className="h-11 shrink-0 bg-black border-b border-neutral-900 grid grid-cols-3 px-2 pt-1.5 gap-1">
                {[
                  { id: "controls", label: "Inspector", icon: Sliders },
                  { id: "code", label: "Code", icon: Code2 },
                  { id: "mcp", label: "MCP", icon: Cpu },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeDesktopRightTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDesktopRightTab(tab.id as any)}
                      className={`text-xs font-medium flex items-center justify-center gap-1.5 transition border-b-2 ${
                        active
                          ? "text-white border-b-white"
                          : "text-neutral-500 border-b-transparent hover:text-neutral-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {activeDesktopRightTab === "controls" && renderPropertyInspector()}
                {activeDesktopRightTab === "code" && renderCodeEditor()}
                {activeDesktopRightTab === "mcp" && renderMcpInspector()}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          WHISPER INSTALLER & VIDEO TRANSCRIPTION MODAL (MONOCHROME)
         ===================================================================== */}
      {showWhisperModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold tracking-tight text-white">
                  Whisper Speech-to-Text
                </span>
              </div>
              <button
                onClick={() => setShowWhisperModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: INSTALL WHISPER */}
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-neutral-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300">
                  1. Model Configuration
                </span>
                {isWhisperInstalled && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    Model Size
                  </label>
                  <select
                    value={whisperModelId}
                    onChange={(e) => {
                      setWhisperModelId(e.target.value as WhisperModelId);
                      setIsWhisperInstalled(false);
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="Xenova/whisper-tiny">
                      whisper-tiny (~75 MB • Super Cepat)
                    </option>
                    <option value="Xenova/whisper-base">
                      whisper-base (~145 MB • Akurat Bahasa Indonesia)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    Language
                  </label>
                  <select
                    value={whisperLang}
                    onChange={(e) => setWhisperLang(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="indonesian">Indonesian</option>
                    <option value="english">English</option>
                    <option value="auto">Auto-Detect</option>
                  </select>
                </div>
              </div>

              {whisperInstallProg && (
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${whisperInstallProg.progress}%` }}
                      className="h-full bg-white transition-all"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400 tabular-nums">
                    <span className="truncate pr-2">{whisperInstallProg.message}</span>
                    <span>{whisperInstallProg.progress}%</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleInstallWhisper}
                disabled={isInstallingWhisper}
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                {isInstallingWhisper ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Downloading Whisper ONNX...</span>
                  </>
                ) : isWhisperInstalled ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Re-verify Whisper Model</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Whisper ({whisperModelId.split("/")[1]})</span>
                  </>
                )}
              </button>
            </div>

            {/* STEP 2: UPLOAD & TRANSCRIBE VIDEO */}
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-neutral-800/80 space-y-3.5">
              <div className="text-xs font-medium text-neutral-300">
                2. Video or Audio Source
              </div>

              <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 hover:border-white bg-black p-5 cursor-pointer transition text-center">
                <FileVideo className="w-5 h-5 text-white mb-2" />
                <span className="text-xs text-white font-medium">
                  {selectedMediaFile
                    ? selectedMediaFile.name
                    : "Select Video (.mp4, .webm, .mov) or Audio (.mp3, .wav)"}
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5">
                  Processed locally in your browser via Web Audio & ONNX
                </span>
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={(e) => handleSelectMediaFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              {selectedMediaFile && (
                <button
                  onClick={handleRunWhisperTranscription}
                  disabled={isTranscribing}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transcribing Media...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Transcribe Video</span>
                    </>
                  )}
                </button>
              )}

              {transcribeStatus && (
                <div className="text-[11px] font-mono text-neutral-400 bg-black border border-neutral-800 rounded-lg px-3 py-2">
                  {transcribeStatus}
                </div>
              )}
            </div>

            {/* STEP 3: TRANSCRIPT PREVIEW */}
            {transcriptionResult && (
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-neutral-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-300">
                    3. Transcript Segments ({transcriptionResult.chunks.length})
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {transcriptionResult.durationSeconds.toFixed(1)}s
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-neutral-900 bg-black border border-neutral-800 rounded-lg">
                  {transcriptionResult.chunks.map((chunk, i) => (
                    <div key={i} className="p-2.5 text-xs flex items-start gap-3">
                      <span className="text-[10px] font-mono text-neutral-500 shrink-0 tabular-nums">
                        {(chunk.timestamp[0] ?? 0).toFixed(1)}s – {(chunk.timestamp[1] ?? 0).toFixed(1)}s
                      </span>
                      <span className="text-white">{chunk.text}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleApplyTranscriptToTimeline}
                    className="py-2.5 px-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Sync Timeline</span>
                  </button>
                  <button
                    onClick={handleExportSubtitleSrt}
                    className="py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-white hover:text-black border border-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor (.SRT)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          EXPORT MP4 MODAL (MONOCHROME)
         ===================================================================== */}
      {(isExporting || exportedVideoUrl) && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <span className="text-sm font-semibold text-white">
                {isExporting ? "Rendering MP4..." : "Export Complete"}
              </span>
              {!isExporting && (
                <button
                  onClick={() => setExportedVideoUrl(null)}
                  className="text-neutral-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isExporting && exportProgress && (
              <div className="space-y-2.5">
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${exportProgress.percent}%` }}
                    className="h-full bg-white transition-all"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 tabular-nums">
                  <span>{exportProgress.statusText}</span>
                  <span className="text-white">{exportProgress.percent}%</span>
                </div>
              </div>
            )}

            {!isExporting && exportedVideoUrl && (
              <div className="space-y-4">
                <video
                  src={exportedVideoUrl.url}
                  controls
                  autoPlay
                  loop
                  className="w-full max-h-64 rounded-lg bg-black border border-neutral-800"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={exportedVideoUrl.url}
                    download={exportedVideoUrl.filename}
                    className="py-2.5 px-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download MP4
                  </a>
                  <button
                    onClick={handleShareVideo}
                    className="py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ENGINE SETTINGS MODAL (MONOCHROME)
         ===================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <span className="text-sm font-semibold text-white">
                Engine Configuration
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1.5">
                  Execution Engine
                </label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) =>
                    setAiSettings((s) => ({
                      ...s,
                      provider: e.target.value as any,
                    }))
                  }
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="smart-builtin">
                    Local Rule Parser (Offline / No API Key)
                  </option>
                  <option value="gemini">Google Gemini API (MCP Tool Calling)</option>
                  <option value="openai">OpenAI API (MCP Tool Calling)</option>
                </select>
              </div>

              {aiSettings.provider !== "smart-builtin" && (
                <>
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1.5">
                      API Key ({aiSettings.provider.toUpperCase()})
                    </label>
                    <input
                      type="password"
                      value={aiSettings.apiKey}
                      onChange={(e) =>
                        setAiSettings((s) => ({ ...s, apiKey: e.target.value }))
                      }
                      placeholder="Enter API Key..."
                      className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1.5">
                      Model Identifier
                    </label>
                    <input
                      type="text"
                      value={aiSettings.model}
                      onChange={(e) =>
                        setAiSettings((s) => ({ ...s, model: e.target.value }))
                      }
                      placeholder={
                        aiSettings.provider === "gemini"
                          ? "gemini-2.5-flash"
                          : "gpt-4o-mini"
                      }
                      className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                </>
              )}

              <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                Tanpa API key, konsol menggunakan <em>Local Rule Parser</em> deterministik untuk memetakan perintah ke 7 MCP Tools. Untuk penulisan kode TSX bebas oleh LLM, pilih Gemini atau OpenAI.
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium text-xs transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          GOOGLE SIGN-IN MODAL (MONOCHROME)
         ===================================================================== */}
      {showGoogleAuthModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.79 0-.8-.08-1.57-.22-2.31z"
                    />
                    <path
                      fill="currentColor"
                      d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.43.96-3.26 1.53-5.42 1.53-4.17 0-7.7-2.81-8.96-6.59H.05v3.73C2.69 18.42 7.09 22 12.18 22z"
                    />
                    <path
                      fill="currentColor"
                      d="M3.22 9.44C2.9 8.48 2.72 7.45 2.72 6.38s.18-2.1.5-3.06V-.41H.05C-1.03 1.74-1.64 4.19-1.64 6.38s.61 4.64 1.69 6.79l3.17-3.73z"
                    />
                    <path
                      fill="currentColor"
                      d="M12.18 2.75c2.35 0 4.46.81 6.12 2.4l4.59-4.59C20.12-2.02 16.5-.62 12.18-.62 7.09-.62 2.69 2.96.05 8.21l3.17 3.73c1.26-3.78 4.79-6.59 8.96-6.59z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Sign in with Google
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Simpan & sinkronkan project video ke akun Google Anda
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleAuthModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-neutral-950 border border-white/40 text-xs text-white flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* 1. INSTANT GOOGLE ACCOUNT SIGN-IN (ZERO-CONFIG) */}
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-neutral-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">
                  1. Instant Google Account Sign-In
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-black font-semibold">
                  READY
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Nama Tampilan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={instantName}
                    onChange={(e) => setInstantName(e.target.value)}
                    placeholder="Contoh: Satria Creator"
                    className="w-full bg-black border border-neutral-800 focus:border-white rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Alamat Email Google (@gmail.com)
                  </label>
                  <input
                    type="email"
                    value={instantEmail}
                    onChange={(e) => setInstantEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInstantGoogleSignIn();
                    }}
                    placeholder="nama@gmail.com"
                    className="w-full bg-black border border-neutral-800 focus:border-white rounded-lg px-3 py-2 text-white outline-none font-mono"
                  />
                </div>

                <button
                  onClick={() => handleInstantGoogleSignIn()}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.79 0-.8-.08-1.57-.22-2.31z"
                    />
                    <path
                      fill="currentColor"
                      d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.43.96-3.26 1.53-5.42 1.53-4.17 0-7.7-2.81-8.96-6.59H.05v3.73C2.69 18.42 7.09 22 12.18 22z"
                    />
                    <path
                      fill="currentColor"
                      d="M3.22 9.44C2.9 8.48 2.72 7.45 2.72 6.38s.18-2.1.5-3.06V-.41H.05C-1.03 1.74-1.64 4.19-1.64 6.38s.61 4.64 1.69 6.79l3.17-3.73z"
                    />
                    <path
                      fill="currentColor"
                      d="M12.18 2.75c2.35 0 4.46.81 6.12 2.4l4.59-4.59C20.12-2.02 16.5-.62 12.18-.62 7.09-.62 2.69 2.96.05 8.21l3.17 3.73c1.26-3.78 4.79-6.59 8.96-6.59z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>
              </div>
            </div>

            {/* 2. OFFICIAL GOOGLE IDENTITY OAUTH 2.0 POPUP */}
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300">
                  2. Official Google OAuth 2.0 Popup (GIS)
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  OPTIONAL
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block text-[11px] text-neutral-400">
                  Google OAuth Client ID (Google Cloud Console)
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="xxxx-xxxx.apps.googleusercontent.com"
                  className="w-full bg-black border border-neutral-800 focus:border-white rounded-lg px-3 py-2 text-white outline-none font-mono text-[11px]"
                />
                <button
                  onClick={handleOfficialGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-white hover:text-black border border-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  {isGoogleSigningIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Opening Google OAuth Popup...</span>
                    </>
                  ) : (
                    <span>Launch Official Google OAuth Popup</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
