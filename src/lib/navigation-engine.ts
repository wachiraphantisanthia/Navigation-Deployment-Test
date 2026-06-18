export type Locale = "th" | "en" | "cn";

export type NavNode = {
  id: string;
  x: number;
  y: number;
  floor: number;
  kind?: string;
  names?: Record<Locale, string>;
  landmark?: Record<Locale, string>;
};
export type NavEdge = {
  from: string;
  to: string;
  distance: number;
  kind?: "walkway" | "elevator" | "escalator" | "stairs";
  accessible?: boolean;
  bidirectional?: boolean;
};

export const demoNodes: NavNode[] = [
  {
    id: "g1",
    x: 12,
    y: 78,
    floor: 0,
    names: { th: "โถงกลาง (Grand Atrium)", en: "Grand Atrium", cn: "中庭" },
  },
  {
    id: "g2",
    x: 34,
    y: 78,
    floor: 0,
    names: { th: "โถงทางเข้าหลัก", en: "Main Entrance Hall", cn: "大厅入口" },
  },
  {
    id: "g3",
    x: 55,
    y: 60,
    floor: 0,
    names: { th: "ทางแยกโถงกลาง", en: "Atrium Junction", cn: "中庭交叉口" },
    landmark: {
      th: "ใกล้บันไดเลื่อนกลาง",
      en: "near the central escalator",
      cn: "中央扶梯旁",
    },
  },
  {
    id: "g4",
    x: 78,
    y: 42,
    floor: 0,
    names: {
      th: "หน้าร้าน Siam Tea Atelier",
      en: "in front of Siam Tea Atelier",
      cn: "Siam Tea Atelier 店前",
    },
  },
  {
    id: "g5",
    x: 82,
    y: 72,
    floor: 0,
    names: {
      th: "หน้าร้าน Well Pharmacy",
      en: "in front of Well Pharmacy",
      cn: "Well Pharmacy 店前",
    },
  },
  {
    id: "lift-g",
    x: 54,
    y: 42,
    floor: 0,
    kind: "elevator",
    names: {
      th: "ลิฟต์แก้ว ชั้น G",
      en: "Glass Elevator, Floor G",
      cn: "观光电梯 G层",
    },
  },
  {
    id: "f11",
    x: 20,
    y: 72,
    floor: 1,
    names: {
      th: "ระเบียงทางเดินชั้น 1 ฝั่งเหนือ",
      en: "Floor 1 North Terrace",
      cn: "1层北侧走廊",
    },
  },
  {
    id: "f12",
    x: 48,
    y: 64,
    floor: 1,
    names: {
      th: "โถงหน้าลิฟต์ชั้น 1",
      en: "Floor 1 Elevator lobby",
      cn: "1层电梯厅",
    },
  },
  {
    id: "f14",
    x: 78,
    y: 46,
    floor: 1,
    names: {
      th: "หน้าร้าน Aster Beauty",
      en: "in front of Aster Beauty",
      cn: "Aster Beauty 店前",
    },
  },
  {
    id: "lift-1",
    x: 54,
    y: 42,
    floor: 1,
    kind: "elevator",
    names: {
      th: "ลิฟต์แก้ว ชั้น 1",
      en: "Glass Elevator, Floor 1",
      cn: "观光电梯 1层",
    },
  },
  {
    id: "f21",
    x: 20,
    y: 72,
    floor: 2,
    names: {
      th: "ระเบียงทางเดินชั้น 2 ฝั่งเหนือ",
      en: "Floor 2 North Terrace",
      cn: "2层北侧走廊",
    },
  },
  {
    id: "f22",
    x: 48,
    y: 64,
    floor: 2,
    names: {
      th: "โถงหน้าลิฟต์ชั้น 2",
      en: "Floor 2 Elevator lobby",
      cn: "2层电梯厅",
    },
  },
  {
    id: "f24",
    x: 78,
    y: 46,
    floor: 2,
    names: {
      th: "หน้าร้าน Maison Lumière",
      en: "in front of Maison Lumière",
      cn: "Maison Lumière 店前",
    },
  },
  {
    id: "f25",
    x: 84,
    y: 72,
    floor: 2,
    names: {
      th: "หน้าร้าน Nara Table",
      en: "in front of Nara Table",
      cn: "Nara Table 店前",
    },
  },
  {
    id: "lift-2",
    x: 54,
    y: 42,
    floor: 2,
    kind: "elevator",
    names: {
      th: "ลิฟต์แก้ว ชั้น 2",
      en: "Glass Elevator, Floor 2",
      cn: "观光电梯 2层",
    },
  },
  {
    id: "b1",
    x: 18,
    y: 76,
    floor: -1,
    names: {
      th: "ทางเดินชั้นใต้ดินฝั่งเหนือ",
      en: "Basement North walkway",
      cn: "地下一层北侧走廊",
    },
  },
  {
    id: "b2",
    x: 52,
    y: 62,
    floor: -1,
    names: {
      th: "โถงหน้าลิฟต์ชั้นใต้ดิน",
      en: "Basement Elevator lobby",
      cn: "地下一层电梯厅",
    },
  },
  {
    id: "b3",
    x: 82,
    y: 48,
    floor: -1,
    names: {
      th: "หน้าร้าน Golden Grocer",
      en: "in front of Golden Grocer",
      cn: "Golden Grocer 店前",
    },
  },
  {
    id: "lift-b",
    x: 54,
    y: 42,
    floor: -1,
    kind: "elevator",
    names: {
      th: "ลิฟต์แก้ว ชั้นใต้ดิน",
      en: "Glass Elevator, Basement",
      cn: "观光电梯 地下一层",
    },
  },
];

export const demoEdges: NavEdge[] = [
  ["g1", "g2", 20],
  ["g2", "g3", 24],
  ["g3", "g4", 26],
  ["g3", "g5", 24],
  ["g3", "lift-g", 12],
  ["f11", "f12", 25],
  ["f12", "f14", 30],
  ["f12", "lift-1", 14],
  ["f21", "f22", 25],
  ["f22", "f24", 30],
  ["f22", "f25", 32],
  ["f22", "lift-2", 14],
  ["b1", "b2", 28],
  ["b2", "b3", 30],
  ["b2", "lift-b", 14],
].map(([from, to, distance]) => ({
  from: String(from),
  to: String(to),
  distance: Number(distance),
  bidirectional: true,
  accessible: true,
  kind: "walkway",
}));
demoEdges.push(
  {
    from: "lift-b",
    to: "lift-g",
    distance: 18,
    kind: "elevator",
    accessible: true,
    bidirectional: true,
  },
  {
    from: "lift-g",
    to: "lift-1",
    distance: 18,
    kind: "elevator",
    accessible: true,
    bidirectional: true,
  },
  {
    from: "lift-1",
    to: "lift-2",
    distance: 18,
    kind: "elevator",
    accessible: true,
    bidirectional: true,
  },
);

export function findPath(
  startId: string,
  goalId: string,
  accessible = false,
  nodes = demoNodes,
  edges = demoEdges,
) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (!byId.has(startId) || !byId.has(goalId))
    return { nodes: [], distance: 0 };
  const adjacency = new Map<string, { id: string; cost: number }[]>();
  const add = (from: string, id: string, cost: number) =>
    adjacency.set(from, [...(adjacency.get(from) ?? []), { id, cost }]);
  for (const edge of edges) {
    if (accessible && !edge.accessible) continue;
    const penalty = edge.kind === "stairs" ? 8 : 0;
    add(edge.from, edge.to, edge.distance + penalty);
    if (edge.bidirectional) add(edge.to, edge.from, edge.distance + penalty);
  }
  const heuristic = (id: string) => {
    const a = byId.get(id);
    const b = byId.get(goalId);
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.floor - b.floor) * 18;
  };
  const open = new Set([startId]);
  const came = new Map<string, string>();
  const g = new Map([[startId, 0]]);
  const f = new Map([[startId, heuristic(startId)]]);
  while (open.size) {
    const current = [...open].reduce((best, id) =>
      (f.get(id) ?? Infinity) < (f.get(best) ?? Infinity) ? id : best,
    );
    if (current === goalId) {
      const path = [current];
      let cursor = current;
      while (came.has(cursor)) {
        cursor = came.get(cursor) ?? startId;
        path.unshift(cursor);
      }
      return {
        nodes: path
          .map((id) => byId.get(id))
          .filter((n): n is NavNode => Boolean(n)),
        distance: Math.round(g.get(goalId) ?? 0),
      };
    }
    open.delete(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const tentative = (g.get(current) ?? Infinity) + neighbor.cost;
      if (tentative < (g.get(neighbor.id) ?? Infinity)) {
        came.set(neighbor.id, current);
        g.set(neighbor.id, tentative);
        f.set(neighbor.id, tentative + heuristic(neighbor.id));
        open.add(neighbor.id);
      }
    }
  }
  return { nodes: [], distance: 0 };
}
