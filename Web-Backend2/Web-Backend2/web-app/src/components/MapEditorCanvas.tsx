import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

import type { CanvasTransform, EdgeResponse, EditorMode, FloorMapResponse, NodeResponse, Point } from "../types";
import { clamp, edgeKey, euclideanWeight, pairMatchesEdge, pathPairs } from "../utils/geometry";

interface MapEditorCanvasProps {
  floorMap?: FloorMapResponse;
  nodes: NodeResponse[];
  edges: EdgeResponse[];
  selectedNodeId?: number | null;
  selectedEdgeId?: number | null;
  categoryColors?: Record<string, string>;
  mode: EditorMode;
  transform: CanvasTransform;
  routePath?: number[];
  onTransformChange: (next: Partial<CanvasTransform>) => void;
  onBackgroundClick: (point: Point) => void;
  onNodeClick: (node: NodeResponse, event: MouseEvent<HTMLButtonElement>) => void;
  onNodeMove: (nodeId: number, point: Point) => void;
  onNodeMoveEnd?: (nodeId: number, point: Point) => void;
  onEdgeClick?: (edge: EdgeResponse) => void;
}

export function MapEditorCanvas({
  floorMap,
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  categoryColors = {},
  mode,
  transform,
  routePath = [],
  onTransformChange,
  onBackgroundClick,
  onNodeClick,
  onNodeMove,
  onNodeMoveEnd,
  onEdgeClick,
}: MapEditorCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{
    kind: "pan" | "move" | null;
    nodeId?: number;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
    originNodeX?: number;
    originNodeY?: number;
    grabOffsetX?: number;
    grabOffsetY?: number;
    latestPoint?: Point;
  } | null>(null);

  const [isPanningHint, setIsPanningHint] = useState(false);

  const mapWidth = floorMap?.map_width || 1800;
  const mapHeight = floorMap?.map_height || 1200;
  const highlightPairs = useMemo(() => new Set(pathPairs(routePath).map((pair) => pair.join("__"))), [routePath]);
  const highlightedEdgeIds = useMemo(() => {
    const ids = new Set<number>();
    for (const edge of edges) {
      if (highlightPairs.has(`${edge.from_node_id}__${edge.to_node_id}`) || (edge.is_bidirectional && highlightPairs.has(`${edge.to_node_id}__${edge.from_node_id}`))) {
        ids.add(edge.id);
      }
    }
    return ids;
  }, [edges, highlightPairs]);

  const getMapPoint = (client: Point): Point | null => {
    const content = contentRef.current;
    if (!content) return null;
    const rect = content.getBoundingClientRect();
    return {
      x: clamp((client.x - rect.left) / transform.scale, 0, mapWidth),
      y: clamp((client.y - rect.top) / transform.scale, 0, mapHeight),
    };
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragState.current) return;
      const state = dragState.current;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;

      if (state.kind === "pan") {
        onTransformChange({
          panX: state.originPanX + dx,
          panY: state.originPanY + dy,
        });
      } else if (state.kind === "move" && state.nodeId != null) {
        const pointerPoint = getMapPoint({ x: event.clientX, y: event.clientY });
        if (!pointerPoint) return;
        const point = {
          x: clamp(pointerPoint.x - (state.grabOffsetX || 0), 0, mapWidth),
          y: clamp(pointerPoint.y - (state.grabOffsetY || 0), 0, mapHeight),
        };
        state.latestPoint = point;
        onNodeMove(state.nodeId, point);
      }
    };

    const onPointerUp = () => {
      const state = dragState.current;
      if (state?.kind === "move" && state.nodeId != null && state.latestPoint) {
        onNodeMoveEnd?.(state.nodeId, state.latestPoint);
      }
      dragState.current = null;
      setIsPanningHint(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [getMapPoint, mapHeight, mapWidth, onNodeMove, onNodeMoveEnd, onTransformChange, transform]);

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const isMiddleButton = event.button === 1;
    if (!isMiddleButton && mode !== "select" && mode !== "hide") return;
    if (!isMiddleButton && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button[data-node-id]")) return;
    event.preventDefault();
    dragState.current = {
      kind: "pan",
      startX: event.clientX,
      startY: event.clientY,
      originPanX: transform.panX,
      originPanY: transform.panY,
    };
    setIsPanningHint(true);
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    const nextScale = clamp(transform.scale + delta, 0.35, 2.5);
    onTransformChange({ scale: nextScale });
  };

  const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    if ((event.target as HTMLElement).closest("button[data-node-id]")) return;
    const point = getMapPoint({ x: event.clientX, y: event.clientY });
    if (!point) return;
    onBackgroundClick(point);
  };

  const startNodeDrag = (node: NodeResponse, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (mode !== "move-node") return;
    event.preventDefault();
    event.stopPropagation();
    const pointerPoint = getMapPoint({ x: event.clientX, y: event.clientY });
    dragState.current = {
      kind: "move",
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originPanX: transform.panX,
      originPanY: transform.panY,
      originNodeX: node.x,
      originNodeY: node.y,
      grabOffsetX: pointerPoint ? pointerPoint.x - node.x : 0,
      grabOffsetY: pointerPoint ? pointerPoint.y - node.y : 0,
      latestPoint: { x: node.x, y: node.y },
    };
  };

  const floorLabel = floorMap ? `Floor ${floorMap.floor}` : "No floor map loaded";

  return (
    <div className="canvas-shell">
      <div className="canvas-header">
        <div>
          <strong>{floorLabel}</strong>
          <div className="canvas-subtitle">
            {mode === "add-node" ? "Click the map to create a node" : mode === "add-kiosk" ? "Click the map to place a kiosk start node" : mode === "add-edge" ? "Click two nodes to connect them" : mode === "move-node" ? "Drag nodes to reposition them" : "Select mode is active"}
          </div>
        </div>
        <div className="canvas-stats">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} edges</span>
          <span>{Math.round(transform.scale * 100)}%</span>
          {isPanningHint ? <span>panning…</span> : null}
        </div>
      </div>

      <div
        ref={wrapperRef}
        className={`map-stage ${isPanningHint ? "is-panning" : ""}`}
        onPointerDown={startPan}
        onClick={handleBackgroundClick}
        onAuxClick={(event) => event.preventDefault()}
        onWheel={handleWheel}
      >
        <div
          ref={contentRef}
          className="map-content"
          style={{
            width: mapWidth,
            height: mapHeight,
            transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.scale})`,
            transformOrigin: "top left",
          }}
        >
          {floorMap ? (
            <img
              className="map-image"
              src={floorMap.image_data_url}
              alt={`Floor ${floorMap.floor} map`}
              width={mapWidth}
              height={mapHeight}
              draggable={false}
            />
          ) : (
            <div className="map-placeholder" style={{ width: mapWidth, height: mapHeight }}>
              <div>
                <h3>No map image yet</h3>
                <p>Upload a floor map to start placing nodes and edges.</p>
              </div>
            </div>
          )}

          <svg className="map-overlay" width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
            {edges.map((edge) => {
              const from = nodes.find((node) => node.id === edge.from_node_id);
              const to = nodes.find((node) => node.id === edge.to_node_id);
              if (!from || !to) return null;

              const highlighted = highlightedEdgeIds.has(edge.id) || edge.id === selectedEdgeId;
              return (
                <g key={edge.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={highlighted ? "#f97316" : edge.is_hidden ? "#94a3b8" : "#64748b"}
                    strokeWidth={highlighted ? 5 : 3}
                    strokeLinecap="round"
                    opacity={edge.is_hidden ? 0.35 : 0.95}
                    onClick={() => onEdgeClick?.(edge)}
                    className="edge-hit-target"
                    pointerEvents="stroke"
                  />
                  <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r={4} fill={highlighted ? "#f97316" : "#94a3b8"} opacity={0.9} />
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => {
            const selected = node.id === selectedNodeId;
            const highlighted = routePath.includes(node.id);
            const hidden = node.is_hidden;
            const categoryColor = categoryColors[node.node_type] || "#2563eb";
            return (
              <button
                key={node.id}
                type="button"
                data-node-id={node.id}
                className={`node-marker ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""} ${hidden ? "hidden-node" : ""}`}
                style={{ left: node.x, top: node.y, "--node-color": categoryColor } as any}
                onClick={(event: any) => onNodeClick(node, event)}
                onPointerDown={(event: any) => startNodeDrag(node, event)}
                title={`${node.name} • floor ${node.floor}`}
              >
                <span className="node-dot" />
                <span className="node-label">{node.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
