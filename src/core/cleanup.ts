import type { Point, TracingProfile } from "../types.js";
import { bounds, distance, turningAngles } from "./geometry.js";

export type CleanupSuggestion = {
  severity: "info" | "warning";
  code: string;
  message: string;
};

export function suggestCleanup(
  points: Point[],
  anchors: number,
  profile: TracingProfile
): CleanupSuggestion[] {
  const out: CleanupSuggestion[] = [];
  const b = bounds(points);
  const scale = Math.max(b.width, b.height, 1e-9);
  const minGap = scale * profile.simplifyTolerance;

  let microSegments = 0;
  for (let i = 1; i < points.length; i++) {
    if (distance(points[i - 1], points[i]) < minGap) microSegments++;
  }
  if (microSegments > Math.max(2, points.length * 0.04)) {
    out.push({
      severity: "warning",
      code: "micro-segments",
      message: "Many very short segments suggest raster noise or redundant anchors. Simplify before hand-tuning."
    });
  }

  const angles = turningAngles(points);
  const nearStraight = angles.filter(a => a > 170).length;
  if (nearStraight > angles.length * 0.25) {
    out.push({
      severity: "info",
      code: "near-straight-anchors",
      message: "Several anchors sit on nearly straight runs. Consider replacing them with a single line or longer Bézier segment."
    });
  }

  if (anchors > profile.targetAnchorsPer1000 * 1.4) {
    out.push({
      severity: "warning",
      code: "anchor-density",
      message: "Anchor density is above the profile target. Preserve silhouette first, then reduce nodes within the error tolerance."
    });
  }

  if (!out.length) {
    out.push({
      severity: "info",
      code: "clean",
      message: "No obvious geometric clutter detected from the supplied sampled path."
    });
  }
  return out;
}
