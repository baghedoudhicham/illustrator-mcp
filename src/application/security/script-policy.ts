const forbiddenTokens = [
  /\bFile\b/,
  /\bFolder\b/,
  /\.execute\s*\(/,
  /\bSocket\b/,
  /\bBridgeTalk\b/,
  /system\s*\.\s*callSystem/i,
  /app\s*\.\s*open\s*\(/i
];

export type ScriptPolicyResult = {
  allowed: boolean;
  reasons: string[];
};

/**
 * Conservative first-pass policy for any future local-only script escape hatch.
 *
 * This is defense in depth, not a sandbox. The remote MCP surface must never
 * expose arbitrary script execution. Prefer named IllustratorPort capabilities.
 */
export function evaluateIllustratorScript(script: string): ScriptPolicyResult {
  const reasons = forbiddenTokens
    .filter(rule => rule.test(script))
    .map(rule => `Blocked token matched: ${rule.source}`);

  if (script.length > 20_000) reasons.push("Script exceeds maximum permitted length.");

  return { allowed: reasons.length === 0, reasons };
}
