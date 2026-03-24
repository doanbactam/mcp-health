import type { GitHubData } from "./sources/github.js";
import type { NpmData } from "./sources/npm.js";
import type { CVE } from "./sources/osv.js";

export interface Signals {
  last_commit_days: number | null;
  weekly_downloads: number;
  cves: CVE[];
  open_issues: number;
  closed_issues: number;
  license: string | null;
  has_security_md: boolean;
  deprecated: boolean;
  stars: number;
}

export interface ScoreResult {
  score: number;
  status: "healthy" | "caution" | "risky";
  signals: Signals;
}

export function calculateScore(
  github: GitHubData | null,
  npm: NpmData | null,
  cves: CVE[]
): ScoreResult {
  const signals: Signals = {
    last_commit_days: github?.lastCommitDays ?? null,
    weekly_downloads: npm?.weeklyDownloads ?? 0,
    cves,
    open_issues: github?.openIssues ?? 0,
    closed_issues: 0, // Will be updated if we have issue stats
    license: github?.licenseName ?? null,
    has_security_md: github?.hasSecurityMd ?? false,
    deprecated: npm?.deprecated ?? false,
    stars: github?.stars ?? 0,
  };

  let score = 0;

  // Last commit < 30 days: +20pts
  if (signals.last_commit_days !== null && signals.last_commit_days < 30) {
    score += 20;
  }

  // Has open CVEs: -30pts each
  const cvePenalty = signals.cves.length * 30;
  score -= cvePenalty;

  // npm downloads > 1k/week: +15pts
  if (signals.weekly_downloads > 1000) {
    score += 15;
  }

  // Open issues ratio < 20%: +10pts (need both open and closed)
  // Note: We approximate this since we don't always have closed issue count
  if (signals.open_issues > 0) {
    // If we don't have closed issues, estimate based on repo activity
    const totalIssues = signals.open_issues + signals.closed_issues;
    if (totalIssues > 0) {
      const openRatio = signals.open_issues / totalIssues;
      if (openRatio < 0.2) {
        score += 10;
      }
    } else if (signals.last_commit_days !== null && signals.last_commit_days < 30) {
      // Active repo with few issues = likely low issue ratio
      if (signals.open_issues < 10) {
        score += 10;
      }
    }
  } else {
    // No open issues is good
    score += 10;
  }

  // Has LICENSE file: +10pts
  if (signals.license) {
    score += 10;
  }

  // Has SECURITY.md: +10pts
  if (signals.has_security_md) {
    score += 10;
  }

  // Not deprecated: +15pts
  if (!signals.deprecated) {
    score += 15;
  }

  // Stars > 100: +10pts
  if (signals.stars > 100) {
    score += 10;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: "healthy" | "caution" | "risky";
  if (score >= 80) {
    status = "healthy";
  } else if (score >= 50) {
    status = "caution";
  } else {
    status = "risky";
  }

  return { score, status, signals };
}

export function updateSignalsWithIssueStats(
  signals: Signals,
  open: number,
  closed: number
): void {
  signals.open_issues = open;
  signals.closed_issues = closed;
}
