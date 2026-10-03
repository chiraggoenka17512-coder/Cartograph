import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUserOrganization } from "@/lib/auth/org";
import { AutoActivateOrg } from "@/components/auto-activate-org";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function HomePage() {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono">
        <div className="max-w-lg space-y-4">
          <div className="inline-block px-2 py-0.5 text-[11px] rounded border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--color-muted)]">
            cartograph // repository dependency visualizer
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            Deterministic Codebase Mapping
          </h1>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
            Parses public GitHub repositories into complete AST-resolved dependency maps.
            Sign in to access your team workspaces.
          </p>
          <div className="pt-2">
            <SignInButton mode="modal">
              <button className="px-4 py-1.5 text-xs font-mono rounded bg-[var(--color-foreground)] text-[var(--color-background)] font-medium hover:opacity-90 transition-opacity">
                Sign in to continue
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  // For signed-in users: ensure organization exists and is resolved
  const orgState = await ensureUserOrganization();
  const user = await currentUser();

  const activeOrgDisplay = orgSlug || orgId || (orgState.pendingOrgIdToActivate ? "activating..." : "personal");

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 font-mono">
      {orgState.pendingOrgIdToActivate && (
        <AutoActivateOrg targetOrgId={orgState.pendingOrgIdToActivate} />
      )}

      <div className="border border-[var(--panel-border)] bg-[var(--panel)] rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-foreground)]">
              Workspace Overview
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--panel-border)] text-[var(--color-muted)]">
            SSR paint
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-[11px] text-[var(--color-muted)]">Current Organization</div>
            <div
              className="text-sm font-semibold text-[var(--color-foreground)]"
              data-testid="current-org-name"
            >
              {activeOrgDisplay}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-[var(--color-muted)]">Organization ID (Token Claim)</div>
            <div
              className="text-xs text-[var(--color-foreground)] truncate"
              data-testid="current-org-id"
            >
              {orgId || orgState.pendingOrgIdToActivate || "none"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-[var(--color-muted)]">Signed-in Identity</div>
            <div className="text-xs text-[var(--color-foreground)] truncate">
              {user?.primaryEmailAddress?.emailAddress || userId}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-[var(--color-muted)]">Organization Role</div>
            <div className="text-xs text-[var(--color-foreground)]">
              {orgRole || "org:admin"}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--color-muted)]">
            Protected Routes:
          </span>
          <Link
            href="/workspace"
            className="text-[11px] px-3 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--muted)]/10 transition-colors"
          >
            Open Protected Workspace &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
