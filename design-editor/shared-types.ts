// Types shared between the client overlay and the dev-server save middleware.
// Env-agnostic: no DOM types, no Node types.

export type ClassCategory =
  | 'position-offset'
  | 'position-mode'
  | 'width'
  | 'height'
  | 'background-color'
  | 'border-radius'
  | 'opacity'
  | 'z-index'
  | 'padding'
  | 'gap'
  | 'justify-content'
  | 'margin-top'
  | 'margin'
  | 'rotation';

export type LayoutKind =
  | 'absolute-layer'
  | 'flow-item'
  | 'section'
  | 'container'
  | 'generated'
  | 'unsafe';

export type LayoutOverride = 'auto' | 'layer' | 'flow-item' | 'section' | 'container';

export type ParentLayout =
  | 'block'
  | 'flex-row'
  | 'flex-column'
  | 'flex-wrap'
  | 'grid'
  | 'unknown';

export type SourceMode = 'static' | 'conditional' | 'generated' | 'unknown';

export type EditorOperationKind =
  | 'move-layer'
  | 'reorder'
  | 'reparent'
  | 'swap'
  | 'edit-container'
  | 'resize'
  | 'edit-content';

export interface LayoutClassificationSummary {
  kind: LayoutKind;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  allowedOperations: EditorOperationKind[];
  parentLayout: ParentLayout;
  sourceMode: SourceMode;
}

export interface PendingClassEdit {
  kind: 'class';
  /** data-vle-id of the target element */
  id: string;
  /** classes to add, already fully-formed (e.g. "top-[12.4%]", "w-[212px]") */
  add: string[];
  /** categories whose existing same-category classes should be removed before adding */
  categories: ClassCategory[];
}

export interface PendingTextEdit {
  kind: 'text';
  id: string;
  text: string;
}

export interface DesignAssetRef {
  importPath: string;
  originalName: string;
}

export interface PendingDeleteEdit {
  kind: 'delete';
  id: string;
}

export interface PendingAssetInsertEdit {
  kind: 'insert-asset';
  id: string;
  parentId: string;
  asset: DesignAssetRef;
  className: string;
  alt: string;
}

export interface PendingAssetReplaceEdit {
  kind: 'replace-with-asset';
  id: string;
  /** Zero-based index supplied by an enclosing Array.map callback. */
  instanceIndex?: number;
  asset: DesignAssetRef;
  alt: string;
}

export interface PendingReorderEdit {
  kind: 'reorder';
  id: string;
  parentId: string;
  beforeId: string | null;
}

export interface PendingSwapEdit {
  kind: 'swap';
  id: string;
  otherId: string;
  parentId: string;
}

export type PendingEdit =
  | PendingClassEdit
  | PendingTextEdit
  | PendingDeleteEdit
  | PendingAssetInsertEdit
  | PendingAssetReplaceEdit
  | PendingReorderEdit
  | PendingSwapEdit;

export interface SaveRequestBody {
  edits: PendingEdit[];
}

export interface SaveResultItem {
  id: string;
  ok: boolean;
  error?: string;
}

export interface SaveResponseBody {
  results: SaveResultItem[];
}

export interface UploadAssetRequestBody {
  name: string;
  type: string;
  dataUrl: string;
}

export interface UploadAssetResponseBody {
  ok: boolean;
  asset?: DesignAssetRef;
  error?: string;
}

export interface ExportSvgRequestBody {
  name: string;
  svg: string;
}

export interface ExportSvgResponseBody {
  ok: boolean;
  fileName?: string;
  relativePath?: string;
  absolutePath?: string;
  error?: string;
}

export interface SelectionContextBody {
  version: 1;
  id: string;
  tagName: string;
  className: string;
  text: string;
  route: string;
  prompt?: string;
  viewport: {
    width: number;
    height: number;
    dpr: number;
    scrollX: number;
    scrollY: number;
  };
  rect: { top: number; left: number; width: number; height: number };
  parentId?: string;
  childIds: string[];
  siblingIds: string[];
  attributes: Record<string, string>;
  computedStyle: Record<string, string>;
  layout: LayoutClassificationSummary;
}

export interface SelectionContextResponseBody {
  ok: boolean;
  path?: string;
  error?: string;
}
