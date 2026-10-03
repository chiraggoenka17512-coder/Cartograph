import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function WorkspacePage() {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 font-mono">
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            Server Rendered Organization Claim
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            SSR Paint
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-zinc-500 text-[11px] mb-1">Active Organization</div>
            <div className="text-zinc-200 font-semibold" data-testid="ssr-org-slug">
              {orgSlug || orgId || "No active organization"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px] mb-1">Organization ID</div>
            <div className="text-zinc-400 text-[11px] truncate" data-testid="ssr-org-id">
              {orgId || "unassigned"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px] mb-1">User Identity</div>
            <div className="text-zinc-200 truncate">
              {user?.primaryEmailAddress?.emailAddress || userId}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px] mb-1">Organization Role</div>
            <div className="text-zinc-300">
              {orgRole || "member"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
