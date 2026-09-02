import type { IllustratorPort } from "../ports/illustrator-port.js";

export type CommandContext = {
  port: IllustratorPort;
};

export type CommandExecution<T = unknown> = {
  ok: boolean;
  value?: T;
  message?: string;
  rollback?: () => Promise<void>;
};

/**
 * Commands are application operations, not serialized model instructions.
 * They may compose multiple port capabilities while keeping adapter details out.
 */
export interface IllustratorCommand<T = unknown> {
  describe(): string;
  execute(context: CommandContext): Promise<CommandExecution<T>>;
}
