export interface NpmData {
  weeklyDownloads: number;
  deprecated: boolean;
  repository?: string;
  version: string;
  error?: string;
}

export async function fetchNpmData(packageName: string): Promise<NpmData> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          weeklyDownloads: 0,
          deprecated: false,
          version: "",
          error: "Package not found on npm",
        };
      }
      return {
        weeklyDownloads: 0,
        deprecated: false,
        version: "",
        error: `npm registry error: ${res.status}`,
      };
    }

    const data = await res.json();

    // Get latest version info
    const latestVersion = data["dist-tags"]?.latest;
    const latest = latestVersion ? data.versions?.[latestVersion] : null;

    // Check if deprecated
    const deprecated = latest?.deprecated !== undefined && latest.deprecated !== false;

    // Get repository URL
    const repoUrl = data.repository?.url || data.repository;

    // Get downloads from npm downloads API
    let weeklyDownloads = 0;
    try {
      const downloadsRes = await fetch(
        `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`
      );
      if (downloadsRes.ok) {
        const downloadsData = await downloadsRes.json();
        weeklyDownloads = downloadsData.downloads || 0;
      }
    } catch {
      // Downloads API failed, keep 0
    }

    return {
      weeklyDownloads,
      deprecated,
      repository: extractGitHubRepo(repoUrl),
      version: latestVersion || "",
    };
  } catch (err) {
    return {
      weeklyDownloads: 0,
      deprecated: false,
      version: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function extractGitHubRepo(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // Handle various GitHub URL formats
  // git+https://github.com/owner/repo.git
  // https://github.com/owner/repo
  // github:owner/repo
  // owner/repo

  const match = url.match(
    /(?:github\.com[/:]|^github:|^)?([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/
  );
  if (match) {
    let repo = match[1];
    // Remove .git suffix
    repo = repo.replace(/\.git$/, "");
    return repo;
  }
  return undefined;
}
