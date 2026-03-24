import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { extractGitHubRepo } from "./npm.js";

describe("extractGitHubRepo", () => {
  test("accepts supported GitHub formats", () => {
    assert.equal(extractGitHubRepo("git+https://github.com/owner/repo.git"), "owner/repo");
    assert.equal(extractGitHubRepo("https://github.com/owner/repo"), "owner/repo");
    assert.equal(extractGitHubRepo("github:owner/repo"), "owner/repo");
    assert.equal(extractGitHubRepo("owner/repo"), "owner/repo");
  });

  test("rejects non-GitHub hosts", () => {
    assert.equal(extractGitHubRepo("https://gitlab.com/owner/repo"), undefined);
    assert.equal(extractGitHubRepo("https://example.com/owner/repo"), undefined);
  });
});
