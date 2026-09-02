import type { IllustratorPort } from "./ports/illustrator-port.js";
import type { IllustratorCommand, CommandExecution } from "./commands/command.js";

export type TransactionReport = {
  ok: boolean;
  executed: string[];
  rolledBack: string[];
  error?: string;
};

/**
 * Application-level compensation transaction.
 *
 * Illustrator is not a database. We do not claim ACID rollback. Each command
 * must provide an explicit compensating action, or the adapter may expose a
 * reliable immediate undo. This makes failure semantics visible and testable.
 */
export async function executeTransaction(
  port: IllustratorPort,
  commands: IllustratorCommand[]
): Promise<TransactionReport> {
  const completed: Array<{ description: string; result: CommandExecution }> = [];
  const executed: string[] = [];

  for (const command of commands) {
    const description = command.describe();

    try {
      const result = await command.execute({ port });
      if (!result.ok) {
        return rollback(port, completed, executed, result.message ?? `Command failed: ${description}`);
      }
      completed.push({ description, result });
      executed.push(description);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return rollback(port, completed, executed, message);
    }
  }

  return { ok: true, executed, rolledBack: [] };
}

async function rollback(
  port: IllustratorPort,
  completed: Array<{ description: string; result: CommandExecution }>,
  executed: string[],
  error: string
): Promise<TransactionReport> {
  const rolledBack: string[] = [];

  for (const item of completed.reverse()) {
    try {
      if (item.result.rollback) {
        await item.result.rollback();
        rolledBack.push(item.description);
      } else if (port.undoLast) {
        const undo = await port.undoLast();
        if (undo.ok) rolledBack.push(item.description);
      }
    } catch {
      // Preserve the primary failure. Partial rollback remains visible in report.
    }
  }

  return { ok: false, executed, rolledBack, error };
}
