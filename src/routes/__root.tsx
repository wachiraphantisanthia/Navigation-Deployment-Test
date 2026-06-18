import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AvatarProvider } from "../components/avatar-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Aurum Galleria Mall Navigator" },
      { name: "description", content: "Touch-friendly indoor mall navigation, store directory, accessible routes and mobile continuation." },
      { name: "author", content: "Aurum Galleria" },
      { name: "theme-color", content: "#b6842c" },
      { property: "og:title", content: "Aurum Galleria Mall Navigator" },
      { property: "og:description", content: "Touch-friendly indoor mall navigation, store directory, accessible routes and mobile continuation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Aurum Galleria Mall Navigator" },
      { name: "twitter:description", content: "Touch-friendly indoor mall navigation, store directory, accessible routes and mobile continuation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/996566a1-db0c-4e91-ae43-b68298eac10c/id-preview-88063caa--bdf394c9-b252-4d6d-9e17-0ac4a6a55a56.lovable.app-1781454276804.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/996566a1-db0c-4e91-ae43-b68298eac10c/id-preview-88063caa--bdf394c9-b252-4d6d-9e17-0ac4a6a55a56.lovable.app-1781454276804.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    import("../pwa").then(({ registerAppServiceWorker }) => registerAppServiceWorker());
  }, []);

  // อัปเดต meta tag บอก bot ว่าอยู่หน้าไหน ทุกครั้งที่ route เปลี่ยน
  useEffect(() => {
    const updateCurrentPage = () => {
      let el = document.getElementById("wa-current-page");
      if (!el) {
        el = document.createElement("div");
        el.id = "wa-current-page";
        el.setAttribute("aria-label", "Current page path");
        el.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
        document.body.appendChild(el);
      }
      el.textContent = window.location.pathname;
    };
    updateCurrentPage();
    return router.subscribe("onLoad", updateCurrentPage);
  }, [router]);

  useEffect(() => {
    // Intercept 'webavatar-navigate' event ที่ widget dispatch ก่อน window.location.href
    // ถ้า preventDefault() widget จะไม่ทำ full page reload
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ target: string }>;
      const path = customEvent.detail?.target;
      if (path) {
        e.preventDefault(); // หยุด widget ไม่ให้ใช้ window.location.href
        router.navigate({ to: path });
      }
    };

    document.addEventListener("webavatar-navigate", handleNavigate);
    return () => document.removeEventListener("webavatar-navigate", handleNavigate);
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <AvatarProvider>
        <Outlet />
      </AvatarProvider>
    </QueryClientProvider>
  );
}