import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AnalysisStatus =
  | "queued"
  | "pending"
  | "fetching"
  | "parsing"
  | "indexing"
  | "complete"
  | "completed"
  | "failed"
  | "stale";

export interface AnalysisRecord {
  id: string;
  organization_id: string;
  project_id: string | null;
  repository_url: string;
  commit_hash: string | null;
  status: AnalysisStatus;
  stage: string | null;
  error_message: string | null;
  coverage_ratio: number | null;
  files_count: number;
  edges_count: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Retrieves the analyses for the dashboard.
 *
 * NOTE: Per GEMINI.md and Phase 2 spec:
 * - Database access happens in server code, not inside components.
 * - Authorization is a property of the database, not application code.
 * - If a query needs a WHERE clause to return the right rows, the policy is wrong.
 * Therefore, no WHERE clause filters by organization here — the Supabase RLS policy
 * reads the organization claim directly off the token header.
 */
export async function getDashboardAnalyses(): Promise<AnalysisRecord[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, organization_id, project_id, repository_url, commit_hash, status, stage, error_message, coverage_ratio, files_count, edges_count, started_at, finished_at, created_at, updated_at"
    )
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Database query error in getDashboardAnalyses:", error);
    throw new Error(`Failed to load analyses: ${error.message}`);
  }

  return (data as AnalysisRecord[]) || [];
}
