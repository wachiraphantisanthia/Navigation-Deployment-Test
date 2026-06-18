import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Store as StoreIcon } from "lucide-react";
import { useMemo, useState } from "react";
import mascot from "@/assets/Avatar.png";
import { useAvatar, useAvatarPlaceholder } from "../components/avatar-context";
import { Button } from "@/components/ui/button";
import { KioskShell } from "@/components/kiosk-shell";
import { categories, stores, type Locale } from "@/lib/mall-data";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Aurum Galleria` }, { name: "description", content: "Browse mall destinations by category and floor." }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [query, setQuery] = useState("");
  const [floor, setFloor] = useState("All");
  const [locale, setLocale] = useState<Locale>("th");
  const category = categories.find((item) => item.slug === slug);
  const filtered = useMemo(() => stores.filter((store) => (store.category === slug || ["services","restrooms","atm","information","parking","promotions"].includes(slug)) && store.name.toLowerCase().includes(query.toLowerCase()) && (floor === "All" || store.floor === floor)).sort((a,b) => a.name.localeCompare(b.name)), [slug, query, floor]);
  const { isLoaded } = useAvatar();
  const avatarRef = useAvatarPlaceholder();

  return (
    <KioskShell locale={locale} setLocale={setLocale}>
      <section className="flex flex-1 flex-col pt-7 w-full max-w-none">
        <div className="px-6 text-center">
          <h1 className="text-2xl font-black">Mall navigation system</h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">เลือกสถานที่ที่คุณต้องการไป</p>
        </div>
        
        <div ref={avatarRef} className="relative flex justify-center mt-3 h-48 w-full">
          <div className="relative h-48 w-56">
            {!isLoaded && <img src={mascot} alt="มาสคอตช้าง Luxe Mall" width={1024} height={1024} className="size-full object-contain" />}
          </div>
        </div>
        
        <div className="mt-auto w-full rounded-t-[2.25rem] border border-border bg-card px-4 pb-6 pt-5 shadow-[0_-8px_35px_-22px_var(--foreground)]">
          <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
            <Link to="/" aria-label="กลับหน้าหลัก" className="grid size-10 place-items-center rounded-full hover:bg-secondary">
              <ArrowLeft className="size-5" />
            </Link>
            <h2 className="text-center text-xl font-bold">{category?.names[locale] ?? "สถานที่"}</h2>
            <span />
          </div>

          <div className="mt-3 text-center">
            <p className="text-[0.6rem] text-muted-foreground">พบ {filtered.length} สถานที่ในหมวดหมู่นี้</p>
            <p className="mt-1 text-[0.55rem] text-muted-foreground">{category?.description[locale]}</p>
          </div>

          <label className="mt-4 flex min-h-9 items-center gap-3 rounded-xl border border-border bg-background px-4">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              maxLength={80} 
              placeholder={locale === "th" ? "ค้นหาร้านค้า" : "Search stores"} 
              className="w-full bg-transparent text-xs outline-none" 
            />
            <Search className="size-4 text-muted-foreground shrink-0" />
            <button 
              onClick={() => setLocale(locale === "th" ? "en" : "th")} 
              className="ml-2 min-h-8 rounded-full border border-border bg-card px-3 text-[0.6rem] font-bold uppercase text-foreground shrink-0"
            >
              {locale === "th" ? "TH 🇹🇭" : "EN 🇬🇧"}
            </button>
          </label>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {["All","G","1","2"].map((item) => (
              <Button 
                key={item} 
                size="sm" 
                variant={floor === item ? "primary" : "outline"} 
                onClick={() => setFloor(item)} 
                className="shrink-0 rounded-full"
              >
                {item === "All" ? (locale === "th" ? "ทุกชั้น" : "All floors") : (locale === "th" ? `ชั้น ${item}` : `Floor ${item}`)}
              </Button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filtered.map((store) => (
              <Link 
                key={store.id} 
                to="/destination/$storeId" 
                params={{ storeId: store.id }} 
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary"
              >
                <div className="grid h-20 place-items-center bg-secondary font-black text-primary">
                  {store.accent}
                </div>
                <div className="p-2.5">
                  <h3 className="truncate text-xs font-bold">{store.name}</h3>
                  <p className="mt-1 text-[0.58rem] text-muted-foreground">{locale === "th" ? `ชั้น ${store.floor}` : `Floor ${store.floor}`} · {store.hours}</p>
                  {store.tags && store.tags.length > 0 && (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {store.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-[0.5rem] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {!filtered.length && (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <StoreIcon className="mx-auto size-8 text-primary" />
              <h3 className="mt-3 font-black">{locale === "th" ? "ไม่พบสถานที่" : "No places found"}</h3>
              <Button className="mt-4" onClick={() => { setQuery(""); setFloor("All"); }}>
                {locale === "th" ? "ล้างตัวกรอง" : "Clear filters"}
              </Button>
            </div>
          )}
        </div>
      </section>
    </KioskShell>
  );
}