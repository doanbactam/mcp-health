export interface CVE {
  id: string;
  summary?: string;
  severity?: string;
}

export interface OSVData {
  cves: CVE[];
  error?: string;
}

export async function fetchOSVData(packageName: string, version?: string): Promise<OSVData> {
  try {
    const res = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        package: {
          name: packageName,
          ecosystem: "npm",
        },
        version: version || undefined,
      }),
    });

    if (!res.ok) {
      return {
        cves: [],
        error: `OSV API error: ${res.status}`,
      };
    }

    const data = await res.json();

    if (!data.vulns || data.vulns.length === 0) {
      return { cves: [] };
    }

    const cves: CVE[] = data.vulns.map((vuln: any) => ({
      id: vuln.id,
      summary: vuln.summary,
      severity: getSeverity(vuln),
    }));

    return { cves };
  } catch (err) {
    return {
      cves: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function getSeverity(vuln: any): string | undefined {
  // Try to get severity from different fields
  if (vuln.severity) {
    for (const sev of vuln.severity) {
      if (sev.type === "CVSS_V3" && sev.score) {
        return sev.score;
      }
    }
  }

  // Check database_specific for severity
  if (vuln.database_specific?.severity) {
    return vuln.database_specific.severity;
  }

  return undefined;
}
