import type { ParsedEdge, ParsedFile } from "./types.ts";

/**
 * Deduplicates edges so that at most one connection exists between any
 * ordered pair of sourcePath -> targetPath.
 * In case of duplicates, retains the first occurrence or prioritizes primary imports.
 */
export function deduplicateEdges(edges: ParsedEdge[]): ParsedEdge[] {
  const seen = new Set<string>();
  const deduplicated: ParsedEdge[] = [];

  for (const edge of edges) {
    const key = `${edge.sourcePath}->${edge.targetPath}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(edge);
    }
  }

  return deduplicated;
}

/**
 * Computes fan-in (number of internal files importing this file) and
 * fan-out (number of internal files this file imports) as pure arithmetic over
 * the file list and deduplicated edge list.
 */
export function computeGraphMetrics(
  files: ParsedFile[],
  deduplicatedEdges: ParsedEdge[]
): ParsedFile[] {
  const fanInCounts = new Map<string, number>();
  const fanOutCounts = new Map<string, number>();

  for (const edge of deduplicatedEdges) {
    fanOutCounts.set(edge.sourcePath, (fanOutCounts.get(edge.sourcePath) || 0) + 1);
    fanInCounts.set(edge.targetPath, (fanInCounts.get(edge.targetPath) || 0) + 1);
  }

  return files.map((file) => ({
    ...file,
    fanIn: fanInCounts.get(file.path) || 0,
    fanOut: fanOutCounts.get(file.path) || 0,
  }));
}
