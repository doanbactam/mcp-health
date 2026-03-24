import pc from "picocolors";
import type { ScoreResult } from "../score.js";

export function formatTerminal(packageName: string, result: ScoreResult): string {
  const { score, status, signals } = result;
  const lines: string[] = [];

  // Header
  lines.push(pc.bold(pc.cyan(`  ${packageName}`)));
  lines.push(pc.gray("  " + "─".repeat(36)));

  // Score line
  const statusColor =
    status === "healthy" ? pc.green : status === "caution" ? pc.yellow : pc.red;
  const statusIcon =
    status === "healthy" ? "●" : status === "caution" ? "●" : "●";
  const statusText =
    status === "healthy" ? "healthy" : status === "caution" ? "caution" : "risky";

  lines.push(
    `  ${pc.bold("Score")}       ${pc.bold(String(score))}${pc.gray("/100")}  ${statusColor(statusIcon + " " + statusText)}`
  );

  // Last commit
  if (signals.last_commit_days !== null) {
    const commitText = formatDaysAgo(signals.last_commit_days);
    lines.push(`  ${pc.bold("Last commit")} ${commitText}`);
  } else {
    lines.push(`  ${pc.bold("Last commit")} ${pc.gray("unknown")}`);
  }

  // Downloads
  const downloadsFormatted = formatNumber(signals.weekly_downloads);
  lines.push(`  ${pc.bold("Downloads")}   ${downloadsFormatted}${pc.gray("/week")}`);

  // CVEs
  if (signals.cves.length === 0) {
    lines.push(`  ${pc.bold("CVEs")}        ${pc.green("none found")}`);
  } else {
    const cveList = signals.cves.map((c) => pc.red(c.id)).join(", ");
    lines.push(`  ${pc.bold("CVEs")}        ${cveList}`);
  }

  // Issues
  const totalIssues = signals.open_issues + signals.closed_issues;
  if (totalIssues > 0) {
    const ratio = ((signals.open_issues / totalIssues) * 100).toFixed(0);
    lines.push(
      `  ${pc.bold("Issues")}      ${signals.open_issues} open / ${signals.closed_issues} closed (${ratio}%)`
    );
  } else {
    lines.push(`  ${pc.bold("Issues")}      ${pc.gray("no data")}`);
  }

  // License
  if (signals.license) {
    lines.push(`  ${pc.bold("License")}     ${pc.green(signals.license)}`);
  } else {
    lines.push(`  ${pc.bold("License")}     ${pc.gray("none")}`);
  }

  // Security.md
  if (signals.has_security_md) {
    lines.push(`  ${pc.bold("Security")}    ${pc.green("SECURITY.md ✓")}`);
  }

  // Deprecated warning
  if (signals.deprecated) {
    lines.push(`  ${pc.bold("Warning")}     ${pc.red("DEPRECATED")}`);
  }

  // Stars
  lines.push(`  ${pc.bold("Stars")}       ${formatNumber(signals.stars)}`);

  // Footer
  lines.push("");
  if (status === "healthy") {
    lines.push(`  ${pc.green("✓")} safe to install`);
  } else if (status === "caution") {
    lines.push(`  ${pc.yellow("!")} use with caution`);
  } else {
    lines.push(`  ${pc.red("✗")} not recommended`);
  }

  return lines.join("\n");
}

function formatDaysAgo(days: number): string {
  if (days === 0) return pc.green("today");
  if (days === 1) return pc.green("1 day ago");
  if (days < 7) return pc.green(`${days} days ago`);
  if (days < 30) return pc.yellow(`${Math.floor(days / 7)} weeks ago`);
  if (days < 365) return pc.yellow(`${Math.floor(days / 30)} months ago`);
  return pc.red(`${Math.floor(days / 365)} years ago`);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return String(num);
}
