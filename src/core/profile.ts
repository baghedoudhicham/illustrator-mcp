import type { TracingProfile } from "../types.js";

export const DEFAULT_PROFILE: TracingProfile = {
  version: 1,
  name: "default",
  samples: 0,
  targetAnchorsPer1000: 24,
  cornerAngleDeg: 42,
  smoothnessWeight: 1,
  symmetryWeight: 1,
  simplifyTolerance: 0.0025,
  preferPrimitiveRecovery: true,
  preferCompoundPaths: true,
  notes: [
    "Prefer the fewest anchors that preserve silhouette and negative space.",
    "Recover intended circles, lines, symmetry and tangencies before fitting noisy pixels.",
    "Treat blur as uncertainty, not as geometry."
  ]
};

export type AcceptedTraceObservation = {
  anchorsPer1000?: number;
  cornerAngleDeg?: number;
  simplifyTolerance?: number;
  smoothnessWeight?: number;
  symmetryWeight?: number;
  note?: string;
};

function ema(current: number, next: number | undefined, alpha: number): number {
  return next == null || !Number.isFinite(next) ? current : current * (1 - alpha) + next * alpha;
}

export function learnProfile(
  profile: TracingProfile,
  observation: AcceptedTraceObservation
): TracingProfile {
  const nextSamples = profile.samples + 1;
  const alpha = Math.max(0.08, Math.min(0.35, 2 / (nextSamples + 2)));
  const notes = observation.note?.trim()
    ? [...profile.notes.filter(n => n !== observation.note!.trim()), observation.note.trim()].slice(-20)
    : profile.notes;

  return {
    ...profile,
    samples: nextSamples,
    targetAnchorsPer1000: ema(profile.targetAnchorsPer1000, observation.anchorsPer1000, alpha),
    cornerAngleDeg: ema(profile.cornerAngleDeg, observation.cornerAngleDeg, alpha),
    simplifyTolerance: ema(profile.simplifyTolerance, observation.simplifyTolerance, alpha),
    smoothnessWeight: ema(profile.smoothnessWeight, observation.smoothnessWeight, alpha),
    symmetryWeight: ema(profile.symmetryWeight, observation.symmetryWeight, alpha),
    notes
  };
}
