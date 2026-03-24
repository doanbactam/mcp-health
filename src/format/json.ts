import type { ScoreResult } from "../score.js";

export interface JsonResult {
  name: string;
  score: number;
  status: "healthy" | "caution" | "risky";
  signals: {
    last_commit_days: number | null;
    weekly_downloads: number | null;
    cves: { id: string; summary?: string; severity?: string }[];
    open_issues: number | null;
    total_issues: number | null;
    license: string | null;
    has_security_md: boolean | null;
    deprecated: boolean | null;
    stars: number | null;
  };
}

export function formatJson(packageName: string, result: ScoreResult): string {
  const json: JsonResult = {
    name: packageName,
    score: result.score,
    status: result.status,
    signals: {
      last_commit_days: result.signals.last_commit_days,
      weekly_downloads: result.signals.weekly_downloads,
      cves: result.signals.cves.map((c) => ({
        id: c.id,
        summary: c.summary,
        severity: c.severity,
      })),
      open_issues: result.signals.open_issues,
      total_issues:
        result.signals.open_issues !== null && result.signals.closed_issues !== null
          ? result.signals.open_issues + result.signals.closed_issues
          : null,
      license: result.signals.license,
      has_security_md: result.signals.has_security_md,
      deprecated: result.signals.deprecated,
      stars: result.signals.stars,
    },
  };

  return JSON.stringify(json, null, 2);
}
