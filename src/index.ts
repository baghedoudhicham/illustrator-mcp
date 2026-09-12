import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DEFAULT_PROFILE, learnProfile } from "./core/profile.js";
import { scoreTrace } from "./core/quality.js";
import { suggestCleanup } from "./core/cleanup.js";
import type { Point, TracingProfile } from "./types.js";

const server = new McpServer({
  name: "illustrator-mcp",
  version: "0.1.0"
});

const pointSchema = z.object({ x: z.number(), y: z.number() });
const profileSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  samples: z.number(),
  targetAnchorsPer1000: z.number(),
  cornerAngleDeg: z.number(),
  smoothnessWeight: z.number(),
  symmetryWeight: z.number(),
  simplifyTolerance: z.number(),
  preferPrimitiveRecovery: z.boolean(),
  preferCompoundPaths: z.boolean(),
  notes: z.array(z.string())
});

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

server.tool(
  "trace_score_geometry",
  "Compare sampled reference geometry with sampled candidate vector geometry using normalized shape error, symmetry, bounds, smoothness, and anchor economy.",
  {
    reference: z.array(pointSchema).min(2),
    candidate: z.array(pointSchema).min(2),
    candidateAnchors: z.number().int().positive(),
    profile: profileSchema.optional()
  },
  async ({ reference, candidate, candidateAnchors, profile }) => {
    return json(scoreTrace(reference as Point[], candidate as Point[], candidateAnchors, (profile ?? DEFAULT_PROFILE) as TracingProfile));
  }
);

server.tool(
  "trace_suggest_cleanup",
  "Suggest deterministic cleanup opportunities for a sampled vector path.",
  {
    points: z.array(pointSchema).min(2),
    anchors: z.number().int().positive(),
    profile: profileSchema.optional()
  },
  async ({ points, anchors, profile }) => {
    return json(suggestCleanup(points as Point[], anchors, (profile ?? DEFAULT_PROFILE) as TracingProfile));
  }
);

server.tool(
  "trace_learn_profile",
  "Update a tracing-style profile from one accepted designer correction. This is a transparent preference model, not opaque training.",
  {
    profile: profileSchema.optional(),
    observation: z.object({
      anchorsPer1000: z.number().positive().optional(),
      cornerAngleDeg: z.number().min(1).max(179).optional(),
      simplifyTolerance: z.number().positive().optional(),
      smoothnessWeight: z.number().positive().optional(),
      symmetryWeight: z.number().positive().optional(),
      note: z.string().max(500).optional()
    })
  },
  async ({ profile, observation }) => {
    return json(learnProfile((profile ?? DEFAULT_PROFILE) as TracingProfile, observation));
  }
);

server.tool(
  "trace_get_default_profile",
  "Return the baseline tracing profile and its explicit assumptions.",
  {},
  async () => json(DEFAULT_PROFILE)
);

const transport = new StdioServerTransport();
await server.connect(transport);
