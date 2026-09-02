import { describe, expect, it } from "vitest";
import type { IllustratorPort } from "./ports/illustrator-port.js";
import { CreateLayerCommand } from "./commands/create-layer.js";
import { CreateTextCommand } from "./commands/create-text.js";
import { executeTransaction } from "./transaction.js";

function fakePort(failText = false): IllustratorPort {
  const objects = new Set<string>();
  let seq = 0;

  return {
    async inspectDocument() {
      return { name: "test.ai", artboards: [], layers: [], selectionCount: 0 };
    },
    async createLayer({ name }) {
      const id = `layer-${++seq}`;
      objects.add(id);
      return { ok: true, value: { id, name } };
    },
    async createText() {
      if (failText) return { ok: false, message: "text failed" };
      const id = `text-${++seq}`;
      objects.add(id);
      return { ok: true, value: { id } };
    },
    async createPath() {
      const id = `path-${++seq}`;
      objects.add(id);
      return { ok: true, value: { id } };
    },
    async removeObject({ id }) {
      objects.delete(id);
      return { ok: true };
    },
    async exportArtwork({ format }) {
      return { ok: true, value: { format } };
    }
  };
}

describe("executeTransaction", () => {
  it("executes a simple vertical slice", async () => {
    const report = await executeTransaction(fakePort(), [
      new CreateLayerCommand("PRIMARY VALUES"),
      new CreateTextCommand({ contents: "QUALITY", position: { x: 10, y: 20 } })
    ]);

    expect(report.ok).toBe(true);
    expect(report.executed).toHaveLength(2);
  });

  it("runs compensating rollback when a later command fails", async () => {
    const report = await executeTransaction(fakePort(true), [
      new CreateLayerCommand("PRIMARY VALUES"),
      new CreateTextCommand({ contents: "QUALITY", position: { x: 10, y: 20 } })
    ]);

    expect(report.ok).toBe(false);
    expect(report.rolledBack).toEqual(['Create layer "PRIMARY VALUES"']);
  });
});
