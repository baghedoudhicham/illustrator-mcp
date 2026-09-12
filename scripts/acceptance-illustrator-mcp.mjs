#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_URL = "http://localhost:18412/v1/mcp";
const ENV_FILE = resolve(process.cwd(), ".env.local");
const FIXTURE_DOCUMENT = "mcp-acceptance-text";

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

function readConfig() {
  const fileValues = loadEnvFile(process.env.ILLUSTRATOR_MCP_ENV_FILE || ENV_FILE);
  const url = process.env.ADOBE_ILLUSTRATOR_MCP_URL || fileValues.ADOBE_ILLUSTRATOR_MCP_URL || DEFAULT_URL;
  const token = process.env.ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN || fileValues.ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN;

  if (!token || token === "replace_me") {
    throw new Error(
      "Missing ADOBE_ILLUSTRATOR_MCP_BEARER_TOKEN. Put a freshly regenerated local token in .env.local or the process environment."
    );
  }
  return { url, token };
}

function parseResponsePayload(response, text) {
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

function parseToolResult(envelope, toolName) {
  if (envelope?.error) {
    throw new Error(`${toolName} returned JSON-RPC error: ${envelope.error.message || "unknown error"}`);
  }

  const result = envelope?.result ?? envelope;
  if (result?.isError) {
    const message = result.content?.find(item => item.type === "text")?.text || "tool reported an error";
    throw new Error(`${toolName} reported an error: ${message.slice(0, 500)}`);
  }

  const text = result?.content?.find(item => item.type === "text")?.text;
  if (!text) return { raw: result, data: result };
  try {
    return { raw: result, data: JSON.parse(text) };
  } catch {
    return { raw: result, data: text };
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function findByType(root, type) {
  const found = [];
  const visit = value => {
    if (!value || typeof value !== "object") return;
    if (value.object_type === type || value.type === type) found.push(value);
    for (const child of asArray(value.children)) visit(child);
    for (const child of asArray(value.objects)) visit(child);
    for (const child of asArray(value.objects_basic_details)) visit(child);
    for (const child of asArray(value.structures)) visit(child);
  };
  visit(root);
  return found;
}

function findLayer(layers, name) {
  return asArray(layers).find(layer => layer?.name === name || layer?.layer_name === name);
}

async function main() {
  const { url, token } = readConfig();
  let sessionId;
  let protocolVersion = "2025-03-26";
  let requestId = 0;

  async function rpc(method, params, { retry = false } = {}) {
    const request = { jsonrpc: "2.0", method, params };
    if (method !== "notifications/initialized") request.id = ++requestId;

    let attempt = 0;
    while (true) {
      const headers = {
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "MCP-Protocol-Version": protocolVersion
      };
      if (sessionId) headers["Mcp-Session-Id"] = sessionId;

      try {
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
        return parseResponsePayload(response, text);
      } catch (error) {
        const canRetry = retry && attempt < 2 && error instanceof TypeError;
        if (!canRetry) throw error;
        attempt += 1;
        await new Promise(resolveDelay => setTimeout(resolveDelay, 700 * attempt));
      }
    }
  }

  const initializedEnvelope = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "illustrator-mcp-acceptance", version: "0.1.0" }
  }, { retry: true });
  protocolVersion = initializedEnvelope?.result?.protocolVersion || protocolVersion;
  await rpc("notifications/initialized", {}, { retry: true });

  const call = async (name, args = {}) => parseToolResult(
    await rpc("tools/call", { name, arguments: args }),
    name
  );

  const documents = (await call("ListDocuments")).data;
  const activeDocument = asArray(documents.documents).find(document => document?.isActive);
  if (activeDocument?.name !== FIXTURE_DOCUMENT) {
    throw new Error(
      `Refusing to mutate '${activeDocument?.name || "unknown"}'. Open and activate the disposable ${FIXTURE_DOCUMENT}.svg fixture first.`
    );
  }

  const baseline = parseToolResult(
    await rpc("tools/call", { name: "GetCanvasStructure", arguments: { maxDepth: 0 } }),
    "GetCanvasStructure"
  ).data;
  const baselineLayers = asArray(baseline.objects_basic_details || baseline.layers);
  const sourceLayer = findLayer(baselineLayers, "Layer 1") || baselineLayers[0];
  if (!sourceLayer?.uuid) throw new Error("Could not identify the fixture's source layer");
  if (findLayer(baselineLayers, "MCP TEST")) {
    throw new Error("MCP TEST already exists in the fixture; remove only that disposable test layer before rerunning");
  }

  const sourceStructure = (await call("GetObjectStructure", {
    uuids: [sourceLayer.uuid],
    maxDepth: -1,
    includeTypes: ["text"]
  })).data;
  const textObjects = findByType(sourceStructure, "text");
  const sourceText = textObjects.find(item =>
    String(item.text_content ?? item.contents ?? item.content ?? "").includes("PLACEHOLDER")
  ) || textObjects[0];
  if (!sourceText?.uuid) throw new Error("Could not identify the fixture's live text object");
  const sourceTextValue = String(sourceText.text_content ?? sourceText.contents ?? sourceText.content ?? "");
  if (!sourceTextValue.includes("PLACEHOLDER")) {
    throw new Error(`Fixture source text is not PLACEHOLDER (got ${sourceTextValue.slice(0, 120)})`);
  }

  const createdLayer = (await call("CreateLayer", {
    layerName: "MCP TEST",
    position: "front"
  })).data;
  const createdLayerUuid = createdLayer.uuid || createdLayer.layer_uuid;
  if (!createdLayerUuid) throw new Error("CreateLayer did not return a layer UUID");

  const afterLayer = (await call("GetCanvasStructure", { maxDepth: 0 })).data;
  const afterLayers = asArray(afterLayer.objects_basic_details || afterLayer.layers);
  const testLayer = findLayer(afterLayers, "MCP TEST");
  if (!testLayer?.uuid || testLayer.uuid !== createdLayerUuid) {
    throw new Error("Could not verify the newly created MCP TEST layer");
  }
  if (Number(testLayer.child_count || 0) !== 0) {
    throw new Error("MCP TEST layer was not empty at creation");
  }

  const duplicate = (await call("DuplicateObjects", {
    uuids: [sourceText.uuid],
    artName: "QUALITY"
  })).data;
  const duplicateCandidates = [
    duplicate.uuid,
    duplicate.object_uuid,
    duplicate.new_uuid,
    ...asArray(duplicate.uuids),
    ...asArray(duplicate.object_uuids),
    ...findByType(duplicate, "text").map(item => item.uuid)
  ].filter(Boolean);
  const duplicateUuid = duplicateCandidates[0];
  if (!duplicateUuid) throw new Error("DuplicateObjects did not return a duplicate UUID");

  await call("ReplaceText", { uuid: duplicateUuid, replaceText: "QUALITY" });
  const replaced = (await call("GetObjectStructure", {
    uuids: [duplicateUuid],
    maxDepth: 0,
    includeTypes: ["text"]
  })).data;
  const replacedText = findByType(replaced, "text")[0] || replaced;
  const replacedValue = String(replacedText.text_content ?? replacedText.contents ?? replacedText.content ?? "");
  if (replacedValue !== "QUALITY") {
    throw new Error(`ReplaceText did not produce QUALITY (got ${replacedValue.slice(0, 120)})`);
  }

  await call("MoveObjectsToContainer", {
    uuids: [duplicateUuid],
    parentID: testLayer.uuid,
    position: "front"
  });

  const finalCanvas = (await call("GetCanvasStructure", { maxDepth: 0 })).data;
  const finalLayers = asArray(finalCanvas.objects_basic_details || finalCanvas.layers);
  const finalLayer = findLayer(finalLayers, "MCP TEST");

  const finalStructure = (await call("GetObjectStructure", {
    uuids: [testLayer.uuid],
    maxDepth: -1,
    includeTypes: ["text"]
  })).data;
  const finalTexts = findByType(finalStructure, "text");
  const qualityText = finalTexts.find(item =>
    String(item.text_content ?? item.contents ?? item.content ?? "") === "QUALITY"
  );
  if (!qualityText) throw new Error("MCP TEST layer does not contain the editable QUALITY text");

  const typography = (await call("GetTypographyMetrics", { uuids: [duplicateUuid] })).data;
  const preview = (await call("CapturePreview", {
    reason: "Illustrator MCP isolated acceptance proof",
    targetType: "UUID",
    uuids: [testLayer.uuid],
    width: 512,
    height: 512
  })).data;

  const result = {
    success: true,
    document: FIXTURE_DOCUMENT,
    source_text: { uuid: sourceText.uuid, value: sourceTextValue },
    test_layer: {
      uuid: finalLayer?.uuid || testLayer.uuid,
      name: finalLayer?.name || testLayer.name,
      child_count: finalLayer?.child_count ?? null
    },
    quality_text: {
      uuid: qualityText.uuid || duplicateUuid,
      value: String(qualityText.text_content ?? qualityText.contents ?? qualityText.content ?? "QUALITY"),
      bounds: qualityText.bounds || null
    },
    typography,
    preview
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(`Illustrator MCP acceptance failed: ${error.message}`);
  process.exitCode = 1;
});
