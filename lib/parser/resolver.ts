import fs from "node:fs";
import path from "node:path";
import type { ImportResolutionType } from "./types.ts";
import { FallbackAdapter, type FrameworkAdapter } from "./adapter.ts";

const NODE_BUILTINS = new Set([
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "timers",
  "timers/promises",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
]);

const CODE_EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  "/index.ts",
  "/index.tsx",
  "/index.js",
  "/index.jsx",
  "/index.mjs",
  "/index.cjs",
];

const EXCLUDED_ASSET_EXTENSIONS = new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".json",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
]);

export interface TsConfigPaths {
  baseUrl: string;
  paths: Record<string, string[]>;
}

export interface ResolvedImport {
  resolution: ImportResolutionType;
  resolvedPath: string | null;
  reason: string | null;
}

/**
 * Loads tsconfig.json or jsconfig.json compilerOptions.paths if present.
 */
export function loadTsConfigPaths(repoRoot: string): TsConfigPaths {
  const tsConfigPath = path.join(repoRoot, "tsconfig.json");
  const jsConfigPath = path.join(repoRoot, "jsconfig.json");
  const targetConfig = fs.existsSync(tsConfigPath)
    ? tsConfigPath
    : fs.existsSync(jsConfigPath)
      ? jsConfigPath
      : null;

  if (!targetConfig) {
    return { baseUrl: ".", paths: {} };
  }

  try {
    const raw = fs.readFileSync(targetConfig, "utf8");
    // Strip simple comments if any
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, "$1");
    const parsed = JSON.parse(cleaned);
    const compilerOptions = parsed.compilerOptions || {};
    return {
      baseUrl: compilerOptions.baseUrl || ".",
      paths: compilerOptions.paths || {},
    };
  } catch {
    return { baseUrl: ".", paths: {} };
  }
}

/**
 * Resolves an import specifier relative to a source file in the repository.
 */
export function resolveImportSpecifier(
  specifier: string,
  sourceRelPath: string,
  repoRoot: string,
  tsConfig: TsConfigPaths,
  adapter: FrameworkAdapter = new FallbackAdapter()
): ResolvedImport {
  const trimmed = specifier.trim();

  // 1. Node.js built-in modules
  if (trimmed.startsWith("node:") || NODE_BUILTINS.has(trimmed)) {
    return {
      resolution: "external",
      resolvedPath: null,
      reason: `Node.js built-in module (${trimmed})`,
    };
  }

  // 2. Adapter hook for custom framework aliases
  if (adapter.resolveCustomAlias) {
    const custom = adapter.resolveCustomAlias(trimmed, sourceRelPath, repoRoot);
    if (custom) {
      return {
        resolution: "internal",
        resolvedPath: custom,
        reason: null,
      };
    }
  }

  // 3. Resolve candidate file path
  let candidateBase: string | null = null;

  if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed === "." || trimmed === "..") {
    // Relative import
    const sourceAbs = path.resolve(repoRoot, sourceRelPath);
    candidateBase = path.resolve(path.dirname(sourceAbs), trimmed);
  } else if (trimmed.startsWith("/")) {
    // Absolute from repo root
    candidateBase = path.resolve(repoRoot, trimmed.slice(1));
  } else {
    // Check tsconfig paths aliases (e.g. "@/..." -> "./...")
    let matched = false;
    for (const [aliasPattern, targetList] of Object.entries(tsConfig.paths)) {
      if (aliasPattern.endsWith("/*")) {
        const prefix = aliasPattern.slice(0, -2);
        if (trimmed.startsWith(prefix + "/")) {
          const suffix = trimmed.slice(prefix.length + 1);
          for (const targetPattern of targetList) {
            const targetPrefix = targetPattern.replace(/\/\*$/, "");
            const baseDir = path.resolve(repoRoot, tsConfig.baseUrl);
            const resolvedCandidate = path.resolve(baseDir, targetPrefix, suffix);
            candidateBase = resolvedCandidate;
            matched = true;
            break;
          }
        }
      } else if (aliasPattern === trimmed) {
        for (const target of targetList) {
          candidateBase = path.resolve(repoRoot, tsConfig.baseUrl, target);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      // It is an external npm package (e.g. 'react', '@clerk/nextjs')
      return {
        resolution: "external",
        resolvedPath: null,
        reason: `External package (${trimmed})`,
      };
    }
  }

  if (!candidateBase) {
    return {
      resolution: "unresolved",
      resolvedPath: null,
      reason: `Cannot resolve import specifier "${trimmed}" from ${sourceRelPath}`,
    };
  }

  // Check if candidate points to an excluded non-code asset
  const ext = path.extname(candidateBase).toLowerCase();
  if (EXCLUDED_ASSET_EXTENSIONS.has(ext)) {
    return {
      resolution: "excluded",
      resolvedPath: null,
      reason: `Excluded non-code asset (${ext})`,
    };
  }

  // 4. Test candidate against supported code extensions
  let resolvedFile: string | null = null;

  for (const probeExt of CODE_EXTENSIONS) {
    const probePath = candidateBase + probeExt;
    try {
      if (fs.existsSync(probePath)) {
        const stat = fs.statSync(probePath);
        if (stat.isFile()) {
          resolvedFile = probePath;
          break;
        }
      }
    } catch {
      // Continue probing next extension
    }
  }

  if (!resolvedFile) {
    return {
      resolution: "unresolved",
      resolvedPath: null,
      reason: `File not found on disk: "${trimmed}" from ${sourceRelPath}`,
    };
  }

  // 5. Verify the resolved file is inside the repository
  const relResolved = path.relative(repoRoot, resolvedFile).replace(/\\/g, "/");
  if (relResolved.startsWith("..") || path.isAbsolute(relResolved)) {
    return {
      resolution: "external",
      resolvedPath: null,
      reason: `Points outside repository: ${relResolved}`,
    };
  }

  return {
    resolution: "internal",
    resolvedPath: relResolved,
    reason: null,
  };
}
