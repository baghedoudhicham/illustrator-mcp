import type { Bounds, Point } from "../types.js";

export const EPS = 1e-9;

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function bounds(points: Point[]): Bounds {
  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = points[0].x, maxX = points[0].x;
  let minY = points[0].y, maxY = points[0].y;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function normalize(points: Point[]): Point[] {
  const b = bounds(points);
  const s = Math.max(b.width, b.height, EPS);
  return points.map(p => ({ x: (p.x - b.minX) / s, y: (p.y - b.minY) / s }));
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}

export function resample(points: Point[], count = 256): Point[] {
  if (points.length <= 1 || count <= 1) return points.slice();
  const total = polylineLength(points);
  if (total < EPS) return Array.from({ length: count }, () => ({ ...points[0] }));

  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
  }

  const out: Point[] = [];
  let seg = 1;
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    while (seg < cumulative.length - 1 && cumulative[seg] < target) seg++;
    const a = points[seg - 1];
    const b = points[seg];
    const span = Math.max(cumulative[seg] - cumulative[seg - 1], EPS);
    const t = (target - cumulative[seg - 1]) / span;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

function pointToSetDistance(p: Point, set: Point[]): number {
  let best = Infinity;
  for (const q of set) best = Math.min(best, distance(p, q));
  return best;
}

export function hausdorff(a: Point[], b: Point[]): number {
  if (!a.length || !b.length) return Infinity;
  const directed = (u: Point[], v: Point[]) =>
    Math.max(...u.map(p => pointToSetDistance(p, v)));
  return Math.max(directed(a, b), directed(b, a));
}

export function chamfer(a: Point[], b: Point[]): number {
  if (!a.length || !b.length) return Infinity;
  const avg = (u: Point[], v: Point[]) =>
    u.reduce((sum, p) => sum + pointToSetDistance(p, v), 0) / u.length;
  return (avg(a, b) + avg(b, a)) / 2;
}

export function turningAngles(points: Point[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const ux = a.x - b.x, uy = a.y - b.y;
    const vx = c.x - b.x, vy = c.y - b.y;
    const um = Math.hypot(ux, uy), vm = Math.hypot(vx, vy);
    if (um < EPS || vm < EPS) continue;
    const cos = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (um * vm)));
    out.push(Math.acos(cos) * 180 / Math.PI);
  }
  return out;
}

export function bilateralSymmetryError(points: Point[], axisX?: number): number {
  if (!points.length) return 1;
  const b = bounds(points);
  const axis = axisX ?? (b.minX + b.maxX) / 2;
  const mirrored = points.map(p => ({ x: 2 * axis - p.x, y: p.y }));
  const scale = Math.max(b.width, b.height, EPS);
  return chamfer(resample(points, 160), resample(mirrored, 160)) / scale;
}

export function boundsDifference(a: Point[], b: Point[]): number {
  const ba = bounds(a), bb = bounds(b);
  const s = Math.max(ba.width, ba.height, bb.width, bb.height, EPS);
  return (
    Math.abs(ba.width - bb.width) +
    Math.abs(ba.height - bb.height) +
    Math.abs(ba.minX - bb.minX) +
    Math.abs(ba.minY - bb.minY)
  ) / (4 * s);
}
