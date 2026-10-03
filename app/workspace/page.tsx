import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WorkspacePage() {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors inline-flex items-center gap-1 font-mono"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="border border-[var(--panel-border)] bg-[var(--panel)] rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs uppercase tracking-wider text-[var(--color-foreground)] font-semibold font-sans">
              Protected Workspace Scope
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono uppercase tracking-wider">
            Verified Claim
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider font-mono">Organization</div>
            <div className="text-[var(--color-foreground)] font-semibold truncate" data-testid="ssr-org-slug">
              {orgSlug || orgId || "No active organization"}
            </div>
          </div>
          <div className="p-3 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider font-mono">Organization ID</div>
            <div className="text-[var(--color-foreground)] font-mono text-[11px] truncate" data-testid="ssr-org-id">
              {orgId || "unassigned"}
            </div>
          </div>
          <div className="p-3 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider font-mono">User Identity</div>
            <div className="text-[var(--color-foreground)] truncate" title={user?.primaryEmailAddress?.emailAddress || userId || ""}>
              {user?.primaryEmailAddress?.emailAddress || userId}
            </div>
          </div>
          <div className="p-3 rounded border border-[var(--panel-border-subtle)] bg-[var(--panel-elevated)] space-y-1">
            <div className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider font-mono">Role</div>
            <div className="text-[var(--color-foreground)] font-mono">
              {orgRole || "member"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
