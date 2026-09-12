import type { LayerRef } from "../../domain/illustrator.js";
import type { IllustratorCommand } from "./command.js";

export class CreateLayerCommand implements IllustratorCommand<LayerRef> {
  constructor(private readonly name: string) {}

  describe(): string {
    return `Create layer "${this.name}"`;
  }

  async execute({ port }: Parameters<IllustratorCommand<LayerRef>["execute"]>[0]) {
    const result = await port.createLayer({ name: this.name });
    if (!result.ok || !result.value) {
      return { ok: false, message: result.message ?? "Unable to create layer." };
    }

    const layer = result.value;
    return {
      ok: true,
      value: layer,
      rollback: async () => {
        await port.removeObject({ id: layer.id });
      }
    };
  }
}
