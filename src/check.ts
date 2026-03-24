import { fetchNpmData } from "./sources/npm.js";
import { fetchGitHubData, fetchIssueStats } from "./sources/github.js";
import { fetchOSVData } from "./sources/osv.js";
import { calculateScore } from "./score.js";
import { formatTerminal } from "./format/terminal.js";
import { formatJson } from "./format/json.js";

export async function check(packageName: string, jsonMode: boolean): Promise<void> {
  // Fetch npm data first to get repository URL
  const npmData = await fetchNpmData(packageName);

  // Determine GitHub repo
  let githubRepo = npmData.repository;

  // If no repo from npm, try to guess from package name
  if (!githubRepo) {
    if (packageName.startsWith("@modelcontextprotocol/")) {
      githubRepo = `modelcontextprotocol/servers`;
    }
  }

  // Fetch all data in parallel
  const [githubData, issueStats, osvData] = await Promise.all([
    githubRepo ? fetchGitHubData(githubRepo) : null,
    githubRepo
      ? fetchIssueStats(githubRepo)
      : Promise.resolve({ open: 0, closed: 0, known: false, error: undefined }),
    fetchOSVData(packageName, npmData.version),
  ]);

  // Calculate score
  const result = calculateScore(
    githubData?.error ? null : githubData,
    npmData.error ? null : npmData,
    osvData.cves,
    issueStats.known ? issueStats : null
  );

  // Output
  if (jsonMode) {
    console.log(formatJson(packageName, result));
  } else {
    console.log(formatTerminal(packageName, result));
  }

  // Handle errors (output to stderr for JSON mode)
  const errors = [npmData.error, githubData?.error, issueStats.error, osvData.error].filter(Boolean);
  if (errors.length > 0 && !jsonMode) {
    console.error("\nWarnings:");
    errors.forEach((e) => console.error(`  - ${e}`));
  }
}
