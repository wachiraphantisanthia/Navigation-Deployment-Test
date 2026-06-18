export type Nullable<T> = T | null | undefined;

export interface NodeResponse {
  id: number;
  name: string;
  node_type: string;
  floor: number;
  x: number;
  y: number;
  description?: Nullable<string>;
  environment_description?: Nullable<string>;
  image_description?: Nullable<string>;
  image_url?: Nullable<string>;
  kiosk_code?: Nullable<string>;
  service_floor_from?: Nullable<number>;
  service_floor_to?: Nullable<number>;
  use_when_floor_distance?: Nullable<number>;
  supports_wheelchair: boolean;
  is_hidden: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NodeCreatePayload {
  name: string;
  node_type: string;
  floor: number;
  x: number;
  y: number;
  description?: Nullable<string>;
  environment_description?: Nullable<string>;
  image_description?: Nullable<string>;
  image_url?: Nullable<string>;
  kiosk_code?: Nullable<string>;
  service_floor_from?: Nullable<number>;
  service_floor_to?: Nullable<number>;
  use_when_floor_distance?: Nullable<number>;
  supports_wheelchair?: boolean;
  is_hidden?: boolean;
}

export type NodeUpdatePayload = Partial<NodeCreatePayload>;

export interface EdgeResponse {
  id: number;
  from_node_id: number;
  to_node_id: number;
  weight: number;
  is_bidirectional: boolean;
  is_hidden: boolean;
  created_at?: string;
}

export interface EdgeCreatePayload {
  from_node_id: number;
  to_node_id: number;
  weight: number;
  is_bidirectional?: boolean;
  is_hidden?: boolean;
}

export type EdgeUpdatePayload = Partial<EdgeCreatePayload>;

export interface KioskResponse {
  id: number;
  kiosk_code: string;
  name?: Nullable<string>;
  floor: number;
  x: number;
  y: number;
  node_id?: Nullable<number>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KioskCreatePayload {
  kiosk_code: string;
  name?: Nullable<string>;
  floor: number;
  x: number;
  y: number;
  node_id?: Nullable<number>;
  is_active?: boolean;
  create_node?: boolean;
}

export type KioskUpdatePayload = Partial<KioskCreatePayload>;

export interface NodeCategoryResponse {
  key: string;
  label: string;
  image_url?: Nullable<string>;
  is_hidden: boolean;
  created_at?: string;
}

export interface NodeCategoryPayload {
  key: string;
  label: string;
  image_url?: Nullable<string>;
  is_hidden?: boolean;
}

export type NodeCategoryUpdatePayload = Partial<NodeCategoryPayload>;

export interface FloorMapResponse {
  floor: number;
  image_data_url: string;
  original_width: number;
  original_height: number;
  map_width: number;
  map_height: number;
  updated_at?: string;
}

export interface FloorMapPayload extends FloorMapResponse {}

export interface KioskCategoryResponse {
  id: number;
  key?: string;
  name: string;
  image_url?: Nullable<string>;
  is_base?: boolean;
}

export interface KioskDestinationSummary {
  id: number;
  name: string;
  image_url?: Nullable<string>;
  floor: number;
}

export interface KioskDestinationDetail extends KioskDestinationSummary {
  description?: Nullable<string>;
  environment_description?: Nullable<string>;
  category: KioskCategoryResponse;
}

export interface KioskHomeResponse {
  categories: KioskCategoryResponse[];
  featured_destinations: KioskDestinationSummary[];
}

export interface RouteRequestPayload {
  start_node_id?: number | null;
  start_kiosk_id?: number | null;
  destination_node_id: number;
  wheelchair_accessible?: boolean;
}

export interface RouteResponse {
  path: number[];
  distance: number;
  steps: string[];
  nodes: NodeResponse[];
}

export type EditorMode = "select" | "add-node" | "add-kiosk" | "move-node" | "add-edge" | "delete" | "hide";
export type AdminTab = "map" | "categories" | "kiosks" | "route";
export type KioskTab = "home" | "categories" | "search" | "detail" | "route";
export type LanguageCode = "TH" | "EN";

export interface Point {
  x: number;
  y: number;
}

export interface CanvasTransform {
  scale: number;
  panX: number;
  panY: number;
}
