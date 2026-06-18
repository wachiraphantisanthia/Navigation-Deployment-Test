import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Navigation } from "lucide-react";
import mascot from "@/assets/Avatar.png";
import { useAvatar, useAvatarPlaceholder } from "../components/avatar-context";
import { Button } from "@/components/ui/button";
import { KioskShell } from "@/components/kiosk-shell";
import { stores } from "@/lib/mall-data";

export const Route = createFileRoute("/destination/$storeId")({ component: DestinationPage });
function DestinationPage() {
  const { storeId } = Route.useParams(); const store = stores.find((item) => item.id === storeId) ?? stores[0];
  const { isLoaded } = useAvatar();
  const avatarRef = useAvatarPlaceholder();
  return <KioskShell locale="th"><section className="flex flex-1 flex-col pt-7 w-full max-w-none"><div className="px-6 text-center"><h1 className="text-2xl font-black">Mall navigation system</h1><p className="mt-1 text-[0.68rem] text-muted-foreground">เลือกสถานที่ที่คุณต้องการไป</p></div><div ref={avatarRef} className="relative flex justify-center mt-3 h-52 w-full"><div className="relative h-52 w-60">{!isLoaded && <img src={mascot} alt="มาสคอตกบ Luxe Mall" width={1024} height={1024} className="size-full object-contain" />}</div></div><div className="mt-auto w-full rounded-t-[2.25rem] border border-border bg-card px-5 pb-7 pt-5 shadow-[0_-8px_35px_-22px_var(--foreground)]"><div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center"><Link to="/category/$slug" params={{ slug: store.category }} aria-label="ย้อนกลับ" className="grid size-10 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="size-5" /></Link><h2 className="text-center text-xl font-bold">ยืนยันจุดหมาย</h2><span /></div><div className="mt-5 flex overflow-hidden rounded-xl border border-border"><div className="grid w-28 shrink-0 place-items-center bg-secondary text-xl font-black text-primary">{store.accent}</div><div className="min-w-0 p-4"><h3 className="truncate text-sm font-bold">{store.name}</h3><p className="mt-1 text-[0.65rem] text-muted-foreground">ชั้น {store.floor} · {store.hours}</p></div></div><label className="mt-5 flex items-center justify-center gap-2 text-[0.68rem] text-muted-foreground"><input type="checkbox" className="size-4 accent-primary" /> ต้องการเส้นทางสำหรับผู้ใช้รถเข็น</label><Button asChild className="mx-auto mt-5 flex w-full max-w-md rounded-full"><Link to="/navigate/$storeId" params={{ storeId: store.id }}><Navigation className="size-4" /> เริ่มนำทาง</Link></Button></div>
  </section></KioskShell>;
}