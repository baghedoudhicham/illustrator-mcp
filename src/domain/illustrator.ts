export type ObjectRef = { id: string };
export type LayerRef = ObjectRef & { name: string };
export type PathRef = ObjectRef;
export type TextRef = ObjectRef;

export type DocumentSnapshot = {
  name: string;
  artboards: Array<{ name: string; width: number; height: number }>;
  layers: Array<{ id: string; name: string; locked?: boolean; visible?: boolean }>;
  selectionCount: number;
};

export type PathStyle = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type TextStyle = {
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  fill?: string;
};

export type ExportFormat = "svg" | "pdf" | "eps" | "png";

export type ExportResult = {
  format: ExportFormat;
  path?: string;
  bytes?: Uint8Array;
};

export type OperationResult<T> = {
  ok: boolean;
  value?: T;
  message?: string;
};

export type Point2D = { x: number; y: number };
