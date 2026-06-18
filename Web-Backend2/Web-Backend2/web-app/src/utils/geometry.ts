import type { CanvasTransform, Point, NodeResponse, EdgeResponse } from "../types";

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function euclideanWeight(a: Point, b: Point): number {
  return Math.round(distance(a, b) * 100) / 100;
}

export function transformClientToMap(
  client: Point,
  rect: DOMRect,
  transform: CanvasTransform,
): Point {
  return {
    x: (client.x - rect.left - transform.panX) / transform.scale,
    y: (client.y - rect.top - transform.panY) / transform.scale,
  };
}

export function mapToScreenPoint(point: Point, transform: CanvasTransform): Point {
  return {
    x: point.x * transform.scale + transform.panX,
    y: point.y * transform.scale + transform.panY,
  };
}

export function nodeCenter(node: NodeResponse) {
  return { x: node.x, y: node.y };
}

export function pathPairs(path: number[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    pairs.push([path[i], path[i + 1]]);
  }
  return pairs;
}

export function edgeKey(edge: Pick<EdgeResponse, "from_node_id" | "to_node_id">) {
  return `${edge.from_node_id}__${edge.to_node_id}`;
}

export function pairMatchesEdge(
  pair: [number, number],
  edge: EdgeResponse,
): boolean {
  return edge.from_node_id === pair[0] && edge.to_node_id === pair[1];
}

export function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toDataUrlPrompt(dimensions: { width: number; height: number }) {
  return `${dimensions.width}×${dimensions.height}`;
}
