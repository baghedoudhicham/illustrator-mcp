import type { Point, TraceMetrics, TracingProfile } from "../types.js";
import {
  bilateralSymmetryError,
  boundsDifference,
  chamfer,
  hausdorff,
  normalize,
  resample,
  turningAngles
} from "./geometry.js";

export function scoreTrace(
  reference: Point[],
  candidate: Point[],
  candidateAnchors: number,
  profile: TracingProfile
): TraceMetrics {
  const ref = resample(normalize(reference), 240);
  const cand = resample(normalize(candidate), 240);

  const normalizedHausdorff = hausdorff(ref, cand);
  const normalizedChamfer = chamfer(ref, cand);
  const boundsError = boundsDifference(reference, candidate);

  const refSym = bilateralSymmetryError(ref);
  const candSym = bilateralSymmetryError(cand);
  const symmetryError = Math.abs(refSym - candSym);

  const anchorTarget = Math.max(4, profile.targetAnchorsPer1000);
  const anchorPenalty = Math.max(0, (candidateAnchors - anchorTarget) / anchorTarget);

  const angles = turningAngles(cand);
  const roughTurns = angles.filter(a => a > profile.cornerAngleDeg && a < 170).length;
  const smoothnessPenalty = angles.length ? roughTurns / angles.length : 0;

  const error =
    normalizedHausdorff * 0.34 +
    normalizedChamfer * 0.26 +
    boundsError * 0.12 +
    symmetryError * profile.symmetryWeight * 0.12 +
    Math.min(anchorPenalty, 2) * 0.08 +
    smoothnessPenalty * profile.smoothnessWeight * 0.08;

  return {
    normalizedHausdorff,
    normalizedChamfer,
    boundsError,
    symmetryError,
    anchorPenalty,
    smoothnessPenalty,
    score: Math.max(0, Math.min(100, 100 * (1 - error)))
  };
}
