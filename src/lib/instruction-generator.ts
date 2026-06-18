import { type Locale, type NavNode } from "./navigation-engine";
import { stores } from "./mall-data";

export type NavStep = {
  text: string;
  nodeId: string;
  floor: number;
};

// Helper to calculate distance between two nodes
function getDistance(a: NavNode, b: NavNode): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
}

// Translate floor numbers to user-friendly text
function getFloorLabel(floor: number, locale: Locale): string {
  if (floor === 0) {
    return locale === "th" ? "ชั้น G" : locale === "cn" ? "G层" : "Floor G";
  }
  if (floor < 0) {
    const abs = Math.abs(floor);
    return locale === "th"
      ? `ชั้นใต้ดิน B${abs}`
      : locale === "cn"
        ? `地下 B${abs}层`
        : `Basement B${abs}`;
  }
  return locale === "th"
    ? `ชั้น ${floor}`
    : locale === "cn"
      ? `${floor}层`
      : `Floor ${floor}`;
}

export function generateInstructions(
  path: NavNode[],
  locale: Locale = "th",
): NavStep[] {
  if (!path || path.length < 2) {
    return [
      {
        text:
          locale === "th"
            ? "ขออภัย ไม่พบคำแนะนำเส้นทาง"
            : "Sorry, no instructions found.",
        nodeId: path?.[0]?.id ?? "",
        floor: path?.[0]?.floor ?? 0,
      },
    ];
  }

  const instructions: NavStep[] = [];
  const startNode = path[0];
  const endNode = path[path.length - 1];

  // Find destination store name if possible
  const destStore = stores.find((s) => s.nodeId === endNode.id);
  const destName = destStore
    ? destStore.name
    : (endNode.names?.[locale] ?? endNode.id);

  // Step 1: Start point
  const startLabel = startNode.names?.[locale] ?? startNode.id;
  instructions.push({
    text:
      locale === "th"
        ? `เริ่มต้นเดินทางจากบริเวณ ${startLabel}`
        : locale === "cn"
          ? `从 ${startLabel} 区域出发`
          : `Start from ${startLabel}`,
    nodeId: startNode.id,
    floor: startNode.floor,
  });

  // Generate turn-by-turn steps
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    // Check for floor change first
    if (current.floor !== next.floor) {
      const direction =
        next.floor > current.floor
          ? locale === "th"
            ? "ขึ้น"
            : locale === "cn"
              ? "上"
              : "up"
          : locale === "th"
            ? "ลง"
            : locale === "cn"
              ? "下"
              : "down";
      const targetFloorStr = getFloorLabel(next.floor, locale);

      const isElevator =
        current.kind === "elevator" ||
        next.kind === "elevator" ||
        current.id.includes("lift") ||
        next.id.includes("lift");

      let text = "";
      if (locale === "th") {
        text = isElevator
          ? `เดินเข้าลิฟต์ แล้ว${direction}ไปที่ ${targetFloorStr}`
          : `ใช้บันไดเลื่อนเพื่อ${direction}ไปที่ ${targetFloorStr}`;
      } else if (locale === "cn") {
        text = isElevator
          ? `进入电梯${direction}至 ${targetFloorStr}`
          : `搭乘扶梯${direction}至 ${targetFloorStr}`;
      } else {
        text = isElevator
          ? `Take the elevator ${direction} to ${targetFloorStr}`
          : `Take the escalator ${direction} to ${targetFloorStr}`;
      }

      instructions.push({
        text,
        nodeId: next.id,
        floor: next.floor,
      });
      continue;
    }

    // Identify nearby stores to use as landmark
    const nextStore = stores.find((s) => s.nodeId === next.id);
    const landmarkLabel = next.landmark?.[locale];

    // Calculate turning if we have a previous segment
    if (i > 0) {
      const prev = path[i - 1];

      // Vectors
      const dx1 = current.x - prev.x;
      const dy1 = current.y - prev.y;
      const dx2 = next.x - current.x;
      const dy2 = next.y - current.y;

      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);

      let angleDiff = angle2 - angle1;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      const degDiff = (angleDiff * 180) / Math.PI;

      // Turn instructions
      if (degDiff > 45 && degDiff < 135) {
        // Turn Right
        const locationName = current.names?.[locale] ?? "";
        let turnText = "";
        if (locale === "th") {
          turnText = locationName
            ? `เมื่อถึงบริเวณ ${locationName} ให้เลี้ยวขวา`
            : `เลี้ยวขวาที่ทางข้างหน้า`;
        } else if (locale === "cn") {
          turnText = locationName
            ? `到达 ${locationName} 区域后向右转`
            : `在前方向右转`;
        } else {
          turnText = locationName
            ? `When you reach ${locationName}, turn right`
            : `Turn right ahead`;
        }
        instructions.push({
          text: turnText,
          nodeId: current.id,
          floor: current.floor,
        });
      } else if (degDiff < -45 && degDiff > -135) {
        // Turn Left
        const locationName = current.names?.[locale] ?? "";
        let turnText = "";
        if (locale === "th") {
          turnText = locationName
            ? `เมื่อถึงบริเวณ ${locationName} ให้เลี้ยวซ้าย`
            : `เลี้ยวซ้ายที่ทางข้างหน้า`;
        } else if (locale === "cn") {
          turnText = locationName
            ? `到达 ${locationName} 区域后向左转`
            : `在前方向左转`;
        } else {
          turnText = locationName
            ? `When you reach ${locationName}, turn left`
            : `Turn left ahead`;
        }
        instructions.push({
          text: turnText,
          nodeId: current.id,
          floor: current.floor,
        });
      }
    }

    // Describe walking segment
    const dist = getDistance(current, next);

    // Friendly distance descriptions for elderly
    let distanceLabel = "";
    if (locale === "th") {
      if (dist < 10) {
        distanceLabel = "เดินต่ออีกเพียงเล็กน้อย";
      } else {
        distanceLabel = `เดินตรงไปข้างหน้าประมาณ ${dist} เมตร`;
      }
    } else if (locale === "cn") {
      if (dist < 10) {
        distanceLabel = "继续走几步";
      } else {
        distanceLabel = `直行大约 ${dist} 米`;
      }
    } else {
      if (dist < 10) {
        distanceLabel = "Walk a few more steps";
      } else {
        distanceLabel = `Walk straight for about ${dist} meters`;
      }
    }

    let walkText = "";
    // Append landmark detail if available
    if (nextStore) {
      if (locale === "th") {
        walkText = `${distanceLabel} จะผ่านหน้า ${nextStore.name}`;
      } else if (locale === "cn") {
        walkText = `${distanceLabel}，会经过 ${nextStore.name}`;
      } else {
        walkText = `${distanceLabel} past ${nextStore.name}`;
      }
    } else if (landmarkLabel) {
      if (locale === "th") {
        walkText = `${distanceLabel} (${landmarkLabel})`;
      } else if (locale === "cn") {
        walkText = `${distanceLabel} (${landmarkLabel})`;
      } else {
        walkText = `${distanceLabel} (${landmarkLabel})`;
      }
    } else {
      walkText = distanceLabel;
    }

    instructions.push({
      text: walkText,
      nodeId: next.id,
      floor: next.floor,
    });
  }

  // Step 3: Arrival
  instructions.push({
    text:
      locale === "th"
        ? `จะพบ ${destName} อยู่ตรงหน้าคุณพอดี`
        : locale === "cn"
          ? `目的地 ${destName} 就在您前方`
          : `You will find ${destName} right in front of you.`,
    nodeId: endNode.id,
    floor: endNode.floor,
  });

  // Post-process to remove consecutive duplicates
  const finalInstructions: NavStep[] = [];
  for (const step of instructions) {
    if (
      finalInstructions.length > 0 &&
      finalInstructions[finalInstructions.length - 1].text === step.text
    ) {
      continue;
    }
    finalInstructions.push(step);
  }

  return finalInstructions;
}
