import { describe, expect, it } from "vitest";
import { bilateralSymmetryError, bounds, chamfer, hausdorff, normalize, resample } from "./geometry.js";

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
  { x: 0, y: 0 }
];

describe("geometry", () => {
  it("computes bounds", () => {
    expect(bounds(square)).toMatchObject({ minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 });
  });

  it("normalizes independent of source size", () => {
    const a = resample(normalize(square), 64);
    const b = resample(normalize(square.map(p => ({ x: p.x * 20, y: p.y * 20 }))), 64);
    expect(hausdorff(a, b)).toBeLessThan(1e-8);
    expect(chamfer(a, b)).toBeLessThan(1e-8);
  });

  it("recognizes bilateral symmetry", () => {
    expect(bilateralSymmetryError(square)).toBeLessThan(0.03);
  });
});
