import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    ...options,
  }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync("package.json")) {
  fail("package.json not found");
}

const bump = process.argv[2] ?? "patch";
const allowedBumps = new Set(["patch", "minor", "major"]);

if (!allowedBumps.has(bump) && !/^\d+\.\d+\.\d+$/.test(bump)) {
  fail("Usage: bun run release [patch|minor|major|x.y.z]");
}

const status = capture("git", ["status", "--porcelain"]);
if (status) {
  fail("Working tree must be clean before release");
}

try {
  capture("gh", ["auth", "status"]);
} catch {
  fail("GitHub CLI is not authenticated. Run: gh auth login");
}

const branch = capture("git", ["branch", "--show-current"]);
if (!branch) {
  fail("Could not determine current branch");
}

run("npm", ["version", bump, "--no-git-tag-version"]);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;
const tag = `v${version}`;

run("git", ["add", "package.json"]);
run("git", ["commit", "-m", `release: ${tag}`]);
run("git", ["tag", tag]);
run("git", ["push", "origin", branch]);
run("git", ["push", "origin", tag]);
run("gh", ["release", "create", tag, "--generate-notes", "--title", tag]);
