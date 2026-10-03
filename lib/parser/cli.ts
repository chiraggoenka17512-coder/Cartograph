import fs from "node:fs";
import path from "node:path";
import { parseRepository } from "./index.ts";
import type { ParseResult } from "./types.ts";

/**
 * Command-line runner for the Cartograph Phase 3 parser.
 * Usage:
 *   node --experimental-strip-types lib/parser/cli.ts [dir] [--out <output.json>]
 */
async function main() {
  const args = process.argv.slice(2);
  let targetDir = ".";
  let outFilePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && i + 1 < args.length) {
      outFilePath = args[i + 1];
      i++;
    } else if (!args[i].startsWith("--")) {
      targetDir = args[i];
    }
  }

  const resolvedDir = path.resolve(targetDir);
  const startTime = Date.now();

  const result: ParseResult = await parseRepository(resolvedDir);
  const elapsedMs = Date.now() - startTime;

  const { coverage, files, edges, distinctDirectoriesCount } = result;

  console.log("\n========================================================");
  console.log("             CARTOGRAPH // AST PARSER CLI               ");
  console.log("========================================================");
  console.log(`Target Directory: ${resolvedDir}`);
  console.log(`Execution Time:   ${elapsedMs}ms\n`);

  console.log("--- 1. File Counts & Invariant Check ---");
  console.log(`Total Files Found:   ${coverage.totalFilesFound}`);
  console.log(`Total Files Parsed:  ${coverage.totalFilesParsed}`);
  console.log(`Total Files Skipped: ${coverage.totalFilesSkipped}`);

  const invariantHolds =
    coverage.totalFilesFound ===
    coverage.totalFilesParsed + coverage.totalFilesSkipped;

  console.log(
    `Sum Invariant:       ${coverage.totalFilesParsed} + ${coverage.totalFilesSkipped} = ${coverage.totalFilesParsed + coverage.totalFilesSkipped} (${invariantHolds ? "VERIFIED VALID" : "INVARIANT FAILED"})`
  );

  console.log("\n--- Skip Reasons Breakdown ---");
  for (const [reason, count] of Object.entries(coverage.skipReasons)) {
    console.log(`  • ${reason}: ${count}`);
  }

  console.log("\n--- 2. Directory Hierarchy ---");
  console.log(`Distinct Folders Count: ${distinctDirectoriesCount}`);

  console.log("\n--- 3. Dependency Edges & Re-exports ---");
  console.log(`Deduplicated Internal Edges: ${edges.length}`);
  console.log(`Total Imports Inspected:     ${coverage.totalImports}`);
  console.log(`  • Internal:   ${coverage.internalImports}`);
  console.log(`  • External:   ${coverage.externalImports}`);
  console.log(`  • Excluded:   ${coverage.excludedImports}`);
  console.log(`  • Unresolved: ${coverage.unresolvedImports}`);

  console.log(`\nRe-exports Found:      ${coverage.reExportsFound}`);
  console.log(`Re-exports Resolved:   ${coverage.reExportsResolved}`);
  console.log(`Re-exports Unresolved: ${coverage.reExportsUnresolved}`);
  const reExportsMatch =
    coverage.reExportsFound ===
    coverage.reExportsResolved + coverage.reExportsUnresolved;
  console.log(`Re-exports Accounting: ${reExportsMatch ? "VERIFIED MATCH" : "DISCREPANCY DETECTED"}`);

  console.log(`\nCoverage Ratio: ${(coverage.coverageRatio * 100).toFixed(1)}%`);

  if (coverage.unresolvedExamples.length > 0) {
    console.log("\n--- Unresolved Import Examples ---");
    for (const ex of coverage.unresolvedExamples.slice(0, 10)) {
      console.log(`  [${ex.sourcePath}:${ex.line}] "${ex.rawSpecifier}" (${ex.importType})`);
      console.log(`    ↳ Reason: ${ex.reason}`);
    }
  }

  if (outFilePath) {
    const fullOutPath = path.resolve(outFilePath);
    fs.mkdirSync(path.dirname(fullOutPath), { recursive: true });
    fs.writeFileSync(fullOutPath, JSON.stringify(result, null, 2), "utf8");
    console.log(`\n--- 4. Typed Output Contract ---`);
    console.log(`Written to: ${fullOutPath}`);

    // Read back verification
    const readBackRaw = fs.readFileSync(fullOutPath, "utf8");
    const readBack: ParseResult = JSON.parse(readBackRaw);
    const filesHold = Array.isArray(readBack.files) && readBack.files.length === files.length;
    const edgesHold = Array.isArray(readBack.edges) && readBack.edges.length === edges.length;
    const covHold = readBack.coverage && typeof readBack.coverage.coverageRatio === "number";

    if (filesHold && edgesHold && covHold) {
      console.log("Read back verification: PASS (All schema types held)");
    } else {
      console.error("Read back verification: FAIL (Schema mismatch)");
      process.exit(1);
    }
  }

  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Fatal parser error:", err);
  process.exit(1);
});
