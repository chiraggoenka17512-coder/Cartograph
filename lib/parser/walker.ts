import fs from "node:fs";
import path from "node:path";
import type { SkippedFile } from "./types.ts";

export const DEFAULT_IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  ".gemini",
  ".claude",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".pnpm",
  ".system_generated",
]);

export const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

export interface WalkResult {
  codeFiles: string[];
  skippedFiles: SkippedFile[];
  totalFilesFound: number;
}

/**
 * Classifies a file and provides a specific, descriptive skip reason if it's not parsed as code.
 */
export function getSkipReason(fileName: string): string {
  if (fileName.endsWith(".d.ts")) {
    return "TypeScript declaration file (.d.ts)";
  }

  const ext = path.extname(fileName).toLowerCase();

  switch (ext) {
    case ".md":
    case ".markdown":
    case ".mdx":
      return `Markdown documentation (${ext})`;
    case ".json":
      return "JSON data/configuration (.json)";
    case ".yaml":
    case ".yml":
      return `YAML configuration (${ext})`;
    case ".css":
    case ".scss":
    case ".sass":
    case ".less":
      return `Stylesheet (${ext})`;
    case ".sql":
      return "SQL database script (.sql)";
    case ".svg":
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".ico":
    case ".webp":
    case ".gif":
      return `Static media asset (${ext})`;
    case ".woff":
    case ".woff2":
    case ".ttf":
    case ".eot":
      return `Font asset (${ext})`;
    case ".lock":
    case ".tsbuildinfo":
      return `Build cache/lockfile (${ext})`;
    default:
      if (fileName.startsWith(".env") || fileName.endsWith(".local") || fileName.endsWith(".example")) {
        return "Environment configuration file";
      }
      if (!ext) {
        return "File without file extension";
      }
      return `Non-source file (${ext})`;
  }
}

/**
 * Recursively walks repository directory to structurally select files.
 * Ignores build artifacts and VCS directories, classifying every other file
 * as either a code file to parse or a skipped file with an exact reason.
 */
export function walkRepository(
  repoRoot: string,
  customIgnoreDirs?: string[]
): WalkResult {
  const ignoredDirs = new Set([...DEFAULT_IGNORED_DIRS, ...(customIgnoreDirs || [])]);
  const codeFiles: string[] = [];
  const skippedFiles: SkippedFile[] = [];

  function traverse(currentDir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    // Sort entries for deterministic ordering across OS environments
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) {
          // Do not descend into build or dependency trees
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const isDeclaration = entry.name.endsWith(".d.ts");

        if (CODE_EXTENSIONS.has(ext) && !isDeclaration) {
          codeFiles.push(relPath);
        } else {
          skippedFiles.push({
            path: relPath,
            reason: getSkipReason(entry.name),
          });
        }
      }
    }
  }

  traverse(repoRoot);

  return {
    codeFiles,
    skippedFiles,
    totalFilesFound: codeFiles.length + skippedFiles.length,
  };
}
