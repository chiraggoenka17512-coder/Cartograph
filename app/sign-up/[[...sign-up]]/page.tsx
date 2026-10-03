import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-8 bg-[var(--background)]">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left technical brief */}
        <div className="space-y-6 text-left hidden md:block">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[var(--panel-border)] bg-[var(--panel)] text-[11px] font-mono text-[var(--color-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>CARTOGRAPH // AST ENGINE</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Create your organization
            </h1>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Sign up to start parsing GitHub repositories into interactive architectural maps with your team.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-[var(--panel-border)] text-xs text-[var(--color-muted)] font-mono">
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--color-foreground)]">✓</span>
              <span>Postgres Row-Level Security on every table</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--color-foreground)]">✓</span>
              <span>Zero heuristic or guessed dependencies</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--color-foreground)]">✓</span>
              <span>Fast organizational context switching</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors inline-flex items-center gap-1 font-mono"
            >
              &larr; Back to overview
            </Link>
          </div>
        </div>

        {/* Right Sign-up Card */}
        <div className="flex justify-center w-full">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
}
