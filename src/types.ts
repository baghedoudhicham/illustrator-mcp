export type Point = { x: number; y: number };

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type TraceMetrics = {
  normalizedHausdorff: number;
  normalizedChamfer: number;
  boundsError: number;
  symmetryError: number;
  anchorPenalty: number;
  smoothnessPenalty: number;
  score: number;
};

export type TracingProfile = {
  version: 1;
  name: string;
  samples: number;
  targetAnchorsPer1000: number;
  cornerAngleDeg: number;
  smoothnessWeight: number;
  symmetryWeight: number;
  simplifyTolerance: number;
  preferPrimitiveRecovery: boolean;
  preferCompoundPaths: boolean;
  notes: string[];
};
