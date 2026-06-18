import { registerSW } from "virtual:pwa-register";
export async function registerAppServiceWorker() {
  if (!import.meta.env.PROD || typeof window === "undefined" || window.self !== window.top) return;
  const host = window.location.hostname;
  const blocked = host.startsWith("id-preview--") || host.startsWith("preview--") || host.endsWith(".lovableproject.com") || host.endsWith(".lovableproject-dev.com") || host.endsWith(".beta.lovable.dev") || new URLSearchParams(window.location.search).get("sw") === "off";
  if (blocked) { for (const registration of await navigator.serviceWorker?.getRegistrations?.() ?? []) if (registration.active?.scriptURL.endsWith("/sw.js")) await registration.unregister(); return; }
  registerSW({ immediate: true });
}