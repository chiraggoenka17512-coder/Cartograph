/**
 * Phase 3 — Adapter Interface & Fallback
 * 
 * Framework knowledge lives exclusively in adapters.
 * The parser itself has zero framework-specific branches.
 * In Phase 3, only the interface and the fallback adapter exist.
 */

export interface FrameworkAdapter {
  /** Name of the framework (or 'fallback') */
  readonly name: string;
  /** Whether this adapter applies to the given repository directory */
  matches(repositoryRoot: string): boolean;
  /** Optional custom resolution for framework-specific alias schemes */
  resolveCustomAlias?(
    specifier: string,
    sourceFilePath: string,
    repositoryRoot: string
  ): string | null;
}

/**
 * Fallback adapter used when no specialized framework is recognized or configured.
 * Assumes pure standard TypeScript/JavaScript semantics without magical conventions.
 */
export class FallbackAdapter implements FrameworkAdapter {
  readonly name = "fallback";

  matches(): boolean {
    return true;
  }

  resolveCustomAlias(): string | null {
    return null;
  }
}
