import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { calculateScore } from "./score.js";
import type { GitHubData, IssueStats } from "./sources/github.js";
import type { NpmData } from "./sources/npm.js";

const github: GitHubData = {
  stars: 250,
  lastCommitDays: 5,
  openIssues: 40,
  totalIssues: 200,
  hasLicense: true,
  licenseName: "MIT",
  hasSecurityMd: true,
};

const npm: NpmData = {
  weeklyDownloads: 5000,
  deprecated: false,
  repository: "owner/repo",
  version: "1.0.0",
};

describe("calculateScore", () => {
  test("does not reward missing npm or issue data", () => {
    const result = calculateScore(null, null, [], null);

    assert.equal(result.score, 0);
    assert.equal(result.status, "risky");
    assert.equal(result.signals.weekly_downloads, null);
    assert.equal(result.signals.deprecated, null);
    assert.equal(result.signals.open_issues, null);
  });

  test("uses fetched issue stats in the score", () => {
    const badIssueStats: IssueStats = {
      open: 325,
      closed: 576,
      known: true,
    };

    const result = calculateScore(github, npm, [], badIssueStats);

    assert.equal(result.score, 80);
    assert.equal(result.status, "healthy");
  });

  test("rewards healthy issue ratio when stats are available", () => {
    const goodIssueStats: IssueStats = {
      open: 10,
      closed: 200,
      known: true,
    };

    const result = calculateScore(github, npm, [], goodIssueStats);

    assert.equal(result.score, 90);
    assert.equal(result.status, "healthy");
  });
});
