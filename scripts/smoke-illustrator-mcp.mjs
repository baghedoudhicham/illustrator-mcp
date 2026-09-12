#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_URL = "http://localhost:18412/v1/mcp";
const ENV_FILE = resolve(process.cwd(), ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};

  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }
  return values;
}

function parseArgs(argv) {
  const args = { inspect: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--inspect") args.inspect = true;
    else if (value === "--help" || value === "-h") args.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/smoke-illustrator-mcp.mjs [--inspect]

Reads ADOBE_ILLUSTRATOR_MCP_URL and ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN
from the environment or .env.local, then performs a read-only MCP
initialize + tools/list check. --inspect calls a tool only when the bridge
advertises the exact read-only name illustrator_inspect_document.

The bearer token is never printed or written to a result file.`);
}

function readConfig() {
  const fileValues = loadEnvFile(process.env.ILLUSTRATOR_MCP_ENV_FILE || ENV_FILE);
  const url = process.env.ADOBE_ILLUSTRATOR_MCP_URL || fileValues.ADOBE_ILLUSTRATOR_MCP_URL || DEFAULT_URL;
  const token = process.env.ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN || fileValues.ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN;

  if (!token || token === "replace_me") {
    throw new Error(
      "Missing ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN. Regenerate a local token in Illustrator Beta > MCP & Tools, then place it in .env.local or the process environment."
    );
  }
  return { url, token };
}

function responsePayload(response, text) {
  if (!text.trim()) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const data = text
      .split(/\r?\n/)
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trim())
      .filter(Boolean)
      .at(-1);
    return data ? JSON.parse(data) : null;
  }
  return JSON.parse(text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const { url, token } = readConfig();
  let sessionId;
  let protocolVersion = "2025-03-26";
  let requestId = 0;

  async function rpc(method, params, id = ++requestId) {
    const headers = {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "MCP-Protocol-Version": protocolVersion
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;

    const request = { jsonrpc: "2.0", method, params };
    if (id !== null) request.id = id;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request)
    });
    sessionId ||= response.headers.get("Mcp-Session-Id");
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`MCP ${method} failed with HTTP ${response.status}: ${text.slice(0, 240)}`);
    }
    return responsePayload(response, text);
  }

  const initialized = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "illustrator-mcp-smoke", version: "0.1.0" }
  });
  protocolVersion = initialized?.result?.protocolVersion || protocolVersion;
  await rpc("notifications/initialized", {}, null);
  const toolResult = await rpc("tools/list", {});
  const tools = toolResult?.result?.tools || [];

  console.log(`MCP reachable: ${url}`);
  console.log(`Protocol: ${initialized?.result?.protocolVersion || "unknown"}`);
  console.log(`Server: ${initialized?.result?.serverInfo?.name || "unknown"}`);
  console.log(`Tools advertised: ${tools.length}`);
  for (const tool of tools) console.log(`- ${tool.name}`);

  if (!args.inspect) return;
  const inspectTool = tools.find(tool => tool.name === "illustrator_inspect_document");
  if (!inspectTool) {
    console.log("Read-only inspect skipped: illustrator_inspect_document is not advertised by this bridge.");
    return;
  }
  const inspectResult = await rpc("tools/call", {
    name: inspectTool.name,
    arguments: {}
  });
  console.log(JSON.stringify(inspectResult?.result ?? inspectResult, null, 2));
}

main().catch(error => {
  console.error(`Illustrator MCP smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
