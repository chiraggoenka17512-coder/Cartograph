import React from "react";
import { AnalysisRecord } from "@/lib/db/analyses";

interface AnalysesListProps {
  analyses: AnalysisRecord[];
  activeOrgDisplay?: string;
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return "just now";
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours <= 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

function formatRepoDisplay(url: string): string {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\//, "");
    }
    return url;
  } catch {
    return url;
  }
}

function StateIndicator({ status }: { status: string }) {
  if (status === "complete" || status === "completed") {
    return <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0" />;
  }
  if (status === "parsing") {
    return <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-2 flex-shrink-0" />;
  }
  if (status === "queued" || status === "pending") {
    return <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/80 mr-2 flex-shrink-0" />;
  }
  if (status === "failed") {
    return <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 flex-shrink-0" />;
  }
  return null;
}

export function AnalysesList({ analyses, activeOrgDisplay }: AnalysesListProps) {
  const teamHeading = activeOrgDisplay ? (
    activeOrgDisplay.toLowerCase().includes("team") || activeOrgDisplay.toLowerCase().includes("organization")
      ? activeOrgDisplay
      : `${activeOrgDisplay}'s team`
  ) : "Team";

  if (analyses.length === 0) {
    return (
      <div className="space-y-4 font-sans">
        <div className="flex items-baseline gap-3 text-sm">
          <span className="font-semibold text-[var(--color-foreground)]">{teamHeading}</span>
          <span className="text-xs text-[var(--color-muted)]">0 analyses</span>
        </div>

        <div
          data-testid="analyses-empty-state"
          className="border border-[var(--panel-border)] bg-[var(--panel)] rounded-lg p-10 text-center space-y-3 shadow-xs"
        >
          <div className="w-8 h-8 rounded-full border border-[var(--panel-border)] bg-[var(--panel-elevated)] flex items-center justify-center mx-auto text-[var(--color-muted)] text-xs font-mono">
            ∅
          </div>
          <div className="text-xs font-semibold text-[var(--color-foreground)]">
            No analyses for this team
          </div>
          <p className="text-[12px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
            This team has never run an analysis. When a repository is analysed, its state, commit, and runtime will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="analyses-dashboard" className="space-y-4 font-sans">
      {/* Header matching exact reference: Team Name + count */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-base font-semibold text-[var(--color-foreground)] tracking-tight">
          {teamHeading}
        </h2>
        <span className="text-xs text-[var(--color-muted)] font-normal">
          {analyses.length} {analyses.length === 1 ? "analysis" : "analyses"}
        </span>
      </div>

      {/* Table matching exact layout and screenshot typography */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--panel-border)] bg-[var(--panel-elevated)]/30 text-[var(--color-muted)] text-[12px] font-normal">
                <th className="py-3 px-4 font-normal w-[36%]">Repository</th>
                <th className="py-3 px-4 font-normal w-[26%]">State</th>
                <th className="py-3 px-4 font-normal w-[14%]">Commit</th>
                <th className="py-3 px-4 font-normal w-[12%]">Started</th>
                <th className="py-3 px-4 font-normal w-[12%]">Finished</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]/70">
              {analyses.map((analysis) => {
                const repoText = formatRepoDisplay(analysis.repository_url);
                const commitText = analysis.commit_hash
                  ? analysis.commit_hash.slice(0, 7)
                  : "—";
                const startedText = formatTimeAgo(analysis.started_at || analysis.created_at);
                const finishedText = formatTimeAgo(analysis.finished_at);
                const isFailed = analysis.status === "failed";
                const stateLabel = analysis.status === "completed" ? "complete" : analysis.status;

                return (
                  <tr
                    key={analysis.id}
                    data-testid="analysis-item"
                    className="hover:bg-[var(--panel-elevated)]/50 transition-colors"
                  >
                    {/* Repository in Geist Mono */}
                    <td className="py-3.5 px-4 text-[var(--color-foreground)] font-mono text-xs whitespace-nowrap font-medium">
                      {repoText}
                    </td>

                    {/* State in Geist Sans */}
                    <td className="py-3.5 px-4 font-sans text-xs" data-testid="analysis-status">
                      <div className="flex items-center">
                        <StateIndicator status={analysis.status} />
                        <span className={isFailed ? "text-[var(--color-foreground)] font-semibold" : "text-[var(--color-muted-foreground)]"}>
                          {stateLabel}
                        </span>
                      </div>
                      {analysis.error_message && (
                        <div className="text-[11px] text-[var(--color-muted)] mt-1 font-sans leading-normal pl-3.5">
                          {analysis.error_message}
                        </div>
                      )}
                    </td>

                    {/* Commit hash in Geist Mono, dash in regular text */}
                    <td className="py-3.5 px-4 text-xs font-mono">
                      <span className={commitText === "—" ? "text-[var(--color-muted)] font-sans" : "text-[var(--color-muted-foreground)]"}>
                        {commitText}
                      </span>
                    </td>

                    {/* Started timestamp in Geist Sans */}
                    <td className="py-3.5 px-4 text-[var(--color-muted)] text-xs font-sans whitespace-nowrap">
                      {startedText}
                    </td>

                    {/* Finished timestamp in Geist Sans */}
                    <td className="py-3.5 px-4 text-[var(--color-muted)] text-xs font-sans whitespace-nowrap">
                      <span>{finishedText}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
