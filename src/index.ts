#!/usr/bin/env bun
import { check } from "./check.js";

function printUsage(): void {
  console.log(`
mcp-health — npm audit for MCP servers

Usage:
  mcp-health check <package>   Check health of an MCP server

Options:
  --json   Output as JSON

Examples:
  mcp-health check @modelcontextprotocol/server-github
  mcp-health check @scope/server --json
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const jsonMode = args.includes("--json");

  if (command === "check") {
    const packageName = args.find((a) => !a.startsWith("-") && a !== "check");
    if (!packageName) {
      console.error("Error: Package name required");
      console.error("Usage: mcp-health check <package>");
      process.exit(1);
    }
    await check(packageName, jsonMode);
  } else if (command === "audit") {
    console.error("Error: 'audit' command not implemented in v0.1");
    process.exit(1);
  } else if (command === "badge") {
    console.error("Error: 'badge' command not implemented in v0.1");
    process.exit(1);
  } else {
    console.error(`Error: Unknown command '${command}'`);
    printUsage();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
