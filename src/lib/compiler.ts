"use client";

import React from "react";
import * as Remotion from "remotion";
import * as LucideIcons from "lucide-react";
import * as Babel from "@babel/standalone";
import { SequenceLayer, VirtualFile } from "@/types/studio";
import { extractSequencesFromCode } from "@/lib/sequence-parser";

export interface CompileResult {
  Component: React.ComponentType<any> | null;
  error: string | null;
  line?: number;
  column?: number;
  detectedSequences: SequenceLayer[];
}

export { extractSequencesFromCode };

/**
 * Compiles a Remotion TSX component string in the browser into a live React component.
 */
export function compileRemotionCode(
  entryCode: string,
  files: Record<string, VirtualFile> = {},
  totalDuration = 150
): CompileResult {
  try {
    const detectedSequences = extractSequencesFromCode(entryCode, totalDuration);

    const compileSingleModule = (code: string, filename: string) => {
      const transformed = Babel.transform(code, {
        filename,
        presets: ["react", "typescript"],
        plugins: ["transform-modules-commonjs"],
      });

      if (!transformed || !transformed.code) {
        throw new Error(`Gagal meng-compile file ${filename}`);
      }
      return transformed.code;
    };

    const compiledCache: Record<string, any> = {};

    const customRequire = (modName: string): any => {
      if (modName === "react") return React;
      if (modName === "remotion") return Remotion;
      if (modName === "lucide-react") return LucideIcons;

      // Resolve VFS relative imports (e.g. "./Scene1" -> "Scene1.tsx")
      const normalized = modName.replace(/^\.\//, "");
      const candidates = [
        normalized,
        `${normalized}.tsx`,
        `${normalized}.ts`,
        `${normalized}.json`,
      ];

      for (const candidate of candidates) {
        if (files[candidate]) {
          if (compiledCache[candidate]) return compiledCache[candidate];
          if (candidate.endsWith(".json")) {
            const parsed = JSON.parse(files[candidate].content);
            compiledCache[candidate] = parsed;
            return parsed;
          }
          const jsCode = compileSingleModule(files[candidate].content, candidate);
          const mod = { exports: {} as any };
          const fn = new Function("exports", "require", "module", "React", jsCode);
          fn(mod.exports, customRequire, mod, React);
          compiledCache[candidate] = mod.exports;
          return mod.exports;
        }
      }

      throw new Error(`Module '${modName}' tidak ditemukan di Virtual File System.`);
    };

    const mainJs = compileSingleModule(entryCode, "MainVideo.tsx");
    const moduleObj = { exports: {} as any };
    const evaluator = new Function("exports", "require", "module", "React", mainJs);
    evaluator(moduleObj.exports, customRequire, moduleObj, React);

    const ExportedComponent =
      moduleObj.exports.default ||
      moduleObj.exports.MainComposition ||
      Object.values(moduleObj.exports).find((v) => typeof v === "function");

    if (!ExportedComponent || typeof ExportedComponent !== "function") {
      return {
        Component: null,
        error:
          "Komponen utama tidak ditemukan. Pastikan file mengekspor `export default function MainComposition(props)`.",
        detectedSequences,
      };
    }

    return {
      Component: ExportedComponent as React.ComponentType<any>,
      error: null,
      detectedSequences,
    };
  } catch (err: any) {
    const msg = err?.message || "Unknown compilation error";
    const locMatch = msg.match(/\((\d+):(\d+)\)/);
    return {
      Component: null,
      error: msg,
      line: locMatch ? parseInt(locMatch[1], 10) : undefined,
      column: locMatch ? parseInt(locMatch[2], 10) : undefined,
      detectedSequences: [],
    };
  }
}
