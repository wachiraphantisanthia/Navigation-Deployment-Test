import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { findPath } from "@/lib/navigation-engine";
import { kiosk, stores } from "@/lib/mall-data";

const routeSchema = z.object({
  kioskId: z.string().min(3).max(40),
  destinationStoreId: z.string().min(1).max(80),
  accessible: z.boolean().default(false),
});
const sessionSchema = routeSchema;

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser(authorization.slice(7));
  return data.user;
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function segment(params: { _splat?: string }) {
  return (params._splat ?? "").split("/").filter(Boolean);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const parts = segment(params);
        if (parts[0] === "stores") {
          const found = parts[1]
            ? stores.find((store) => store.id === parts[1])
            : stores;
          return found
            ? json({ data: found })
            : json({ error: "Store not found" }, 404);
        }
        if (parts[0] === "categories")
          return json({
            data: [...new Set(stores.map((store) => store.category))],
          });
        if (parts[0] === "kiosks") return json({ data: [kiosk] });
        if (parts[0] === "session" && parts[1]) {
          const token = z
            .string()
            .regex(/^[A-Za-z0-9_-]{16,64}$/)
            .safeParse(parts[1]);
          if (!token.success) return json({ error: "Invalid session ID" }, 400);
          const { supabaseAdmin } =
            await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("navigation_sessions")
            .select(
              "public_token,destination_store_id,route_node_ids,instructions,total_distance,accessible,expires_at",
            )
            .eq("public_token", token.data)
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();
          return data
            ? json({ data })
            : json({ error: "Session expired or not found" }, 404);
        }
        if (parts[0] === "auth" && parts[1] === "logout")
          return json({ error: "Use POST" }, 405);
        return json({ error: "Endpoint not found" }, 404);
      },
      POST: async ({ params, request }) => {
        const parts = segment(params);
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        if (parts[0] === "navigation" && parts[1] === "find-route") {
          const parsed = routeSchema.safeParse(body);
          if (!parsed.success)
            return json(
              {
                error: "Invalid route request",
                details: parsed.error.flatten(),
              },
              422,
            );
          const store = stores.find(
            (item) => item.id === parsed.data.destinationStoreId,
          );
          if (!store) return json({ error: "Destination not found" }, 404);
          return json({
            data: findPath(kiosk.nodeId, store.nodeId, parsed.data.accessible),
          });
        }
        if (parts[0] === "session" && parts[1] === "create") {
          const parsed = sessionSchema.safeParse(body);
          if (!parsed.success)
            return json(
              {
                error: "Invalid session request",
                details: parsed.error.flatten(),
              },
              422,
            );
          const store = stores.find(
            (item) => item.id === parsed.data.destinationStoreId,
          );
          if (!store) return json({ error: "Destination not found" }, 404);
          const path = findPath(
            kiosk.nodeId,
            store.nodeId,
            parsed.data.accessible,
          );
          const token = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          const { supabaseAdmin } =
            await import("@/integrations/supabase/client.server");
          const { data: kioskRow } = await supabaseAdmin
            .from("kiosks")
            .select("id")
            .eq("code", parsed.data.kioskId)
            .maybeSingle();
          const { data: storeRow } = await supabaseAdmin
            .from("stores")
            .select("id")
            .eq("id", parsed.data.destinationStoreId)
            .maybeSingle();
          if (storeRow)
            await supabaseAdmin.from("navigation_sessions").insert({
              public_token: token,
              kiosk_id: kioskRow?.id ?? null,
              destination_store_id: storeRow.id,
              route_node_ids: path.nodes.map((node) => node.id),
              instructions: [],
              total_distance: path.distance,
              accessible: parsed.data.accessible,
              expires_at: expiresAt,
            });
          return json(
            {
              data: {
                id: token,
                url: `${new URL(request.url).origin}/route/${token}?store=${store.id}`,
                expiresAt,
                route: path,
              },
            },
            201,
          );
        }
        if (parts[0] === "auth" && parts[1] === "logout")
          return json({ ok: true });
        if (["stores", "categories", "kiosks"].includes(parts[0] ?? "")) {
          if (!(await authenticatedUser(request)))
            return json({ error: "Unauthorized" }, 401);
          return json(
            {
              error:
                "Use the authenticated admin dashboard for content changes",
            },
            501,
          );
        }
        return json({ error: "Endpoint not found" }, 404);
      },
      PUT: async ({ request }) =>
        (await authenticatedUser(request))
          ? json(
              {
                error:
                  "Use the authenticated admin dashboard for content changes",
              },
              501,
            )
          : json({ error: "Unauthorized" }, 401),
      DELETE: async ({ request }) =>
        (await authenticatedUser(request))
          ? json(
              {
                error:
                  "Use the authenticated admin dashboard for content changes",
              },
              501,
            )
          : json({ error: "Unauthorized" }, 401),
    },
  },
});
