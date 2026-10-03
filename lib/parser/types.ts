/**
 * Phase 3 — The Parser Contracts
 * 
 * Strict types for repository files, edges, coverage, and parse results.
 * This shape is a contract read by all downstream analysis phases.
 */

export type ImportKind = "import" | "re_export" | "dynamic_import";

export type ImportResolutionType = "internal" | "external" | "excluded" | "unresolved";

export interface ParsedFile {
  /** Stable identifier (relative posix path) */
  id: string;
  /** Relative path from repository root with forward slashes, e.g. 'lib/parser/index.ts' */
  path: string;
  /** Directory containing the file relative to repository root, e.g. 'lib/parser' */
  directory: string;
  /** File name with extension, e.g. 'index.ts' */
  name: string;
  /** File extension, e.g. '.ts', '.tsx', '.js' */
  extension: string;
  /** Exact line count of the source file */
  linesCount: number;
  /** SHA-256 hexadecimal digest of raw file content */
  contentHash: string;
  /** Number of internal files that import this file */
  fanIn: number;
  /** Number of internal files this file imports */
  fanOut: number;
}

export interface ParsedEdge {
  /** Stable unique edge identifier: sourcePath -> targetPath */
  id: string;
  /** Relative posix path of importing file */
  sourcePath: string;
  /** Relative posix path of imported file inside repository */
  targetPath: string;
  /** The kind of connection */
  importType: ImportKind;
  /** The verbatim string literal from code, e.g. './utils' or '@/lib/db' */
  rawSpecifier: string;
}

export interface SkippedFile {
  /** Relative posix path of the skipped file */
  path: string;
  /** Concrete reason why this file was skipped */
  reason: string;
}

export interface UnresolvedImport {
  /** Relative posix path of file containing the import */
  sourcePath: string;
  /** Verbatim import specifier */
  rawSpecifier: string;
  /** Kind of import */
  importType: ImportKind;
  /** 1-indexed line number in source file */
  line: number;
  /** Detailed reason why resolution failed */
  reason: string;
}

export interface CoverageReport {
  /** Total files encountered during walk */
  totalFilesFound: number;
  /** Total code files successfully parsed into nodes */
  totalFilesParsed: number;
  /** Total non-code or excluded files skipped */
  totalFilesSkipped: number;
  /** Breakdown of skipped files by reason */
  skipReasons: Record<string, number>;
  /** Complete list of all skipped files with reasons */
  skippedFiles: SkippedFile[];
  /** Total import/export statements inspected */
  totalImports: number;
  /** Imports pointing to files inside repository */
  internalImports: number;
  /** Imports pointing to external packages or Node.js built-ins */
  externalImports: number;
  /** Imports pointing to deliberately excluded files (e.g. .css, .svg) */
  excludedImports: number;
  /** Imports that failed to resolve to a real file */
  unresolvedImports: number;
  /** Detailed examples of failed resolutions with reasons */
  unresolvedExamples: UnresolvedImport[];
  /** Total re-exports found across all files */
  reExportsFound: number;
  /** Re-exports successfully resolved (internal or external) */
  reExportsResolved: number;
  /** Re-exports that failed to resolve */
  reExportsUnresolved: number;
  /** Ratio of internal resolved imports to (internal + unresolved) */
  coverageRatio: number;
}

export interface ParseResult {
  /** Absolute path of target repository */
  repositoryRoot: string;
  /** All parsed file nodes */
  files: ParsedFile[];
  /** All resolved internal dependency edges (deduplicated) */
  edges: ParsedEdge[];
  /** Full coverage and resolution audit */
  coverage: CoverageReport;
  /** Number of distinct directory folders represented in the output */
  distinctDirectoriesCount: number;
}

export interface ParseOptions {
  /** Additional directories to ignore during walking (defaults to standard VCS/build artifacts) */
  ignoreDirs?: string[];
  /** Whether to suppress console progress logging */
  quiet?: boolean;
}
