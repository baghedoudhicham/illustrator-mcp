export type IllustratorDocumentInfo = {
  name: string;
  artboards: Array<{ name: string; width: number; height: number }>;
  layers: string[];
  selectionCount: number;
};

export type IllustratorTransaction = {
  id: string;
  operations: Array<
    | { type: "create-layer"; name: string }
    | { type: "place-svg"; svg: string; layer?: string }
    | { type: "execute-script"; script: string }
  >;
};

/**
 * Transport-neutral contract.
 *
 * We can implement this with:
 * - Adobe's Illustrator MCP as a low-friction adapter,
 * - ExtendScript/JSX for deeper document operations,
 * - or a UXP/local bridge later.
 *
 * The tracing engine never depends on the transport.
 */
export interface IllustratorAdapter {
  inspectDocument(): Promise<IllustratorDocumentInfo>;
  executeTransaction(tx: IllustratorTransaction): Promise<{ ok: boolean; message: string }>;
}
