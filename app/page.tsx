import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { ensureUserOrganization } from "@/lib/auth/org";
import { AutoActivateOrg } from "@/components/auto-activate-org";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { getDashboardAnalyses } from "@/lib/db/analyses";
import { AnalysesList } from "@/components/dashboard/analyses-list";

export default async function HomePage() {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 font-sans bg-[var(--background)]">
        <div className="w-full max-w-2xl space-y-8 text-center sm:text-left">
          {/* Header pill */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] text-[11px] font-mono text-[var(--color-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CARTOGRAPH // ENGINE ONLINE</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[var(--panel-border)] text-[var(--color-muted)]">
              AST RESOLVER
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
              Deterministic Codebase Mapping
            </h1>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-xl">
              Reads public GitHub repositories and draws them as real dependency maps. Every node and edge is parsed from TypeScript and JavaScript compiler ASTs. No guessed connections, no hallucinations.
            </p>
          </div>

          {/* Feature highlights bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] space-y-1">
              <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider">Parser</div>
              <div className="text-[var(--color-foreground)] font-semibold">ts-morph AST</div>
            </div>
            <div className="p-3 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] space-y-1">
              <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider">Isolation</div>
              <div className="text-[var(--color-foreground)] font-semibold">Postgres RLS</div>
            </div>
            <div className="p-3 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] space-y-1">
              <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider">Engine</div>
              <div className="text-[var(--color-foreground)] font-semibold">React Flow & Dagre</div>
            </div>
          </div>

          {/* Call to action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto px-5 py-2 text-xs font-sans rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
                Sign in to continue &rarr;
              </button>
            </SignInButton>
            <span className="text-xs text-[var(--color-muted)] font-mono">
              Clerk multi-tenant authentication
            </span>
          </div>
        </div>
      </div>
    );
  }

  // For signed-in users: ensure organization exists and is resolved
  const orgState = await ensureUserOrganization();
  const user = await currentUser();

  let orgName: string | undefined;
  if (orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      orgName = org.name;
    } catch {
      // fallback to orgSlug or orgId
    }
  }

  const activeOrgDisplay = orgName || orgSlug || orgId || (orgState.pendingOrgIdToActivate ? "activating..." : "personal");

  const analyses = await getDashboardAnalyses();

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 font-sans">
      {orgState.pendingOrgIdToActivate && (
        <AutoActivateOrg targetOrgId={orgState.pendingOrgIdToActivate} />
      )}

      {/* Telemetry and context bar */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)] rounded-lg p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--panel-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-foreground)]">
              Workspace Telemetry
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              RLS Active
            </span>
            <Link
              href="/workspace"
              className="text-[11px] font-sans px-2.5 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--panel-elevated)] text-[var(--color-foreground)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Workspace Graph</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">Organization</div>
            <div
              className="text-xs font-semibold text-[var(--color-foreground)] truncate"
              data-testid="current-org-name"
            >
              {activeOrgDisplay}
            </div>
          </div>

          <div className="p-2.5 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">Org Token Claim</div>
            <div
              className="text-xs font-mono text-[var(--color-foreground)] truncate"
              data-testid="current-org-id"
              title={orgId || orgState.pendingOrgIdToActivate || "none"}
            >
              {orgId || orgState.pendingOrgIdToActivate || "none"}
            </div>
          </div>

          <div className="p-2.5 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">Identity</div>
            <div className="text-xs text-[var(--color-foreground)] truncate" title={user?.primaryEmailAddress?.emailAddress || userId || ""}>
              {user?.primaryEmailAddress?.emailAddress || userId}
            </div>
          </div>

          <div className="p-2.5 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">Org Role</div>
            <div className="text-xs font-mono text-[var(--color-foreground)] truncate">
              {orgRole || "org:admin"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Analyses Dashboard */}
      <AnalysesList analyses={analyses} activeOrgDisplay={activeOrgDisplay} />
    </div>
  );
}
