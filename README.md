# mcp-health

> npm audit for MCP servers. One command. Know if an MCP server is safe to install.

## Install

```bash
bun install -g mcp-health
```

## npm

https://www.npmjs.com/package/mcp-health

GitHub Releases can publish straight to npm via `.github/workflows/release.yml`.
To enable it, add an `NPM_TOKEN` repository secret with publish rights.

## Release

```bash
# bump patch version, commit, tag, push, create GitHub Release
bun run release

# or choose the version bump explicitly
bun run release minor
bun run release major
bun run release 0.2.0
```

The release script requires:
- a clean git working tree
- `gh auth login`

After the GitHub Release is created, the Actions workflow publishes the same version to npm.

## Usage

```bash
# Check a server
mcp-health check @modelcontextprotocol/server-filesystem

# Output JSON for CI
mcp-health check @scope/server --json
```

## Example Output

```
  @modelcontextprotocol/server-filesystem
  ────────────────────────────────────
  Score       80/100  ● healthy
  Last commit 6 days ago
  Downloads   339.5k/week
  CVEs        none found
  Issues      325 open / 576 closed (36%)
  License     MIT
  Security    SECURITY.md ✓
  Stars       81.9k

  ✓ safe to install
```

## Score Formula (0-100)

| Signal | Weight |
|--------|--------|
| Last commit < 30 days | +20 |
| CVEs found | -30 each |
| Downloads > 1k/week | +15 |
| Open issues ratio < 20% | +10 |
| Has LICENSE | +10 |
| Has SECURITY.md | +10 |
| Not deprecated | +15 |
| Stars > 100 | +10 |

**Status thresholds:**
- 80-100: healthy (green)
- 50-79: caution (yellow)
- 0-49: risky (red)

## License

MIT
