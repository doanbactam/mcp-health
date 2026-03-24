export interface GitHubData {
  stars: number;
  lastCommitDays: number | null;
  openIssues: number;
  totalIssues: number;
  hasLicense: boolean;
  licenseName: string | null;
  hasSecurityMd: boolean;
  error?: string;
}

export async function fetchGitHubData(repo: string): Promise<GitHubData> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return {
      stars: 0,
      lastCommitDays: null,
      openIssues: 0,
      totalIssues: 0,
      hasLicense: false,
      licenseName: null,
      hasSecurityMd: false,
      error: "Invalid repo format",
    };
  }

  try {
    // Fetch repo data
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "mcp-health/0.1.0",
      },
    });

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return {
          stars: 0,
          lastCommitDays: null,
          openIssues: 0,
          totalIssues: 0,
          hasLicense: false,
          licenseName: null,
          hasSecurityMd: false,
          error: "Repository not found",
        };
      }
      if (repoRes.status === 403) {
        return {
          stars: 0,
          lastCommitDays: null,
          openIssues: 0,
          totalIssues: 0,
          hasLicense: false,
          licenseName: null,
          hasSecurityMd: false,
          error: "GitHub API rate limit exceeded",
        };
      }
      return {
        stars: 0,
        lastCommitDays: null,
        openIssues: 0,
        totalIssues: 0,
        hasLicense: false,
        licenseName: null,
        hasSecurityMd: false,
        error: `GitHub API error: ${repoRes.status}`,
      };
    }

    const repoData = await repoRes.json();

    // Calculate days since last commit
    let lastCommitDays: number | null = null;
    if (repoData.pushed_at) {
      const lastPush = new Date(repoData.pushed_at);
      const now = new Date();
      lastCommitDays = Math.floor((now.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Check for LICENSE file
    let hasLicense = false;
    let licenseName: string | null = null;
    if (repoData.license) {
      hasLicense = true;
      licenseName = repoData.license.spdx_id || repoData.license.name;
    }

    // Check for SECURITY.md
    let hasSecurityMd = false;
    try {
      const securityRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/contents/SECURITY.md`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "mcp-health/0.1.0",
          },
        }
      );
      hasSecurityMd = securityRes.ok;
    } catch {
      hasSecurityMd = false;
    }

    return {
      stars: repoData.stargazers_count || 0,
      lastCommitDays,
      openIssues: repoData.open_issues_count || 0,
      totalIssues: (repoData.open_issues_count || 0), // We'll estimate closed issues
      hasLicense,
      licenseName,
      hasSecurityMd,
    };
  } catch (err) {
    return {
      stars: 0,
      lastCommitDays: null,
      openIssues: 0,
      totalIssues: 0,
      hasLicense: false,
      licenseName: null,
      hasSecurityMd: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Fetch additional issue stats
export async function fetchIssueStats(repo: string): Promise<{ open: number; closed: number }> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) return { open: 0, closed: 0 };

  try {
    // Get open issues count
    const openRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+type:issue+state:open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "mcp-health/0.1.0",
        },
      }
    );

    // Get closed issues count
    const closedRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+type:issue+state:closed&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "mcp-health/0.1.0",
        },
      }
    );

    const openData = openRes.ok ? await openRes.json() : { total_count: 0 };
    const closedData = closedRes.ok ? await closedRes.json() : { total_count: 0 };

    return {
      open: openData.total_count || 0,
      closed: closedData.total_count || 0,
    };
  } catch {
    return { open: 0, closed: 0 };
  }
}
