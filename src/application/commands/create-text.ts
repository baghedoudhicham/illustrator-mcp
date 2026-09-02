import type { Point2D, TextRef, TextStyle } from "../../domain/illustrator.js";
import type { IllustratorCommand } from "./command.js";

export class CreateTextCommand implements IllustratorCommand<TextRef> {
  constructor(
    private readonly input: {
      layerId?: string;
      contents: string;
      position: Point2D;
      style?: TextStyle;
    }
  ) {}

  describe(): string {
    const preview = this.input.contents.length > 32
      ? `${this.input.contents.slice(0, 29)}...`
      : this.input.contents;
    return `Create text "${preview}"`;
  }

  async execute({ port }: Parameters<IllustratorCommand<TextRef>["execute"]>[0]) {
    const result = await port.createText(this.input);
    if (!result.ok || !result.value) {
      return { ok: false, message: result.message ?? "Unable to create text." };
    }

    const text = result.value;
    return {
      ok: true,
      value: text,
      rollback: async () => {
        await port.removeObject({ id: text.id });
      }
    };
  }
}
