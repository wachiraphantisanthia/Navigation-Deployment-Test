import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import mascot from "@/assets/Avatar.png";
import { useAvatar, useAvatarPlaceholder } from "../components/avatar-context";
import { KioskShell } from "@/components/kiosk-shell";
import { categories, stores, type Locale } from "@/lib/mall-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mall Directory & Indoor Navigation | Aurum" },
      { name: "description", content: "Find shops, dining and facilities, then follow accessible turn-by-turn indoor directions." },
      { property: "og:title", content: "Aurum Galleria Indoor Navigator" },
      { property: "og:description", content: "Search the mall and navigate every floor." },
    ],
  }),
  component: Index,
});

function Index() {
  const [locale, setLocale] = useState<Locale>("th");
  const [query, setQuery] = useState("");
  const matches = useMemo(() => query.trim() ? stores.filter((store) => store.name.toLowerCase().includes(query.toLowerCase())) : [], [query]);
  const { isLoaded } = useAvatar();
  const avatarRef = useAvatarPlaceholder();

  return (
    <KioskShell locale={locale} setLocale={setLocale}>
      <section className="relative flex flex-1 flex-col pt-7 w-full max-w-none">
        <div className="px-6 text-center">
          <h1 className="text-2xl font-black tracking-tight">Mall navigation system</h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">เลือกสถานที่ที่คุณต้องการไป</p>
        </div>

        <div ref={avatarRef} className="relative flex justify-center mt-4 h-64 w-full">
          <div className="relative h-64 w-72">
            <div className="absolute inset-10 rounded-full bg-primary/10 blur-3xl" />
            {!isLoaded && <img src={mascot} alt="มาสคอตกบนำทางของ Luxe Mall" width={1024} height={1024} className="relative size-full object-contain" />}
          </div>
        </div>

        <div className="relative z-10 mt-auto w-full rounded-t-[2.25rem] border border-border bg-card px-4 pb-6 pt-5 shadow-[0_-8px_35px_-22px_var(--foreground)]">
          <div className="relative">
            <label className="flex min-h-9 items-center gap-3 rounded-xl border border-border bg-background px-4">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                maxLength={80} 
                placeholder="ค้นหาร้านค้า / สถานที่" 
                className="min-w-0 flex-1 bg-transparent text-xs outline-none" 
              />
              <Search className="size-4 text-muted-foreground shrink-0" />
              <button 
                onClick={() => setLocale(locale === "th" ? "en" : "th")} 
                className="ml-2 min-h-8 rounded-full border border-border bg-card px-3 text-[0.6rem] font-bold uppercase text-foreground shrink-0"
              >
                {locale === "th" ? "TH 🇹🇭" : "EN 🇬🇧"}
              </button>
            </label>

            {matches.length > 0 && (
              <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-2xl">
                {matches.map((store) => (
                  <Link 
                    key={store.id} 
                    to="/destination/$storeId" 
                    params={{ storeId: store.id }} 
                    className="flex items-center justify-between rounded-lg p-3 text-xs font-bold hover:bg-secondary"
                  >
                    <span>{store.name}</span>
                    <span className="text-muted-foreground">ชั้น {store.floor}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.map(({ slug, names, icon: Icon }) => (
              <Link 
                key={slug} 
                to="/category/$slug" 
                params={{ slug }} 
                className="group grid min-h-20 place-items-center rounded-xl border border-border bg-card px-2 py-2 text-center transition hover:border-primary hover:bg-secondary"
              >
                <Icon className="size-6 text-primary" />
                <span className="mt-1 block text-[0.68rem] font-bold leading-tight">{names[locale]}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </KioskShell>
  );
}