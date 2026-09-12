import type {
  DocumentSnapshot,
  ExportFormat,
  ExportResult,
  LayerRef,
  OperationResult,
  PathRef,
  PathStyle,
  Point2D,
  TextRef,
  TextStyle
} from "../../domain/illustrator.js";

/**
 * Application-facing capability port.
 *
 * Use cases depend on this contract only. Adobe MCP, ExtendScript and UXP
 * belong in outer adapters and may implement only the capabilities they support.
 */
export interface IllustratorPort {
  inspectDocument(): Promise<DocumentSnapshot>;

  createLayer(input: { name: string }): Promise<OperationResult<LayerRef>>;

  createText(input: {
    layerId?: string;
    contents: string;
    position: Point2D;
    style?: TextStyle;
  }): Promise<OperationResult<TextRef>>;

  createPath(input: {
    layerId?: string;
    points: Point2D[];
    closed: boolean;
    style?: PathStyle;
  }): Promise<OperationResult<PathRef>>;

  removeObject(input: { id: string }): Promise<OperationResult<void>>;

  exportArtwork(input: {
    format: ExportFormat;
    destination?: string;
  }): Promise<OperationResult<ExportResult>>;

  /**
   * Optional adapter-level undo support. Implementations must report whether
   * undo is reliable for the immediately preceding mutation.
   */
  undoLast?(): Promise<OperationResult<void>>;
}
