import { LocateFixed, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavNode } from "@/lib/navigation-engine";

const floorLabels: Record<number, string> = {
  [-1]: "B1",
  0: "G",
  1: "1",
  2: "2",
};

export function FloorMap({
  nodes,
  floor = 0,
  compact = false,
  destinationName,
}: {
  nodes: NavNode[];
  floor?: number;
  compact?: boolean;
  destinationName?: string;
  activeNodeId?: string;
}) {
  const visible = nodes.filter((node) => node.floor === floor);
  const points = visible.map((node) => `${node.x},${node.y}`).join(" ");
  const destination = visible.at(-1);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-map",
        compact ? "h-72" : "h-[32rem]",
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        role="img"
        aria-label={`แผนผังชั้น ${floorLabels[floor] ?? floor} พร้อมเส้นทางไปยัง ${destinationName ?? "จุดหมาย"}`}
      >
        <rect width="100" height="100" fill="var(--map)" />
        <path
          d="M7 15h30v17h25V15h31v24H76v22h17v25H61V72H39v14H7V61h18V39H7Z"
          fill="var(--card)"
          stroke="var(--map-wall)"
          strokeWidth="1.2"
        />
        <path
          d="M25 39h14v-7h22v7h15v22H61v11H39V61H25Z"
          fill="var(--secondary)"
          stroke="var(--map-wall)"
          strokeWidth="1"
        />
        <g
          fill="var(--muted-foreground)"
          fontSize="3.1"
          fontWeight="700"
          textAnchor="middle"
        >
          <text x="21" y="24">
            ร้านอาหาร
          </text>
          <text x="77" y="24">
            แฟชั่น
          </text>
          <text x="15" y="75">
            บริการ
          </text>
          <text x="78" y="76">
            ร้านค้า
          </text>
          <text x="50" y="51">
            โถงกลาง
          </text>
          <text x="55" y="68">
            ลิฟต์
          </text>
        </g>
        <g fill="none" stroke="var(--map-wall)" strokeWidth="0.8">
          <path d="M17 15v17M27 15v17M72 15v24M82 15v24M7 70h18M76 72h17" />
          <rect x="50" y="62" width="10" height="7" rx="1" />
        </g>
        {points && (
          <>
            <polyline
              points={points}
              fill="none"
              stroke="var(--card)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={points}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="route-line"
            />
          </>
        )}
        {visible.map((node, index) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={index === visible.length - 1 ? 4.2 : 3}
              fill={
                index === visible.length - 1
                  ? "var(--burgundy)"
                  : "var(--primary)"
              }
              stroke="var(--card)"
              strokeWidth="1.5"
            />
            {index === 0 && (
              <text
                x={node.x}
                y={node.y + 1.1}
                textAnchor="middle"
                fill="var(--primary-foreground)"
                fontSize="3"
                fontWeight="900"
              >
                YOU
              </text>
            )}
          </g>
        ))}
        {destination && (
          <g>
            <rect
              x={Math.min(destination.x + 4, 66)}
              y={destination.y - 7}
              width="29"
              height="7"
              rx="3.5"
              fill="var(--foreground)"
            />
            <text
              x={Math.min(destination.x + 18.5, 80.5)}
              y={destination.y - 2.5}
              textAnchor="middle"
              fill="var(--background)"
              fontSize="3"
              fontWeight="800"
            >
              จุดหมาย
            </text>
          </g>
        )}
      </svg>
      <div className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-black shadow-sm">
        ชั้น {floorLabels[floor] ?? floor}
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-[0.6rem] font-bold text-background">
        <Navigation className="size-3 text-primary" /> เส้นทางแนะนำ
      </div>
      <div className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card text-burgundy shadow-sm">
        <LocateFixed className="size-4" />
      </div>
    </div>
  );
}
