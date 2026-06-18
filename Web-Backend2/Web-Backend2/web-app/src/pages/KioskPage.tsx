import { useEffect, useMemo, useState } from "react";

import {
  calculateRoute,
  getKioskCategories,
  getKioskDestinationDetail,
  getKioskDestinationsByCategory,
  getKioskHome,
  searchKioskDestinations,
} from "../api/client";
import type {
  KioskCategoryResponse,
  KioskDestinationDetail,
  KioskDestinationSummary,
  KioskHomeResponse,
  LanguageCode,
  RouteResponse,
} from "../types";

const BASE_CATEGORY_KEYS = new Set(["waypoint", "entrance", "elevator", "escalator"]);

const UI_TEXT = {
  TH: {
    title: "ระบบนำทางภายในอาคาร",
    subtitle: "เลือกหมวดหมู่ร้านค้า ค้นหา และเริ่มนำทางได้ทันที",
    home: "หน้าแรก",
    categories: "หมวดหมู่",
    search: "ค้นหา",
    language: "ภาษา",
    help: "ช่วยเหลือ",
    featured: "ร้านแนะนำ",
    destinations: "สถานที่ในหมวด",
    detail: "รายละเอียดสถานที่",
    startNavigation: "เริ่มนำทาง",
    back: "กลับ",
    clear: "ล้าง",
    route: "เส้นทาง",
    noResults: "ไม่พบข้อมูล",
    scannerHint: "สแกน QR เพื่อเปิดต่อบนมือถือในอนาคต",
  },
  EN: {
    title: "Indoor Navigation",
    subtitle: "Browse categories, search destinations, and start navigation.",
    home: "Home",
    categories: "Categories",
    search: "Search",
    language: "Language",
    help: "Help",
    featured: "Featured",
    destinations: "Destinations",
    detail: "Destination Detail",
    startNavigation: "Start Navigation",
    back: "Back",
    clear: "Clear",
    route: "Route",
    noResults: "No data found",
    scannerHint: "Scan QR to continue on mobile later.",
  },
} as const;

function isBaseCategory(category: KioskCategoryResponse) {
  return !!category.is_base || BASE_CATEGORY_KEYS.has((category.key || category.name).trim().toLowerCase());
}

function sortCategories(categories: KioskCategoryResponse[]) {
  return [...categories].sort((a, b) => {
    const aBase = isBaseCategory(a);
    const bBase = isBaseCategory(b);
    if (aBase !== bBase) return aBase ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function KioskPage() {
  const [language] = useState<LanguageCode>("TH");
  const t = UI_TEXT[language];
  const [home, setHome] = useState<KioskHomeResponse>({ categories: [], featured_destinations: [] });
  const [categories, setCategories] = useState<KioskCategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [destinations, setDestinations] = useState<KioskDestinationSummary[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<KioskDestinationDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KioskDestinationSummary[]>([]);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [activeSection, setActiveSection] = useState<"categories" | "search" | "detail" | "route">("categories");
  const kioskIdFromUrl = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    return query.get("kiosk");
  }, []);

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    const handler = window.setInterval(() => {
      if (document.hidden) return;
    }, 1000);
    return () => window.clearInterval(handler);
  }, []);

  async function loadInitial() {
    try {
      const [homeResponse, categoriesResponse] = await Promise.all([getKioskHome(), getKioskCategories()]);
      setHome(homeResponse);
      setCategories(categoriesResponse);
      if (homeResponse.categories.length > 0) {
        setSelectedCategoryId(homeResponse.categories[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (selectedCategoryId == null) return;
    void loadCategory(selectedCategoryId);
  }, [selectedCategoryId]);

  async function loadCategory(categoryId: number) {
    try {
      const response = await getKioskDestinationsByCategory(categoryId);
      setDestinations(response);
      setActiveSection("categories");
    } catch (error) {
      console.error(error);
    }
  }

  async function doSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await searchKioskDestinations(query.trim());
      setSearchResults(response);
      setActiveSection("search");
    } catch (error) {
      console.error(error);
    }
  }

  async function openDestination(nodeId: number) {
    try {
      const detail = await getKioskDestinationDetail(nodeId);
      setSelectedDestination(detail);
      setActiveSection("detail");
      setRoute(null);
    } catch (error) {
      console.error(error);
    }
  }

  async function startNavigation() {
    if (!selectedDestination) return;
    const kiosk = kioskIdFromUrl || "";
    try {
      const response = await calculateRoute({
        start_kiosk_id: kiosk ? Number(kiosk) : null,
        destination_node_id: selectedDestination.id,
      });
      setRoute(response);
      setActiveSection("route");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Unable to calculate route");
    }
  }

  const displayedCategories = sortCategories(home.categories.length > 0 ? home.categories : categories);

  return (
    <div className="kiosk-page">
      <section className="kiosk-toolbar">
        <div className="toolbar-search">
          <label className="field-label">{t.search}</label>
          <input
            id="search-input"
            className="text-input"
            placeholder={t.search}
            value={searchQuery}
            onChange={(event: any) => void doSearch(event.target.value)}
          />
        </div>
      </section>

      <div className="kiosk-grid">
        <aside className="panel kiosk-side">
          <section className="panel-section">
            <div className="section-title-row">
              <h2>{t.categories}</h2>
              <button className="ghost-button" onClick={() => void loadInitial()}>
                Refresh
              </button>
            </div>
            <div className="category-grid">
              {displayedCategories.map((category) => (
                <button
                  key={category.id}
                  className={`category-card ${isBaseCategory(category) ? "base" : ""} ${selectedCategoryId === category.id ? "active" : ""}`}
                  onClick={() => setSelectedCategoryId(category.id)}
                  data-action="open-category-card"
                  data-category-id={category.id}
                >
                  <div className="category-icon">{category.name.slice(0, 1).toUpperCase()}</div>
                  <strong>{category.name}</strong>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="panel kiosk-main">
          {activeSection === "categories" ? (
            <section className="panel-section kiosk-section">
              <div className="section-title-row">
                <h2>{selectedCategoryId ? displayedCategories.find((c) => c.id === selectedCategoryId)?.name : t.destinations}</h2>
                <button className="ghost-button" onClick={() => void loadInitial()}>Refresh</button>
              </div>
              <div className="destination-grid">
                {destinations.map((destination) => (
                  <button
                    key={destination.id}
                    className="destination-card"
                    onClick={() => void openDestination(destination.id)}
                  >
                    <img src={destination.image_url || fallbackImage(destination.name)} alt={destination.name} />
                    <div>
                      <strong>{destination.name}</strong>
                      <span>Floor {destination.floor}</span>
                    </div>
                  </button>
                ))}
              </div>
              {destinations.length === 0 ? <div className="empty-state">{t.noResults}</div> : null}
            </section>
          ) : null}

          {activeSection === "search" ? (
            <section className="panel-section kiosk-section">
              <div className="section-title-row">
                <h2>{t.search}</h2>
                <button className="ghost-button" onClick={() => setActiveSection("categories")}>{t.back}</button>
              </div>
              <div className="destination-grid">
                {searchResults.map((destination) => (
                  <button
                    key={destination.id}
                    className="destination-card"
                    onClick={() => void openDestination(destination.id)}
                  >
                    <img src={destination.image_url || fallbackImage(destination.name)} alt={destination.name} />
                    <div>
                      <strong>{destination.name}</strong>
                      <span>Floor {destination.floor}</span>
                    </div>
                  </button>
                ))}
              </div>
              {searchResults.length === 0 ? <div className="empty-state">{t.noResults}</div> : null}
            </section>
          ) : null}

          {activeSection === "detail" && selectedDestination ? (
            <section className="panel-section kiosk-section">
              <div className="section-title-row">
                <h2>{t.detail}</h2>
                <button className="ghost-button" onClick={() => setActiveSection(searchQuery.trim() ? "search" : "categories")}>{t.back}</button>
              </div>
              <div className="detail-card">
                <img src={selectedDestination.image_url || fallbackImage(selectedDestination.name)} alt={selectedDestination.name} />
                <div className="detail-copy">
                  <div className="detail-title-row">
                    <h3>{selectedDestination.name}</h3>
                    <span>Floor {selectedDestination.floor}</span>
                  </div>
                  <p>{selectedDestination.description || selectedDestination.environment_description || t.noResults}</p>
                  <div className="detail-meta">
                    <span>{selectedDestination.category.name}</span>
                  </div>
                  <div className="button-row">
                    <button className="primary-button" id="btn-start-navigation" data-action="start-navigation" onClick={() => void startNavigation()}>
                      {t.startNavigation}
                    </button>
                    <button className="secondary-button" onClick={() => setSelectedDestination(null)}>
                      {t.clear}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "route" && route ? (
            <section className="panel-section kiosk-section">
              <div className="section-title-row">
                <h2>{t.route}</h2>
                <button className="ghost-button" onClick={() => setActiveSection("detail")}>{t.back}</button>
              </div>
              <div className="route-summary large">
                <strong>{route.distance} m</strong>
                <span>{route.steps.length} steps</span>
              </div>
              <div className="route-step-list">
                {route.nodes.map((node, index) => (
                  <div key={node.id} className="route-step-card">
                    <div className="route-step-index">{index + 1}</div>
                    <img src={node.image_url || fallbackImage(node.name)} alt={node.name} />
                    <div>
                      <strong>{node.name}</strong>
                      <span>Floor {node.floor}</span>
                      <p>{node.description || node.environment_description || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="caption">{t.scannerHint}</div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function fallbackImage(text: string) {
  const label = text.slice(0, 20).replace(/[<>&]/g, "");
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" rx="28" fill="#e2e8f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="34" font-family="Arial" fill="#475569">${label}</text>
    </svg>
  `)}`;
}
