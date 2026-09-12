import { describe, expect, it } from "vitest";
import { DEFAULT_PROFILE, learnProfile } from "./profile.js";

describe("tracing profile", () => {
  it("moves toward accepted designer observations without replacing the profile abruptly", () => {
    const next = learnProfile(DEFAULT_PROFILE, {
      anchorsPer1000: 16,
      cornerAngleDeg: 36,
      simplifyTolerance: 0.0018,
      note: "Keep outer silhouette cleaner than raster noise."
    });

    expect(next.samples).toBe(1);
    expect(next.targetAnchorsPer1000).toBeLessThan(DEFAULT_PROFILE.targetAnchorsPer1000);
    expect(next.targetAnchorsPer1000).toBeGreaterThan(16);
    expect(next.notes.at(-1)).toContain("outer silhouette");
  });
});
