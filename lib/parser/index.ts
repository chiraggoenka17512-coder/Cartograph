import fs from "node:fs";
import path from "node:path";
import type {
  CoverageReport,
  ParsedEdge,
  ParsedFile,
  ParseOptions,
  ParseResult,
  UnresolvedImport,
} from "./types.ts";
import { walkRepository } from "./walker.ts";
import { createParserProject, extractFileMetadata } from "./extractor.ts";
import { loadTsConfigPaths, resolveImportSpecifier } from "./resolver.ts";
import { computeGraphMetrics, deduplicateEdges } from "./graph.ts";
import { FallbackAdapter, type FrameworkAdapter } from "./adapter.ts";

export type * from "./types.ts";
export * from "./adapter.ts";
export * from "./walker.ts";
export * from "./extractor.ts";
export * from "./resolver.ts";
export * from "./graph.ts";

/**
 * Main parser entry point: Parses any repository on disk into a structural graph of files,
 * AST-resolved connections, and a comprehensive coverage report.
 * 
 * Guaranteed constraints:
 * - Standalone: Does not import Next, React, or database clients.
 * - Framework agnostic: Framework knowledge isolated to adapters.
 * - No guessed edges: Edges only exist if an import resolved to a real file on disk.
 */
export async function parseRepository(
  targetDir: string,
  options?: ParseOptions,
  adapter: FrameworkAdapter = new FallbackAdapter()
): Promise<ParseResult> {
  const rootDir = path.resolve(targetDir);

  if (!fs.existsSync(rootDir)) {
    throw new Error(`Target repository directory does not exist: ${rootDir}`);
  }

  const stat = fs.statSync(rootDir);
  if (!stat.isDirectory()) {
    throw new Error(`Target repository path is not a directory: ${rootDir}`);
  }

  // 1. Walk directory and categorize all files
  const { codeFiles, skippedFiles, totalFilesFound } = walkRepository(
    rootDir,
    options?.ignoreDirs
  );

  // 2. Load path aliases from tsconfig.json / jsconfig.json
  const tsConfig = loadTsConfigPaths(rootDir);

  // 3. Initialize AST parsing project
  const project = createParserProject();

  const rawEdges: ParsedEdge[] = [];
  const unresolvedExamples: UnresolvedImport[] = [];

  let totalImports = 0;
  let internalImports = 0;
  let externalImports = 0;
  let excludedImports = 0;
  let unresolvedImports = 0;
  let reExportsFound = 0;
  let reExportsResolved = 0;
  let reExportsUnresolved = 0;

  const filesMap = new Map<string, ParsedFile>();

  // 4. Process each code file
  for (const relPath of codeFiles) {
    const fullPath = path.join(rootDir, relPath);
    let content = "";
    try {
      content = fs.readFileSync(fullPath, "utf8");
    } catch {
      continue;
    }

    const ext = path.extname(relPath).toLowerCase();
    const name = path.basename(relPath);
    const rawDir = path.dirname(relPath).replace(/\\/g, "/");
    const directory = rawDir === "" ? "." : rawDir;

    const { linesCount, contentHash, imports } = extractFileMetadata(
      fullPath,
      content,
      project
    );

    const parsedFile: ParsedFile = {
      id: relPath,
      path: relPath,
      directory,
      name,
      extension: ext,
      linesCount,
      contentHash,
      fanIn: 0,
      fanOut: 0,
    };

    filesMap.set(relPath, parsedFile);

    // 5. Inspect and resolve each import in this file
    for (const imp of imports) {
      totalImports++;

      if (imp.kind === "re_export") {
        reExportsFound++;
      }

      const resolution = resolveImportSpecifier(
        imp.specifier,
        relPath,
        rootDir,
        tsConfig,
        adapter
      );

      switch (resolution.resolution) {
        case "internal": {
          internalImports++;
          if (imp.kind === "re_export") {
            reExportsResolved++;
          }
          if (resolution.resolvedPath) {
            rawEdges.push({
              id: `${relPath}->${resolution.resolvedPath}`,
              sourcePath: relPath,
              targetPath: resolution.resolvedPath,
              importType: imp.kind,
              rawSpecifier: imp.specifier,
            });
          }
          break;
        }
        case "external": {
          externalImports++;
          if (imp.kind === "re_export") {
            reExportsResolved++;
          }
          break;
        }
        case "excluded": {
          excludedImports++;
          break;
        }
        case "unresolved": {
          unresolvedImports++;
          if (imp.kind === "re_export") {
            reExportsUnresolved++;
          }
          unresolvedExamples.push({
            sourcePath: relPath,
            rawSpecifier: imp.specifier,
            importType: imp.kind,
            line: imp.line,
            reason: resolution.reason || "Unknown resolution failure",
          });
          break;
        }
      }
    }
  }

  // 6. Deduplicate edges and compute graph metrics (fan-in / fan-out)
  const deduplicatedEdges = deduplicateEdges(rawEdges);
  const initialFiles = Array.from(filesMap.values());
  const finalFiles = computeGraphMetrics(initialFiles, deduplicatedEdges);

  // 7. Aggregate skip reasons
  const skipReasons: Record<string, number> = {};
  for (const item of skippedFiles) {
    skipReasons[item.reason] = (skipReasons[item.reason] || 0) + 1;
  }

  // 8. Count distinct folders among parsed files
  const distinctDirs = new Set<string>();
  for (const file of finalFiles) {
    distinctDirs.add(file.directory);
  }

  // 9. Calculate coverage ratio
  const totalInternalAttempts = internalImports + unresolvedImports;
  const coverageRatio =
    totalInternalAttempts > 0
      ? Number((internalImports / totalInternalAttempts).toFixed(4))
      : 1.0;

  const coverage: CoverageReport = {
    totalFilesFound,
    totalFilesParsed: finalFiles.length,
    totalFilesSkipped: skippedFiles.length,
    skipReasons,
    skippedFiles,
    totalImports,
    internalImports,
    externalImports,
    excludedImports,
    unresolvedImports,
    unresolvedExamples,
    reExportsFound,
    reExportsResolved,
    reExportsUnresolved,
    coverageRatio,
  };

  return {
    repositoryRoot: rootDir,
    files: finalFiles,
    edges: deduplicatedEdges,
    coverage,
    distinctDirectoriesCount: distinctDirs.size,
  };
}
