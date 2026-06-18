import type {
  EdgeCreatePayload,
  EdgeResponse,
  EdgeUpdatePayload,
  FloorMapPayload,
  FloorMapResponse,
  KioskCreatePayload,
  KioskDestinationDetail,
  KioskDestinationSummary,
  KioskHomeResponse,
  KioskResponse,
  KioskUpdatePayload,
  NodeCategoryPayload,
  NodeCategoryResponse,
  NodeCategoryUpdatePayload,
  NodeCreatePayload,
  NodeResponse,
  NodeUpdatePayload,
  RouteRequestPayload,
  RouteResponse,
  KioskCategoryResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : (data as any)?.detail || (data as any)?.message || response.statusText || "Request failed";
    throw new ApiError(String(message), response.status, data);
  }

  return data as T;
}

function queryString(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

// Nodes
export const getNodes = (params?: { floor?: number; node_type?: string; include_hidden?: boolean }) =>
  request<NodeResponse[]>(`/api/nodes${queryString(params)}`);

export const getNode = (nodeId: number) => request<NodeResponse>(`/api/nodes/${nodeId}`);

export const createNode = (payload: NodeCreatePayload) =>
  request<NodeResponse>("/api/nodes", { method: "POST", body: JSON.stringify(payload) });

export const updateNode = (nodeId: number, payload: NodeUpdatePayload) =>
  request<NodeResponse>(`/api/nodes/${nodeId}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteNode = (nodeId: number) =>
  request<void>(`/api/nodes/${nodeId}`, { method: "DELETE" });

// Edges
export const getEdges = () => request<EdgeResponse[]>("/api/edges");

export const createEdge = (payload: EdgeCreatePayload) =>
  request<EdgeResponse>("/api/edges", { method: "POST", body: JSON.stringify(payload) });

export const updateEdge = (edgeId: number, payload: EdgeUpdatePayload) =>
  request<EdgeResponse>(`/api/edges/${edgeId}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteEdge = (edgeId: number) =>
  request<void>(`/api/edges/${edgeId}`, { method: "DELETE" });

// Kiosks
export const getKiosks = (params?: { floor?: number; is_active?: boolean }) =>
  request<KioskResponse[]>(`/api/kiosks${queryString(params)}`);

export const getKiosk = (kioskId: number) => request<KioskResponse>(`/api/kiosks/${kioskId}`);

export const createKiosk = (payload: KioskCreatePayload) =>
  request<KioskResponse>("/api/kiosks", { method: "POST", body: JSON.stringify(payload) });

export const updateKiosk = (kioskId: number, payload: KioskUpdatePayload) =>
  request<KioskResponse>(`/api/kiosks/${kioskId}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteKiosk = (kioskId: number) =>
  request<void>(`/api/kiosks/${kioskId}`, { method: "DELETE" });

// Node categories
export const getNodeCategories = () => request<NodeCategoryResponse[]>("/api/node-categories");

export const createNodeCategory = (payload: NodeCategoryPayload) =>
  request<NodeCategoryResponse>("/api/node-categories", { method: "POST", body: JSON.stringify(payload) });

export const updateNodeCategory = (key: string, payload: NodeCategoryUpdatePayload) =>
  request<NodeCategoryResponse>(`/api/node-categories/${key}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteNodeCategory = (key: string) =>
  request<void>(`/api/node-categories/${key}`, { method: "DELETE" });

// Floor maps
export const getFloorMaps = () => request<FloorMapResponse[]>("/api/floor-maps");

export const saveFloorMap = (floor: number, payload: FloorMapPayload) =>
  request<FloorMapResponse>(`/api/floor-maps/${floor}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteFloorMap = (floor: number) =>
  request<void>(`/api/floor-maps/${floor}`, { method: "DELETE" });

// Kiosk frontend APIs
export const getKioskHome = () => request<KioskHomeResponse>("/api/kiosk/home");
export const getKioskCategories = () => request<KioskCategoryResponse[]>("/api/kiosk/categories");
export const getKioskDestinationsByCategory = (categoryId: number) =>
  request<KioskDestinationSummary[]>(`/api/kiosk/categories/${categoryId}/destinations`);
export const getKioskDestinationDetail = (nodeId: number) =>
  request<KioskDestinationDetail>(`/api/kiosk/destinations/${nodeId}`);
export const searchKioskDestinations = (query: string) =>
  request<KioskDestinationSummary[]>(`/api/kiosk/search${queryString({ q: query })}`);

// Route
export const calculateRoute = (payload: RouteRequestPayload) =>
  request<RouteResponse>("/api/route", { method: "POST", body: JSON.stringify(payload) });

// misc
export const apiBaseUrl = API_BASE_URL;
export { ApiError };
