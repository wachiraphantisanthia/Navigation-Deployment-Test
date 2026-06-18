import { describe, expect, it } from "vitest";
import { findPath } from "./navigation-engine";
import { generateInstructions } from "./instruction-generator";

describe("findPath", () => {
  it("finds a multi-floor elevator route", () => {
    const route = findPath("g1", "f24", true);
    expect(route.nodes.at(0)?.id).toBe("g1");
    expect(route.nodes.at(-1)?.id).toBe("f24");
    expect(route.nodes.some((node) => node.kind === "elevator")).toBe(true);
    expect(route.distance).toBeGreaterThan(0);
  });

  it("returns an empty route for an unknown destination", () => {
    expect(findPath("g1", "missing").nodes).toEqual([]);
  });
});

describe("generateInstructions", () => {
  it("generates instructions in Thai correctly", () => {
    const route = findPath("g1", "f24", true);
    const instructions = generateInstructions(route.nodes, "th");
    const texts = instructions.map((i) => i.text);
    expect(texts.length).toBeGreaterThan(1);
    expect(texts[0]).toContain("เริ่มต้นเดินทางจากบริเวณ");
    expect(
      texts.some((t) => t.includes("ลิฟต์") || t.includes("บันไดเลื่อน")),
    ).toBe(true);
  });

  it("generates instructions in English correctly", () => {
    const route = findPath("g1", "f24", true);
    const instructions = generateInstructions(route.nodes, "en");
    const texts = instructions.map((i) => i.text);
    expect(texts.length).toBeGreaterThan(1);
    expect(texts[0]).toContain("Start from");
    expect(
      texts.some(
        (t) =>
          t.toLowerCase().includes("elevator") ||
          t.toLowerCase().includes("escalator"),
      ),
    ).toBe(true);
  });
});
