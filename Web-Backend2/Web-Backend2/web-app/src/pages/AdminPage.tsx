import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  createEdge,
  createKiosk,
  createNode,
  createNodeCategory,
  deleteEdge,
  deleteFloorMap,
  deleteKiosk,
  deleteNode,
  deleteNodeCategory,
  getEdges,
  getFloorMaps,
  getKiosks,
  getNodeCategories,
  getNodes,
  calculateRoute,
  saveFloorMap,
  updateEdge,
  updateKiosk,
  updateNode,
  updateNodeCategory,
} from "../api/client";
import { MapEditorCanvas } from "../components/MapEditorCanvas";
import { Modal } from "../components/Modal";
import type {
  AdminTab,
  CanvasTransform,
  EdgeResponse,
  EditorMode,
  FloorMapPayload,
  FloorMapResponse,
  KioskResponse,
  NodeCategoryPayload,
  NodeCategoryResponse,
  NodeCreatePayload,
  NodeResponse,
  NodeUpdatePayload,
  Point,
  RouteResponse,
} from "../types";
import { euclideanWeight, pathPairs } from "../utils/geometry";

const EMPTY_MAP_SVG =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200" viewBox="0 0 1800 1200">
    <rect width="1800" height="1200" fill="#f8fafc"/>
    <g fill="none" stroke="#e2e8f0" stroke-width="2">
      ${Array.from({ length: 18 }, (_, i) => `<path d="M ${i * 100} 0 L ${i * 100} 1200"/>`).join("")}
      ${Array.from({ length: 12 }, (_, i) => `<path d="M 0 ${i * 100} L 1800 ${i * 100}"/>`).join("")}
    </g>
    <text x="900" y="600" text-anchor="middle" font-family="Arial" font-size="32" fill="#94a3b8">
      Blank floor map
    </text>
  </svg>`);

type DialogState =
  | { type: "none" }
  | { type: "node"; mode: "create" | "edit"; node?: NodeResponse; point?: Point }
  | { type: "edge"; mode: "create" | "edit"; edge?: EdgeResponse; defaultWeight?: number }
  | { type: "category"; mode: "create" | "edit"; category?: NodeCategoryResponse }
  | { type: "kiosk"; mode: "create" | "edit"; kiosk?: KioskResponse; point?: Point }
  | { type: "floor"; mode: "create" | "edit"; floor?: FloorMapResponse };

const CATEGORY_PALETTE = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#0891b2",
  "#9333ea",
  "#db2777",
  "#4f46e5",
  "#0d9488",
  "#65a30d",
];

const BASE_CATEGORY_KEYS = new Set(["waypoint", "entrance", "escalator", "elevator"]);

function categoryColor(key: string, index: number) {
  if (key === "kiosk") return "#f97316";
  if (key === "waypoint") return "#64748b";
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

function normalizeNodeType(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function isKioskNodeType(value?: string | null) {
  return normalizeNodeType(value) === "kiosk";
}

function isElevatorNodeType(value?: string | null) {
  return normalizeNodeType(value) === "elevator";
}

function isEscalatorNodeType(value?: string | null) {
  return normalizeNodeType(value) === "escalator";
}

function isBaseCategory(key?: string | null) {
  return BASE_CATEGORY_KEYS.has(normalizeNodeType(key));
}

function sanitizeNodePayload<T extends NodeCreatePayload | NodeUpdatePayload>(payload: T): T {
  const next = { ...payload } as T;
  if (!("node_type" in next)) {
    return next;
  }
  const nodeType = normalizeNodeType(next.node_type);

  if (!isKioskNodeType(nodeType)) {
    next.kiosk_code = null;
  }

  next.service_floor_from = null;

  if (!isElevatorNodeType(nodeType) && !isEscalatorNodeType(nodeType)) {
    next.service_floor_to = null;
    next.use_when_floor_distance = null;
  } else if (!isEscalatorNodeType(nodeType)) {
    next.use_when_floor_distance = null;
  }

  return next;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("map");
  const [mode, setMode] = useState<EditorMode>("select");
  const [floors, setFloors] = useState<FloorMapResponse[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [nodes, setNodes] = useState<NodeResponse[]>([]);
  const [edges, setEdges] = useState<EdgeResponse[]>([]);
  const [kiosks, setKiosks] = useState<KioskResponse[]>([]);
  const [categories, setCategories] = useState<NodeCategoryResponse[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const [selectedKioskId, setSelectedKioskId] = useState<number | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>({ scale: 1, panX: 0, panY: 0 });
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeStartKioskId, setRouteStartKioskId] = useState<string>("");
  const [routeDestinationId, setRouteDestinationId] = useState<string>("");
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [history, setHistory] = useState<Array<{ nodes: NodeResponse[]; edges: EdgeResponse[] }>>([]);
  const [future, setFuture] = useState<Array<{ nodes: NodeResponse[]; edges: EdgeResponse[] }>>([]);

  const currentFloorMap = useMemo(
    () => floors.find((floor) => floor.floor === selectedFloor),
    [floors, selectedFloor],
  );
  const currentNodes = useMemo(
    () => nodes.filter((node) => node.floor === selectedFloor),
    [nodes, selectedFloor],
  );
  const currentEdgeNodeIds = new Set(currentNodes.map((node) => node.id));
  const currentEdges = useMemo(
    () =>
      edges.filter((edge) => currentEdgeNodeIds.has(edge.from_node_id) || currentEdgeNodeIds.has(edge.to_node_id)),
    [edges, currentEdgeNodeIds],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) || null,
    [edges, selectedEdgeId],
  );
  const selectedKiosk = useMemo(
    () => kiosks.find((kiosk) => kiosk.id === selectedKioskId) || null,
    [kiosks, selectedKioskId],
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.key === selectedCategoryKey) || null,
    [categories, selectedCategoryKey],
  );
  const categoryColors = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category, index) => {
      acc[category.key] = categoryColor(category.key, index);
      return acc;
    }, {});
  }, [categories]);

  const filteredNodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return currentNodes;
    return currentNodes.filter((node) => {
      const category = categories.find((item) => item.key === node.node_type);
      return (
        node.name.toLowerCase().includes(term) ||
        node.node_type.toLowerCase().includes(term) ||
        category?.label.toLowerCase().includes(term) ||
        String(node.id).includes(term)
      );
    });
  }, [currentNodes, search, categories]);

  const routePairs = useMemo(() => pathPairs(routeResult?.path || []), [routeResult]);

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    if (message?.kind === "success") {
      const timer = window.setTimeout(() => setMessage(null), 2400);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  async function refreshAll() {
    setLoading(true);
    try {
      const [nodesResponse, edgesResponse, kiosksResponse, categoriesResponse, floorMapsResponse] =
        await Promise.all([
          getNodes({ include_hidden: true }),
          getEdges(),
          getKiosks(),
          getNodeCategories(),
          getFloorMaps(),
        ]);

      setNodes(nodesResponse);
      setEdges(edgesResponse);
      setKiosks(kiosksResponse);
      setCategories(categoriesResponse);
      setFloors(floorMapsResponse.length > 0 ? floorMapsResponse : [{ floor: 1, image_data_url: EMPTY_MAP_SVG, original_width: 1800, original_height: 1200, map_width: 1800, map_height: 1200 }]);
      setSelectedFloor((current) => {
        const available = floorMapsResponse.length > 0 ? floorMapsResponse.map((item) => item.floor) : [1];
        return available.includes(current) ? current : available[0];
      });
      setMessage({ kind: "success", text: "Graph loaded successfully" });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to load data" });
    } finally {
      setLoading(false);
    }
  }

  function pushHistory(nextNodes: NodeResponse[], nextEdges: EdgeResponse[]) {
    setHistory((current) => [...current.slice(-19), { nodes, edges }]);
    setFuture([]);
    setNodes(nextNodes);
    setEdges(nextEdges);
  }

  function undo() {
    setHistory((current) => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      setFuture((futureCurrent) => [{ nodes, edges }, ...futureCurrent]);
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setMessage({ kind: "info", text: "Undo applied" });
      return current.slice(0, -1);
    });
  }

  function redo() {
    setFuture((current) => {
      const next = current[0];
      if (!next) return current;
      setHistory((historyCurrent) => [...historyCurrent, { nodes, edges }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      setMessage({ kind: "info", text: "Redo applied" });
      return current.slice(1);
    });
  }

  async function handleSaveNode(payload: NodeCreatePayload | NodeUpdatePayload, nodeId?: number) {
    const cleanPayload = sanitizeNodePayload(payload);
    if (nodeId) {
      await updateNode(nodeId, cleanPayload);
    } else {
      await createNode(cleanPayload as NodeCreatePayload);
    }
    await refreshAll();
  }

  async function handleSaveEdge(payload: { from_node_id: number; to_node_id: number; weight: number; is_bidirectional?: boolean; is_hidden?: boolean }, edgeId?: number) {
    if (edgeId) {
      await updateEdge(edgeId, payload);
    } else {
      await createEdge(payload);
    }
    await refreshAll();
  }

  async function handleSaveCategory(payload: NodeCategoryPayload, key?: string) {
    if (key) {
      await updateNodeCategory(key, payload);
    } else {
      await createNodeCategory(payload);
    }
    await refreshAll();
  }

  async function handleSaveKiosk(payload: any, kioskId?: number) {
    const normalizedPayload = {
      kiosk_code: payload.kiosk_code,
      name: payload.name || null,
      floor: Number(payload.floor),
      x: Number(payload.x),
      y: Number(payload.y),
      ...(kioskId ? {} : { create_node: true }),
    };
    if (kioskId) {
      await updateKiosk(kioskId, normalizedPayload);
    } else {
      await createKiosk(normalizedPayload);
    }
    await refreshAll();
  }

  async function handleNodeActionDelete(nodeId: number) {
    pushHistory(nodes, edges);
    await deleteNode(nodeId);
    setSelectedNodeId(null);
    await refreshAll();
  }

  async function handleEdgeActionDelete(edgeId: number) {
    pushHistory(nodes, edges);
    await deleteEdge(edgeId);
    setSelectedEdgeId(null);
    await refreshAll();
  }

  async function handleKioskDelete(kioskId: number) {
    await deleteKiosk(kioskId);
    setSelectedKioskId(null);
    await refreshAll();
  }

  async function handleCategoryDelete(key: string) {
    if (isBaseCategory(key)) {
      setMessage({ kind: "error", text: "Base categories cannot be deleted" });
      return;
    }
    await deleteNodeCategory(key);
    setSelectedCategoryKey(null);
    await refreshAll();
  }

  async function handleSaveGraph() {
    if (!currentFloorMap) {
      setMessage({ kind: "error", text: "No floor map to save" });
      return;
    }

    setLoading(true);
    try {
      await saveFloorMap(selectedFloor, currentFloorMap);
      await refreshAll();
      setMessage({ kind: "success", text: "Graph and uploaded map saved" });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save graph" });
    } finally {
      setLoading(false);
    }
  }

  async function handleFloorDelete(floor: number) {
    await deleteFloorMap(floor);
    if (selectedFloor === floor) {
      setSelectedFloor(1);
    }
    await refreshAll();
  }

  function selectNode(node: NodeResponse) {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setSelectedKioskId(null);
    setSelectedCategoryKey(null);
  }

  function selectEdge(edge: EdgeResponse) {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setSelectedKioskId(null);
    setSelectedCategoryKey(null);
  }

  function handleCanvasBackgroundClick(point: Point) {
    if (mode === "add-node") {
      setDialog({ type: "node", mode: "create", point });
      return;
    }
    if (mode === "add-kiosk") {
      setDialog({ type: "kiosk", mode: "create", point });
      return;
    }
    if (mode === "select") {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setSelectedKioskId(null);
      setSelectedCategoryKey(null);
    }
  }

  const routePath = routeResult?.path || [];
  const highlightedNodeIds = new Set(routePath);

  return (
    <div className="admin-layout">
      <aside className="panel left-panel">
        <section className="panel-section">
          <div className="section-title-row">
            <h2>Floors</h2>
            <button className="small-button" id="btn-add-floor" onClick={() => setDialog({ type: "floor", mode: "create" })}>
              + Floor
            </button>
          </div>
          <div className="row-gap">
            {floors
              .slice()
              .sort((a, b) => a.floor - b.floor)
              .map((floor) => (
                <button
                  key={floor.floor}
                  className={`chip-button ${selectedFloor === floor.floor ? "active" : ""}`}
                  onClick={() => setSelectedFloor(floor.floor)}
                >
                  Floor {floor.floor}
                </button>
              ))}
          </div>
          <div className="row-gap">
            <label className="field-label">Upload / replace floor map</label>
            <input
              id="map-upload"
              type="file"
              accept="image/*"
              onChange={async (event: any) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const imageDataUrl = await readFileAsDataUrl(file);
                const dimensions = await readImageDimensions(imageDataUrl);
                const payload: FloorMapPayload = {
                  floor: selectedFloor,
                  image_data_url: imageDataUrl,
                  original_width: dimensions.width,
                  original_height: dimensions.height,
                  map_width: dimensions.width,
                  map_height: dimensions.height,
                };
                await saveFloorMap(selectedFloor, payload);
                await refreshAll();
              }}
            />
            <div className="row-gap">
              <button
                className="secondary-button"
                id="btn-reset-map"
                onClick={async () => {
                  if (!currentFloorMap) return;
                  await saveFloorMap(selectedFloor, {
                    ...currentFloorMap,
                    map_width: currentFloorMap.original_width,
                    map_height: currentFloorMap.original_height,
                  });
                  await refreshAll();
                }}
              >
                Reset Size
              </button>
              <button
                className="secondary-button"
                onClick={() => setTransform({ scale: 1, panX: 0, panY: 0 })}
              >
                Reset View
              </button>
            </div>
          </div>
        </section>

        <section className="panel-section">
          <div className="section-title-row">
            <h2>Modes</h2>
            <span className="section-badge">{mode.replace("-", " ")}</span>
          </div>
          <div className="mode-grid">
            {[
              ["select", "Select"],
              ["add-node", "Add Node"],
              ["add-kiosk", "Add Kiosk"],
              ["move-node", "Move"],
              ["add-edge", "Add Edge"],
              ["delete", "Delete"],
              ["hide", "Hide"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`mode-button ${mode === value ? "active" : ""}`}
                onClick={() => setMode(value as EditorMode)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="row-gap">
            <button className="secondary-button" onClick={() => setTransform((current) => ({ ...current, scale: Math.max(0.35, current.scale - 0.1) }))}>Zoom -</button>
            <button className="secondary-button" onClick={() => setTransform((current) => ({ ...current, scale: Math.min(2.5, current.scale + 0.1) }))}>Zoom +</button>
            <button className="ghost-button" onClick={undo} disabled={history.length === 0}>
              Undo
            </button>
            <button className="ghost-button" onClick={redo} disabled={future.length === 0}>
              Redo
            </button>
          </div>
        </section>

        <section className="panel-section">
          <div className="section-title-row">
            <h2>Search Nodes</h2>
            <button className="ghost-button" id="btn-refresh" onClick={refreshAll}>
              Refresh
            </button>
          </div>
          <input
            id="search-input"
            className="text-input"
            value={search}
            onChange={(event: any) => setSearch(event.target.value)}
            placeholder="Search by node, type, or category"
          />
          <div className="category-legend">
            {categories.map((category, index) => (
              <span key={category.key} className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: categoryColors[category.key] || categoryColor(category.key, index) }}
                />
                {category.label}
              </span>
            ))}
          </div>
          <div className="scroll-list">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                className={`list-item ${search.trim() ? "search-match" : ""} ${selectedNodeId === node.id ? "active" : ""} ${node.is_hidden ? "muted" : ""}`}
                onClick={() => selectNode(node)}
              >
                <strong>{node.name}</strong>
                <span>
                  #{node.id} • Floor {node.floor} • {node.node_type}
                </span>
              </button>
            ))}
            {filteredNodes.length === 0 ? <div className="empty-state">No nodes on this floor.</div> : null}
          </div>
        </section>
      </aside>

      <main className="workspace">
        <div className="workspace-tabs">
          {[
            ["map", "Map Editor"],
            ["categories", "Categories"],
            ["kiosks", "Kiosks"],
            ["route", "Route Tester"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab as AdminTab)}
            >
              {label}
            </button>
          ))}
        </div>

        <MapEditorCanvas
          floorMap={currentFloorMap}
          nodes={currentNodes}
          edges={currentEdges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          categoryColors={categoryColors}
          mode={mode}
          transform={transform}
          routePath={routePath}
          onTransformChange={(next) => setTransform((current) => ({ ...current, ...next }))}
          onBackgroundClick={handleCanvasBackgroundClick}
          onNodeClick={(node) => {
            if (mode === "delete") {
              void handleNodeActionDelete(node.id);
              return;
            }
            if (mode === "hide") {
              void handleSaveNode({ is_hidden: !node.is_hidden }, node.id);
              return;
            }
            if (mode === "add-edge") {
              const current = selectedNodeId;
              if (current == null) {
                setMessage({ kind: "info", text: `Start edge from ${node.name}` });
                setSelectedNodeId(node.id);
                return;
              }
              if (current === node.id) {
                setMessage({ kind: "error", text: "Choose a different node to complete the edge" });
                return;
              }
              const from = nodes.find((item) => item.id === current);
              if (!from) return;
              const weight = euclideanWeight({ x: from.x, y: from.y }, { x: node.x, y: node.y });
              setDialog({ type: "edge", mode: "create", defaultWeight: weight });
              setSelectedEdgeId(null);
              setSelectedKioskId(null);
              setSelectedCategoryKey(null);
              (window as any).__pendingEdge = { from_node_id: current, to_node_id: node.id, weight };
              return;
            }
            selectNode(node);
          }}
          onNodeMove={(nodeId, point) => {
            setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, x: point.x, y: point.y } : node)));
          }}
          onNodeMoveEnd={(nodeId, point) => {
            void updateNode(nodeId, { x: point.x, y: point.y }).then(refreshAll).catch((error) => {
              setMessage({ kind: "error", text: error instanceof Error ? error.message : "Failed to move node" });
            });
          }}
          onEdgeClick={(edge) => {
            if (mode === "delete") {
              void handleEdgeActionDelete(edge.id);
              return;
            }
            selectEdge(edge);
          }}
        />

        <div className="status-bar">
          <span>Nodes: {currentNodes.length}</span>
          <span>Edges: {currentEdges.length}</span>
          <span>Mode: {mode}</span>
          <span>Floor: {selectedFloor}</span>
          <span>Zoom: {Math.round(transform.scale * 100)}%</span>
          <button className="save-graph-button" id="btn-save-graph" onClick={() => void handleSaveGraph()}>
            Save Graph
          </button>
        </div>

        {message ? <div className={`toast ${message.kind}`}>{message.text}</div> : null}
      </main>

      <aside className="panel right-panel">
        {activeTab === "map" ? (
          <>
            <div className="panel-section">
              <div className="section-title-row">
                <h2>Inspector</h2>
                <button className="small-button" id="btn-add-node" onClick={() => setDialog({ type: "node", mode: "create" })}>
                  + Node
                </button>
              </div>
              {selectedNode ? (
                <InspectorNode
                  node={selectedNode}
                  categories={categories}
                  onSave={async (payload) => {
                    await handleSaveNode(payload, selectedNode.id);
                    await refreshAll();
                  }}
                  onDelete={() => void handleNodeActionDelete(selectedNode.id)}
                  onOpenDialog={() => setDialog({ type: "node", mode: "edit", node: selectedNode })}
                />
              ) : selectedEdge ? (
                <InspectorEdge
                  edge={selectedEdge}
                  nodes={nodes}
                  onSave={async (payload) => {
                    await handleSaveEdge(payload, selectedEdge.id);
                    await refreshAll();
                  }}
                  onDelete={() => void handleEdgeActionDelete(selectedEdge.id)}
                />
              ) : selectedKiosk ? (
                <InspectorKiosk
                  kiosk={selectedKiosk}
                  onSave={async (payload) => {
                    await handleSaveKiosk(payload, selectedKiosk.id);
                    await refreshAll();
                  }}
                  onDelete={() => void handleKioskDelete(selectedKiosk.id)}
                />
              ) : selectedCategory ? (
                <InspectorCategory
                  category={selectedCategory}
                  onSave={async (payload) => {
                    await handleSaveCategory(payload, selectedCategory.key);
                    await refreshAll();
                  }}
                  onDelete={() => void handleCategoryDelete(selectedCategory.key)}
                />
              ) : (
                <div className="empty-state">Select a node, edge, kiosk, or category to inspect it.</div>
              )}
            </div>
          </>
        ) : null}

        {activeTab === "categories" ? (
          <AdminCategoriesTab
            categories={categories}
            selectedKey={selectedCategoryKey}
            onSelect={(key) => setSelectedCategoryKey(key)}
            onCreate={() => setDialog({ type: "category", mode: "create" })}
            onEdit={(category) => setDialog({ type: "category", mode: "edit", category })}
            onDelete={(key) => void handleCategoryDelete(key)}
            onRefresh={refreshAll}
          />
        ) : null}

        {activeTab === "kiosks" ? (
          <AdminKiosksTab
            kiosks={kiosks}
            nodes={nodes}
            selectedId={selectedKioskId}
            onSelect={(id) => setSelectedKioskId(id)}
            onCreate={() => setDialog({ type: "kiosk", mode: "create" })}
            onEdit={(kiosk) => setDialog({ type: "kiosk", mode: "edit", kiosk })}
            onDelete={(id) => void handleKioskDelete(id)}
            onRefresh={refreshAll}
          />
        ) : null}

        {activeTab === "route" ? (
          <AdminRouteTester
            kiosks={kiosks}
            nodes={nodes}
            routeStartKioskId={routeStartKioskId}
            routeDestinationId={routeDestinationId}
            wheelchairAccessible={wheelchairAccessible}
            routeResult={routeResult}
            onRouteStartKioskChange={setRouteStartKioskId}
            onRouteDestinationChange={setRouteDestinationId}
            onWheelchairChange={setWheelchairAccessible}
            onTest={async () => {
              if (!routeDestinationId) {
                setMessage({ kind: "error", text: "Select a destination first" });
                return;
              }
              try {
                setLoading(true);
                const result = await calculateRoute({
                  start_kiosk_id: routeStartKioskId ? Number(routeStartKioskId) : null,
                  destination_node_id: Number(routeDestinationId),
                  wheelchair_accessible: wheelchairAccessible,
                });
                setRouteResult(result);
                setMessage({ kind: "success", text: "Route calculated successfully" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Route calculation failed" });
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : null}
      </aside>

      <Modal
        open={dialog.type !== "none"}
        title={
          dialog.type === "node"
            ? dialog.mode === "create"
              ? "Create Node"
              : "Edit Node"
            : dialog.type === "edge"
              ? dialog.mode === "create"
                ? "Create Edge"
                : "Edit Edge"
              : dialog.type === "category"
                ? dialog.mode === "create"
                  ? "Create Category"
                  : "Edit Category"
                : dialog.type === "kiosk"
                  ? dialog.mode === "create"
                    ? "Create Kiosk"
                    : "Edit Kiosk"
                  : dialog.type === "floor"
                    ? dialog.mode === "create"
                      ? "Add Floor Map"
                      : "Edit Floor Map"
                    : "Dialog"
        }
        onClose={() => setDialog({ type: "none" })}
        width={dialog.type === "floor" ? 760 : 680}
        footer={null}
      >
        {dialog.type === "node" ? (
          <NodeDialog
            categories={categories}
            node={dialog.node}
            floor={selectedFloor}
            point={dialog.point}
            onCancel={() => setDialog({ type: "none" })}
            onSave={async (payload) => {
              try {
                setLoading(true);
                await handleSaveNode(payload, dialog.node?.id);
                setDialog({ type: "none" });
                setMessage({ kind: "success", text: dialog.node ? "Node updated" : "Node created" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save node" });
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : null}
        {dialog.type === "edge" ? (
          <EdgeDialog
            edge={dialog.edge}
            defaultWeight={dialog.defaultWeight}
            nodes={nodes}
            onCancel={() => setDialog({ type: "none" })}
            onSave={async (payload) => {
              try {
                setLoading(true);
                let finalPayload = payload;
                if (dialog.mode === "create" && (window as any).__pendingEdge) {
                  finalPayload = { ...(window as any).__pendingEdge, ...payload };
                }
                await handleSaveEdge(finalPayload, dialog.edge?.id);
                setDialog({ type: "none" });
                (window as any).__pendingEdge = undefined;
                setMessage({ kind: "success", text: dialog.edge ? "Edge updated" : "Edge created" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save edge" });
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : null}
        {dialog.type === "category" ? (
          <CategoryDialog
            category={dialog.category}
            onCancel={() => setDialog({ type: "none" })}
            onSave={async (payload) => {
              try {
                setLoading(true);
                await handleSaveCategory(payload, dialog.category?.key);
                setDialog({ type: "none" });
                setMessage({ kind: "success", text: dialog.category ? "Category updated" : "Category created" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save category" });
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : null}
        {dialog.type === "kiosk" ? (
          <KioskDialog
            kiosk={dialog.kiosk}
            floor={selectedFloor}
            point={dialog.point}
            onCancel={() => setDialog({ type: "none" })}
            onSave={async (payload) => {
              try {
                setLoading(true);
                await handleSaveKiosk(payload, dialog.kiosk?.id);
                setDialog({ type: "none" });
                setMessage({ kind: "success", text: dialog.kiosk ? "Kiosk updated" : "Kiosk created" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save kiosk" });
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : null}
        {dialog.type === "floor" ? (
          <FloorDialog
            floor={dialog.floor}
            onCancel={() => setDialog({ type: "none" })}
            onSave={async (payload) => {
              try {
                setLoading(true);
                await saveFloorMap(payload.floor, payload);
                setDialog({ type: "none" });
                await refreshAll();
                setMessage({ kind: "success", text: "Floor map saved" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save floor map" });
              } finally {
                setLoading(false);
              }
            }}
            onDelete={dialog.floor ? async () => {
              try {
                setLoading(true);
                await handleFloorDelete(dialog.floor!.floor);
                setDialog({ type: "none" });
                setMessage({ kind: "success", text: "Floor map deleted" });
              } catch (error) {
                setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to delete floor map" });
              } finally {
                setLoading(false);
              }
            } : undefined}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function InspectorNode({
  node,
  categories,
  onSave,
  onDelete,
  onOpenDialog,
}: {
  node: NodeResponse;
  categories: NodeCategoryResponse[];
  onSave: (payload: NodeUpdatePayload) => Promise<void>;
  onDelete: () => void;
  onOpenDialog: () => void;
}) {
  const [form, setForm] = useState<NodeUpdatePayload>({
    name: node.name,
    node_type: node.node_type,
    floor: node.floor,
    x: node.x,
    y: node.y,
    description: node.description || "",
    environment_description: node.environment_description || "",
    image_description: node.image_description || "",
    image_url: node.image_url || "",
    kiosk_code: node.kiosk_code || "",
    service_floor_from: node.service_floor_from ?? undefined,
    service_floor_to: node.service_floor_to ?? undefined,
    use_when_floor_distance: node.use_when_floor_distance ?? undefined,
    supports_wheelchair: node.supports_wheelchair,
    is_hidden: node.is_hidden,
  });

  useEffect(() => {
    setForm({
      name: node.name,
      node_type: node.node_type,
      floor: node.floor,
      x: node.x,
      y: node.y,
      description: node.description || "",
      environment_description: node.environment_description || "",
      image_description: node.image_description || "",
      image_url: node.image_url || "",
      kiosk_code: node.kiosk_code || "",
      service_floor_from: node.service_floor_from ?? undefined,
      service_floor_to: node.service_floor_to ?? undefined,
      use_when_floor_distance: node.use_when_floor_distance ?? undefined,
      supports_wheelchair: node.supports_wheelchair,
      is_hidden: node.is_hidden,
    });
  }, [node]);

  const typeOptions = categories.filter((category) => !category.is_hidden);
  const showKioskCode = isKioskNodeType(form.node_type);
  const showServiceFloorTo = isElevatorNodeType(form.node_type) || isEscalatorNodeType(form.node_type);
  const showUseWhenFloorDistance = isEscalatorNodeType(form.node_type);
  const updateNodeType = (nodeType: string) => {
    setForm((current) => sanitizeNodePayload({ ...current, node_type: nodeType }));
  };

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Name">
          <input className="text-input" value={form.name || ""} onChange={(e: any) => setForm((current) => ({ ...current, name: e.target.value }))} />
        </Field>
        <Field label="Type">
          <select className="text-input" value={form.node_type || ""} onChange={(e: any) => updateNodeType(e.target.value)}>
            {typeOptions.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Floor">
          <input className="text-input" type="number" value={form.floor ?? 0} onChange={(e: any) => setForm((current) => ({ ...current, floor: Number(e.target.value) }))} />
        </Field>
        <Field label="X">
          <input className="text-input" type="number" value={form.x ?? 0} onChange={(e: any) => setForm((current) => ({ ...current, x: Number(e.target.value) }))} />
        </Field>
        <Field label="Y">
          <input className="text-input" type="number" value={form.y ?? 0} onChange={(e: any) => setForm((current) => ({ ...current, y: Number(e.target.value) }))} />
        </Field>
        {showKioskCode ? (
          <Field label="Kiosk code">
            <input className="text-input" value={form.kiosk_code || ""} onChange={(e: any) => setForm((current) => ({ ...current, kiosk_code: e.target.value }))} />
          </Field>
        ) : null}
      </div>
      <Field label="Environment description">
        <textarea className="text-input" rows={3} value={form.environment_description || ""} onChange={(e: any) => setForm((current) => ({ ...current, environment_description: e.target.value }))} />
      </Field>
      <Field label="Node description">
        <textarea className="text-input" rows={3} value={form.description || ""} onChange={(e: any) => setForm((current) => ({ ...current, description: e.target.value }))} />
      </Field>
      <Field label="Image description">
        <textarea className="text-input" rows={2} value={form.image_description || ""} onChange={(e: any) => setForm((current) => ({ ...current, image_description: e.target.value }))} />
      </Field>
      <Field label="Image URL">
        <input className="text-input" value={form.image_url || ""} onChange={(e: any) => setForm((current) => ({ ...current, image_url: e.target.value }))} />
      </Field>
      <div className="field-grid">
        {showServiceFloorTo ? (
          <Field label="Service floor to">
            <input className="text-input" type="number" value={form.service_floor_to ?? ""} onChange={(e: any) => setForm((current) => ({ ...current, service_floor_to: e.target.value ? Number(e.target.value) : undefined }))} />
          </Field>
        ) : null}
        {showUseWhenFloorDistance ? (
          <Field label="Use when floor distance">
            <input className="text-input" type="number" value={form.use_when_floor_distance ?? ""} onChange={(e: any) => setForm((current) => ({ ...current, use_when_floor_distance: e.target.value ? Number(e.target.value) : undefined }))} />
          </Field>
        ) : null}
        <label className="checkbox-row">
          <input type="checkbox" checked={!!form.supports_wheelchair} onChange={(e: any) => setForm((current) => ({ ...current, supports_wheelchair: e.target.checked }))} />
          <span>Wheelchair accessible</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={!!form.is_hidden} onChange={(e: any) => setForm((current) => ({ ...current, is_hidden: e.target.checked }))} />
          <span>Hidden</span>
        </label>
      </div>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="secondary-button" onClick={onOpenDialog}>Open dialog</button>
        <button className="ghost-button" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function InspectorEdge({
  edge,
  nodes,
  onSave,
  onDelete,
}: {
  edge: EdgeResponse;
  nodes: NodeResponse[];
  onSave: (payload: { from_node_id: number; to_node_id: number; weight: number; is_bidirectional: boolean; is_hidden: boolean }) => Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState({
    from_node_id: edge.from_node_id,
    to_node_id: edge.to_node_id,
    weight: edge.weight,
    is_bidirectional: edge.is_bidirectional,
    is_hidden: edge.is_hidden,
  });

  useEffect(() => {
    setForm({
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      weight: edge.weight,
      is_bidirectional: edge.is_bidirectional,
      is_hidden: edge.is_hidden,
    });
  }, [edge]);

  return (
    <div className="form-stack">
      <Field label="From node">
        <select className="text-input" value={form.from_node_id} onChange={(e: any) => setForm((current) => ({ ...current, from_node_id: Number(e.target.value) }))}>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>{node.name}</option>
          ))}
        </select>
      </Field>
      <Field label="To node">
        <select className="text-input" value={form.to_node_id} onChange={(e: any) => setForm((current) => ({ ...current, to_node_id: Number(e.target.value) }))}>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>{node.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Weight">
        <input className="text-input" type="number" step="0.01" value={form.weight} onChange={(e: any) => setForm((current) => ({ ...current, weight: Number(e.target.value) }))} />
      </Field>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.is_bidirectional} onChange={(e: any) => setForm((current) => ({ ...current, is_bidirectional: e.target.checked }))} />
        <span>Bidirectional</span>
      </label>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.is_hidden} onChange={(e: any) => setForm((current) => ({ ...current, is_hidden: e.target.checked }))} />
        <span>Hidden</span>
      </label>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="ghost-button" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function InspectorCategory({
  category,
  onSave,
  onDelete,
}: {
  category: NodeCategoryResponse;
  onSave: (payload: NodeCategoryPayload) => Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<NodeCategoryPayload>({
    key: category.key,
    label: category.label,
    image_url: category.image_url || "",
    is_hidden: category.is_hidden,
  });

  useEffect(() => {
    setForm({
      key: category.key,
      label: category.label,
      image_url: category.image_url || "",
      is_hidden: category.is_hidden,
    });
  }, [category]);

  return (
    <div className="form-stack">
      <Field label="Key">
        <input className="text-input" value={form.key} disabled />
      </Field>
      <Field label="Label">
        <input className="text-input" value={form.label} onChange={(e: any) => setForm((current) => ({ ...current, label: e.target.value }))} />
      </Field>
      <Field label="Image URL">
        <input className="text-input" value={form.image_url || ""} onChange={(e: any) => setForm((current) => ({ ...current, image_url: e.target.value }))} />
      </Field>
      <label className="checkbox-row">
        <input type="checkbox" checked={!!form.is_hidden} onChange={(e: any) => setForm((current) => ({ ...current, is_hidden: e.target.checked }))} />
        <span>Hidden</span>
      </label>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="ghost-button" onClick={onDelete} disabled={isBaseCategory(category.key)}>Delete</button>
      </div>
    </div>
  );
}

function InspectorKiosk({
  kiosk,
  onSave,
  onDelete,
}: {
  kiosk: KioskResponse;
  onSave: (payload: any) => Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<any>({
    kiosk_code: kiosk.kiosk_code,
    name: kiosk.name || "",
    floor: kiosk.floor,
    x: kiosk.x,
    y: kiosk.y,
  });

  useEffect(() => {
    setForm({
      kiosk_code: kiosk.kiosk_code,
      name: kiosk.name || "",
      floor: kiosk.floor,
      x: kiosk.x,
      y: kiosk.y,
    });
  }, [kiosk]);

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Kiosk code">
          <input className="text-input" value={form.kiosk_code} onChange={(e: any) => setForm((current: any) => ({ ...current, kiosk_code: e.target.value }))} />
        </Field>
        <Field label="Name">
          <input className="text-input" value={form.name} onChange={(e: any) => setForm((current: any) => ({ ...current, name: e.target.value }))} />
        </Field>
        <Field label="Floor">
          <input className="text-input" type="number" value={form.floor} onChange={(e: any) => setForm((current: any) => ({ ...current, floor: Number(e.target.value) }))} />
        </Field>
        <Field label="X">
          <input className="text-input" type="number" value={form.x} onChange={(e: any) => setForm((current: any) => ({ ...current, x: Number(e.target.value) }))} />
        </Field>
        <Field label="Y">
          <input className="text-input" type="number" value={form.y} onChange={(e: any) => setForm((current: any) => ({ ...current, y: Number(e.target.value) }))} />
        </Field>
      </div>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="ghost-button" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function FloorDialog({
  floor,
  onCancel,
  onSave,
  onDelete,
}: {
  floor?: FloorMapResponse;
  onCancel: () => void;
  onSave: (payload: FloorMapPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState<FloorMapPayload>(
    floor || {
      floor: 1,
      image_data_url: EMPTY_MAP_SVG,
      original_width: 1800,
      original_height: 1200,
      map_width: 1800,
      map_height: 1200,
    },
  );

  useEffect(() => {
    setForm(
      floor || {
        floor: 1,
        image_data_url: EMPTY_MAP_SVG,
        original_width: 1800,
        original_height: 1200,
        map_width: 1800,
        map_height: 1200,
      },
    );
  }, [floor]);

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Floor">
          <input className="text-input" type="number" value={form.floor} onChange={(e: any) => setForm((current) => ({ ...current, floor: Number(e.target.value) }))} />
        </Field>
        <Field label="Original width">
          <input className="text-input" type="number" value={form.original_width} onChange={(e: any) => setForm((current) => ({ ...current, original_width: Number(e.target.value) }))} />
        </Field>
        <Field label="Original height">
          <input className="text-input" type="number" value={form.original_height} onChange={(e: any) => setForm((current) => ({ ...current, original_height: Number(e.target.value) }))} />
        </Field>
        <Field label="Map width">
          <input className="text-input" type="number" value={form.map_width} onChange={(e: any) => setForm((current) => ({ ...current, map_width: Number(e.target.value) }))} />
        </Field>
        <Field label="Map height">
          <input className="text-input" type="number" value={form.map_height} onChange={(e: any) => setForm((current) => ({ ...current, map_height: Number(e.target.value) }))} />
        </Field>
      </div>
      <Field label="Image data URL">
        <textarea className="text-input" rows={5} value={form.image_data_url} onChange={(e: any) => setForm((current) => ({ ...current, image_data_url: e.target.value }))} />
      </Field>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        {onDelete ? <button className="ghost-button" onClick={() => void onDelete()}>Delete</button> : null}
        <button className="secondary-button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NodeDialog({
  categories,
  node,
  floor,
  point,
  onCancel,
  onSave,
}: {
  categories: NodeCategoryResponse[];
  node?: NodeResponse;
  floor: number;
  point?: Point;
  onCancel: () => void;
  onSave: (payload: NodeCreatePayload) => Promise<void>;
}) {
  const defaultType = categories.find((item) => !item.is_hidden)?.key || "waypoint";
  const [form, setForm] = useState<NodeCreatePayload>({
    name: node?.name || "New node",
    node_type: node?.node_type || defaultType,
    floor: node?.floor || floor,
    x: node?.x ?? point?.x ?? 100,
    y: node?.y ?? point?.y ?? 100,
    description: node?.description || "",
    environment_description: node?.environment_description || "",
    image_description: node?.image_description || "",
    image_url: node?.image_url || "",
    kiosk_code: node?.kiosk_code || "",
    service_floor_from: node?.service_floor_from ?? undefined,
    service_floor_to: node?.service_floor_to ?? undefined,
    use_when_floor_distance: node?.use_when_floor_distance ?? undefined,
    supports_wheelchair: node?.supports_wheelchair || false,
    is_hidden: node?.is_hidden || false,
  });

  useEffect(() => {
    setForm({
      name: node?.name || "New node",
      node_type: node?.node_type || defaultType,
      floor: node?.floor || floor,
      x: node?.x ?? point?.x ?? 100,
      y: node?.y ?? point?.y ?? 100,
      description: node?.description || "",
      environment_description: node?.environment_description || "",
      image_description: node?.image_description || "",
      image_url: node?.image_url || "",
      kiosk_code: node?.kiosk_code || "",
      service_floor_from: node?.service_floor_from ?? undefined,
      service_floor_to: node?.service_floor_to ?? undefined,
      use_when_floor_distance: node?.use_when_floor_distance ?? undefined,
      supports_wheelchair: node?.supports_wheelchair || false,
      is_hidden: node?.is_hidden || false,
    });
  }, [defaultType, floor, node, point]);

  const showKioskCode = isKioskNodeType(form.node_type);
  const showServiceFloorTo = isElevatorNodeType(form.node_type) || isEscalatorNodeType(form.node_type);
  const showUseWhenFloorDistance = isEscalatorNodeType(form.node_type);
  const updateNodeType = (nodeType: string) => {
    setForm((current) => sanitizeNodePayload({ ...current, node_type: nodeType }));
  };

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Name">
          <input className="text-input" value={form.name} onChange={(e: any) => setForm((current) => ({ ...current, name: e.target.value }))} />
        </Field>
        <Field label="Type">
          <select className="text-input" value={form.node_type} onChange={(e: any) => updateNodeType(e.target.value)}>
            {categories.filter((item) => !item.is_hidden).map((category) => (
              <option key={category.key} value={category.key}>{category.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Floor">
          <input className="text-input" type="number" value={form.floor} onChange={(e: any) => setForm((current) => ({ ...current, floor: Number(e.target.value) }))} />
        </Field>
        <Field label="X">
          <input className="text-input" type="number" value={form.x} onChange={(e: any) => setForm((current) => ({ ...current, x: Number(e.target.value) }))} />
        </Field>
        <Field label="Y">
          <input className="text-input" type="number" value={form.y} onChange={(e: any) => setForm((current) => ({ ...current, y: Number(e.target.value) }))} />
        </Field>
        {showKioskCode ? (
          <Field label="Kiosk code">
            <input className="text-input" value={form.kiosk_code || ""} onChange={(e: any) => setForm((current) => ({ ...current, kiosk_code: e.target.value }))} />
          </Field>
        ) : null}
      </div>
      <Field label="Environment description">
        <textarea className="text-input" rows={3} value={form.environment_description || ""} onChange={(e: any) => setForm((current) => ({ ...current, environment_description: e.target.value }))} />
      </Field>
      <Field label="Node description">
        <textarea className="text-input" rows={3} value={form.description || ""} onChange={(e: any) => setForm((current) => ({ ...current, description: e.target.value }))} />
      </Field>
      <Field label="Image description">
        <textarea className="text-input" rows={2} value={form.image_description || ""} onChange={(e: any) => setForm((current) => ({ ...current, image_description: e.target.value }))} />
      </Field>
      <Field label="Image URL">
        <input className="text-input" value={form.image_url || ""} onChange={(e: any) => setForm((current) => ({ ...current, image_url: e.target.value }))} />
      </Field>
      <div className="field-grid">
        {showServiceFloorTo ? (
          <Field label="Service floor to">
            <input className="text-input" type="number" value={form.service_floor_to ?? ""} onChange={(e: any) => setForm((current) => ({ ...current, service_floor_to: e.target.value ? Number(e.target.value) : undefined }))} />
          </Field>
        ) : null}
        {showUseWhenFloorDistance ? (
          <Field label="Use when floor distance">
            <input className="text-input" type="number" value={form.use_when_floor_distance ?? ""} onChange={(e: any) => setForm((current) => ({ ...current, use_when_floor_distance: e.target.value ? Number(e.target.value) : undefined }))} />
          </Field>
        ) : null}
      </div>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="secondary-button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function EdgeDialog({
  edge,
  defaultWeight,
  nodes,
  onCancel,
  onSave,
}: {
  edge?: EdgeResponse;
  defaultWeight?: number;
  nodes: NodeResponse[];
  onCancel: () => void;
  onSave: (payload: { from_node_id: number; to_node_id: number; weight: number; is_bidirectional: boolean; is_hidden: boolean }) => Promise<void>;
}) {
  const initial = {
    from_node_id: edge?.from_node_id || (window as any).__pendingEdge?.from_node_id || nodes[0]?.id || 0,
    to_node_id: edge?.to_node_id || (window as any).__pendingEdge?.to_node_id || nodes[1]?.id || nodes[0]?.id || 0,
    weight: edge?.weight || defaultWeight || 1,
    is_bidirectional: edge?.is_bidirectional ?? true,
    is_hidden: edge?.is_hidden ?? false,
  };
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [defaultWeight, edge, nodes]);

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="From node">
          <select className="text-input" value={form.from_node_id} onChange={(e: any) => setForm((current) => ({ ...current, from_node_id: Number(e.target.value) }))}>
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
        </Field>
        <Field label="To node">
          <select className="text-input" value={form.to_node_id} onChange={(e: any) => setForm((current) => ({ ...current, to_node_id: Number(e.target.value) }))}>
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
        </Field>
        <Field label="Weight">
          <input className="text-input" type="number" step="0.01" value={form.weight} onChange={(e: any) => setForm((current) => ({ ...current, weight: Number(e.target.value) }))} />
        </Field>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.is_bidirectional} onChange={(e: any) => setForm((current) => ({ ...current, is_bidirectional: e.target.checked }))} />
        <span>Bidirectional</span>
      </label>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.is_hidden} onChange={(e: any) => setForm((current) => ({ ...current, is_hidden: e.target.checked }))} />
        <span>Hidden</span>
      </label>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="secondary-button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function CategoryDialog({
  category,
  onCancel,
  onSave,
}: {
  category?: NodeCategoryResponse;
  onCancel: () => void;
  onSave: (payload: NodeCategoryPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<NodeCategoryPayload>({
    key: category?.key || "",
    label: category?.label || "",
    image_url: category?.image_url || "",
    is_hidden: category?.is_hidden || false,
  });

  useEffect(() => {
    setForm({
      key: category?.key || "",
      label: category?.label || "",
      image_url: category?.image_url || "",
      is_hidden: category?.is_hidden || false,
    });
  }, [category]);

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Key">
          <input className="text-input" value={form.key} disabled={!!category} onChange={(e: any) => setForm((current) => ({ ...current, key: e.target.value }))} />
        </Field>
        <Field label="Label">
          <input className="text-input" value={form.label} onChange={(e: any) => setForm((current) => ({ ...current, label: e.target.value }))} />
        </Field>
      </div>
      <Field label="Image URL">
        <input className="text-input" value={form.image_url || ""} onChange={(e: any) => setForm((current) => ({ ...current, image_url: e.target.value }))} />
      </Field>
      <label className="checkbox-row">
        <input type="checkbox" checked={!!form.is_hidden} onChange={(e: any) => setForm((current) => ({ ...current, is_hidden: e.target.checked }))} />
        <span>Hidden</span>
      </label>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="secondary-button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function KioskDialog({
  kiosk,
  floor,
  point,
  onCancel,
  onSave,
}: {
  kiosk?: KioskResponse;
  floor: number;
  point?: Point;
  onCancel: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState<any>({
    kiosk_code: kiosk?.kiosk_code || "",
    name: kiosk?.name || "",
    floor: kiosk?.floor || floor,
    x: kiosk?.x ?? point?.x ?? 100,
    y: kiosk?.y ?? point?.y ?? 100,
  });

  useEffect(() => {
    setForm({
      kiosk_code: kiosk?.kiosk_code || "",
      name: kiosk?.name || "",
      floor: kiosk?.floor || floor,
      x: kiosk?.x ?? point?.x ?? 100,
      y: kiosk?.y ?? point?.y ?? 100,
    });
  }, [floor, kiosk, point]);

  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Kiosk code">
          <input className="text-input" value={form.kiosk_code} onChange={(e: any) => setForm((current: any) => ({ ...current, kiosk_code: e.target.value }))} />
        </Field>
        <Field label="Name">
          <input className="text-input" value={form.name} onChange={(e: any) => setForm((current: any) => ({ ...current, name: e.target.value }))} />
        </Field>
        <Field label="Floor">
          <input className="text-input" type="number" value={form.floor} onChange={(e: any) => setForm((current: any) => ({ ...current, floor: Number(e.target.value) }))} />
        </Field>
        <Field label="X">
          <input className="text-input" type="number" value={form.x} onChange={(e: any) => setForm((current: any) => ({ ...current, x: Number(e.target.value) }))} />
        </Field>
        <Field label="Y">
          <input className="text-input" type="number" value={form.y} onChange={(e: any) => setForm((current: any) => ({ ...current, y: Number(e.target.value) }))} />
        </Field>
      </div>
      <div className="button-row">
        <button className="primary-button" onClick={() => onSave(form)}>Save</button>
        <button className="secondary-button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function AdminCategoriesTab({
  categories,
  selectedKey,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
}: {
  categories: NodeCategoryResponse[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onCreate: () => void;
  onEdit: (category: NodeCategoryResponse) => void;
  onDelete: (key: string) => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <div className="panel-section">
      <div className="section-title-row">
        <h2>Categories</h2>
        <div className="button-row">
          <button className="small-button" onClick={onCreate}>+ Category</button>
          <button className="ghost-button" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      <div className="scroll-list compact">
        {categories.map((category) => (
          <button
            key={category.key}
            className={`list-item ${selectedKey === category.key ? "active" : ""} ${category.is_hidden ? "muted" : ""}`}
            onClick={() => onSelect(category.key)}
          >
            <span className="category-list-row">
              {category.image_url ? <img className="category-list-image" src={category.image_url} alt="" /> : <span className="category-list-placeholder">{category.label.slice(0, 1).toUpperCase()}</span>}
              <strong>{category.label}</strong>
              {isBaseCategory(category.key) ? <em>Base</em> : null}
            </span>
            <span>
              {category.key} • {category.is_hidden ? "hidden" : "visible"}
            </span>
          </button>
        ))}
      </div>
      {selectedKey ? (
        <div className="button-row">
          <button className="secondary-button" onClick={() => onEdit(categories.find((item) => item.key === selectedKey)!)}>Edit</button>
          <button className="ghost-button" disabled={isBaseCategory(selectedKey)} onClick={() => onDelete(selectedKey)}>Delete</button>
        </div>
      ) : null}
    </div>
  );
}

function AdminKiosksTab({
  kiosks,
  nodes,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
}: {
  kiosks: KioskResponse[];
  nodes: NodeResponse[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onCreate: () => void;
  onEdit: (kiosk: KioskResponse) => void;
  onDelete: (id: number) => void;
  onRefresh: () => Promise<void>;
}) {
  const selectedKiosk = kiosks.find((item) => item.id === selectedId);

  return (
    <div className="panel-section">
      <div className="section-title-row">
        <h2>Kiosks</h2>
        <div className="button-row">
          <button className="small-button" onClick={onCreate}>+ Kiosk</button>
          <button className="ghost-button" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      <div className="scroll-list compact">
        {kiosks.map((kiosk) => (
          <button
            key={kiosk.id}
            className={`list-item ${selectedId === kiosk.id ? "active" : ""}`}
            onClick={() => onSelect(kiosk.id)}
          >
            <strong>{kiosk.kiosk_code}</strong>
            <span>
              {kiosk.name || "Unnamed"} • Floor {kiosk.floor} • node {kiosk.node_id ?? "—"}
            </span>
          </button>
        ))}
      </div>
      {selectedKiosk ? (
        <div className="button-row">
          <button className="secondary-button" onClick={() => onEdit(selectedKiosk)}>Edit</button>
          <button className="ghost-button" onClick={() => onDelete(selectedKiosk.id)}>Delete</button>
        </div>
      ) : null}
      <div className="caption">Known nodes: {nodes.length}</div>
    </div>
  );
}

function AdminRouteTester({
  kiosks,
  nodes,
  routeStartKioskId,
  routeDestinationId,
  wheelchairAccessible,
  routeResult,
  onRouteStartKioskChange,
  onRouteDestinationChange,
  onWheelchairChange,
  onTest,
}: {
  kiosks: KioskResponse[];
  nodes: NodeResponse[];
  routeStartKioskId: string;
  routeDestinationId: string;
  wheelchairAccessible: boolean;
  routeResult: RouteResponse | null;
  onRouteStartKioskChange: (value: string) => void;
  onRouteDestinationChange: (value: string) => void;
  onWheelchairChange: (value: boolean) => void;
  onTest: () => Promise<void>;
}) {
  return (
    <div className="panel-section">
      <div className="section-title-row">
        <h2>Route Tester</h2>
        <button className="small-button" onClick={onTest}>Run</button>
      </div>
      <div className="field-stack">
        <Field label="Start kiosk">
          <select className="text-input" value={routeStartKioskId} onChange={(e: any) => onRouteStartKioskChange(e.target.value)}>
            <option value="">Select kiosk</option>
            {kiosks.filter((kiosk) => kiosk.is_active && kiosk.node_id != null).map((kiosk) => (
              <option key={kiosk.id} value={kiosk.id}>{kiosk.kiosk_code} - {kiosk.name || "Start kiosk"}</option>
            ))}
          </select>
        </Field>
        <Field label="Destination node">
          <select className="text-input" value={routeDestinationId} onChange={(e: any) => onRouteDestinationChange(e.target.value)}>
            <option value="">Select destination</option>
            {nodes.filter((node) => !node.is_hidden && node.node_type !== "waypoint" && node.node_type !== "kiosk").map((node) => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
        </Field>
        <label className="checkbox-row">
          <input type="checkbox" checked={wheelchairAccessible} onChange={(e: any) => onWheelchairChange(e.target.checked)} />
          <span>Wheelchair accessible</span>
        </label>
      </div>

      {routeResult ? (
        <div className="route-result">
          <div className="route-summary">
            <strong>{routeResult.distance} m</strong>
            <span>{routeResult.path.length} nodes</span>
          </div>
          <div className="route-step-list">
            {routeResult.nodes.map((node, index) => (
              <div key={node.id} className="route-step-card">
                <div className="route-step-index">{index + 1}</div>
                <div>
                  <strong>{node.name}</strong>
                  <span>
                    Floor {node.floor} • {node.node_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="caption">Steps: {routeResult.steps.join(" → ")}</div>
        </div>
      ) : (
        <div className="empty-state">Run a simulation to preview the path and node sequence.</div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

async function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1800, height: image.naturalHeight || 1200 });
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = src;
  });
}
