import { fetchNpmData } from "./sources/npm.js";
import { fetchGitHubData, fetchIssueStats } from "./sources/github.js";
import { fetchOSVData } from "./sources/osv.js";
import { calculateScore, updateSignalsWithIssueStats } from "./score.js";
import { formatTerminal } from "./format/terminal.js";
import { formatJson } from "./format/json.js";

export async function check(packageName: string, jsonMode: boolean): Promise<void> {
  // Fetch npm data first to get repository URL
  const npmData = await fetchNpmData(packageName);

  // Determine GitHub repo
  let githubRepo = npmData.repository;

  // If no repo from npm, try to guess from package name
  if (!githubRepo) {
    // Some common patterns
    if (packageName.startsWith("@modelcontextprotocol/")) {
      const name = packageName.replace("@modelcontextprotocol/", "");
      githubRepo = `modelcontextprotocol/servers`;
    }
  }

  // Fetch all data in parallel
  const [githubData, issueStats, osvData] = await Promise.all([
    githubRepo ? fetchGitHubData(githubRepo) : null,
    githubRepo ? fetchIssueStats(githubRepo) : { open: 0, closed: 0 },
    fetchOSVData(packageName, npmData.version),
  ]);

  // Calculate score
  const result = calculateScore(githubData, npmData, osvData.cves);

  // Update with actual issue stats if available
  if (issueStats.open > 0 || issueStats.closed > 0) {
    updateSignalsWithIssueStats(result.signals, issueStats.open, issueStats.closed);
  }

  // Output
  if (jsonMode) {
    console.log(formatJson(packageName, result));
  } else {
    console.log(formatTerminal(packageName, result));
  }

  // Handle errors (output to stderr for JSON mode)
  const errors = [npmData.error, githubData?.error, osvData.error].filter(Boolean);
  if (errors.length > 0 && !jsonMode) {
    console.error("\nWarnings:");
    errors.forEach((e) => console.error(`  - ${e}`));
  }
}
