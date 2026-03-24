import type { GitHubData } from "./sources/github.js";
import type { IssueStats } from "./sources/github.js";
import type { NpmData } from "./sources/npm.js";
import type { CVE } from "./sources/osv.js";

export interface Signals {
  last_commit_days: number | null;
  weekly_downloads: number | null;
  cves: CVE[];
  open_issues: number | null;
  closed_issues: number | null;
  license: string | null;
  has_security_md: boolean | null;
  deprecated: boolean | null;
  stars: number | null;
}

export interface ScoreResult {
  score: number;
  status: "healthy" | "caution" | "risky";
  signals: Signals;
}

export function calculateScore(
  github: GitHubData | null,
  npm: NpmData | null,
  cves: CVE[],
  issueStats: IssueStats | null
): ScoreResult {
  const signals: Signals = {
    last_commit_days: github?.lastCommitDays ?? null,
    weekly_downloads: npm?.weeklyDownloads ?? null,
    cves,
    open_issues: issueStats?.open ?? null,
    closed_issues: issueStats?.closed ?? null,
    license: github?.licenseName ?? null,
    has_security_md: github?.hasSecurityMd ?? null,
    deprecated: npm?.deprecated ?? null,
    stars: github?.stars ?? null,
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
  if (signals.weekly_downloads !== null && signals.weekly_downloads > 1000) {
    score += 15;
  }

  // Open issues ratio < 20%: +10pts (need both open and closed)
  if (signals.open_issues !== null && signals.closed_issues !== null) {
    const totalIssues = signals.open_issues + signals.closed_issues;
    if (totalIssues > 0) {
      const openRatio = signals.open_issues / totalIssues;
      if (openRatio < 0.2) {
        score += 10;
      }
    } else {
      score += 10;
    }
  }

  // Has LICENSE file: +10pts
  if (signals.license) {
    score += 10;
  }

  // Has SECURITY.md: +10pts
  if (signals.has_security_md === true) {
    score += 10;
  }

  // Not deprecated: +15pts
  if (signals.deprecated === false) {
    score += 15;
  }

  // Stars > 100: +10pts
  if (signals.stars !== null && signals.stars > 100) {
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
