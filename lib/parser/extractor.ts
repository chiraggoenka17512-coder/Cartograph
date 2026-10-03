import crypto from "node:crypto";
import path from "node:path";
import { Project, SyntaxKind, SourceFile } from "ts-morph";
import type { ImportKind } from "./types.ts";

export interface ExtractedImport {
  specifier: string;
  kind: ImportKind;
  line: number;
}

export interface ExtractedFileMetadata {
  linesCount: number;
  contentHash: string;
  imports: ExtractedImport[];
}

/**
 * Creates an in-memory ts-morph Project for parsing source files without tsconfig coupling.
 */
export function createParserProject(): Project {
  return new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
      jsx: 1, // Preserve / React
      noEmit: true,
    },
  });
}

/**
 * Extracts line count, SHA-256 content hash, and all import/export/dynamic import statements from source code.
 */
export function extractFileMetadata(
  filePath: string,
  content: string,
  project: Project
): ExtractedFileMetadata {
  // 1. Content hash
  const contentHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");

  // 2. Line count
  const lines = content.split(/\r?\n/);
  const linesCount = lines.length;

  // 3. Create AST source file in ts-morph
  // Use a unique dummy name to avoid collisions in the project
  const ext = path.extname(filePath) || ".ts";
  const tempPath = `/__cartograph_virtual_${contentHash.slice(0, 12)}${ext}`;
  const sourceFile: SourceFile = project.createSourceFile(tempPath, content, { overwrite: true });

  const rawImports: ExtractedImport[] = [];

  try {
    // A. Plain imports: import ... from "specifier"; import "specifier";
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const spec = importDecl.getModuleSpecifierValue();
      if (spec) {
        rawImports.push({
          specifier: spec,
          kind: "import",
          line: importDecl.getStartLineNumber(),
        });
      }
    }

    // B. Re-exports: export ... from "specifier"; export * from "specifier";
    for (const exportDecl of sourceFile.getExportDeclarations()) {
      if (exportDecl.hasModuleSpecifier()) {
        const spec = exportDecl.getModuleSpecifierValue();
        if (spec) {
          rawImports.push({
            specifier: spec,
            kind: "re_export",
            line: exportDecl.getStartLineNumber(),
          });
        }
      }
    }

    // C. Dynamic imports: import("specifier") with literal string
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
      if (callExpr.getExpression().getKind() === SyntaxKind.ImportKeyword) {
        const args = callExpr.getArguments();
        if (args.length > 0) {
          const firstArg = args[0];
          const kind = firstArg.getKind();
          if (kind === SyntaxKind.StringLiteral || kind === SyntaxKind.NoSubstitutionTemplateLiteral) {
            // Extract string literal value
            const rawText = firstArg.getText();
            const spec = rawText.slice(1, -1);
            if (spec) {
              rawImports.push({
                specifier: spec,
                kind: "dynamic_import",
                line: callExpr.getStartLineNumber(),
              });
            }
          }
        }
      }
    }
  } finally {
    // Clean up virtual file from project memory
    project.removeSourceFile(sourceFile);
  }

  return {
    linesCount,
    contentHash,
    imports: rawImports,
  };
}
