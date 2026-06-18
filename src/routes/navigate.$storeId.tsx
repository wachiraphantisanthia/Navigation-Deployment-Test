import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Home,
  QrCode,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import QRCode from "qrcode";
import mascot from "@/assets/Avatar.png";
import { useAvatar, useAvatarPlaceholder } from "@/components/avatar-context";

import { FloorMap } from "@/components/floor-map";
import { KioskShell } from "@/components/kiosk-shell";
import { Button } from "@/components/ui/button";
import { findPath } from "@/lib/navigation-engine";
import { kiosk, stores } from "@/lib/mall-data";
import { generateInstructions } from "@/lib/instruction-generator";

export const Route = createFileRoute("/navigate/$storeId")({
  component: NavigationPage,
});

function getStepIllustration(text: string) {
  const normalized = text.toLowerCase();

  // 1. Siam Tea Atelier
  if (normalized.includes("siam tea atelier")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Shop frame */}
          <rect
            x="10"
            y="20"
            width="80"
            height="70"
            rx="4"
            fill="#FDF8F2"
            stroke="#B87D4B"
            strokeWidth="2.5"
          />
          <path d="M10 35h80v8H10z" fill="#B87D4B" />
          {/* Signboard */}
          <rect x="25" y="23" width="50" height="9" rx="2" fill="#5C381E" />
          <text
            x="50"
            y="29"
            fill="#FDF8F2"
            fontSize="4.5"
            fontWeight="900"
            textAnchor="middle"
          >
            SIAM TEA
          </text>
          {/* Door and Window */}
          <rect
            x="20"
            y="43"
            width="22"
            height="47"
            fill="#EAD4C3"
            stroke="#B87D4B"
            strokeWidth="1.5"
          />
          <line
            x1="31"
            y1="43"
            x2="31"
            y2="90"
            stroke="#B87D4B"
            strokeWidth="1.5"
          />
          <circle cx="37" cy="66" r="1.5" fill="#5C381E" />
          <rect
            x="52"
            y="43"
            width="28"
            height="30"
            fill="#E6EEF4"
            stroke="#B87D4B"
            strokeWidth="1.5"
          />
          {/* Tea Pot & Cup in Window */}
          <path d="M56 65h10v5H56z" fill="#5C381E" />
          <path d="M68 62a3 3 0 0 1 3 3v3h-3z" fill="#B87D4B" />
          {/* Plants */}
          <rect x="83" y="65" width="5" height="10" rx="1" fill="#88B04B" />
          <path d="M81 65c-2-4 2-6 4-6s6 2 4 6z" fill="#4B6F23" />
        </svg>
      </div>
    );
  }

  // 2. Maison Lumière
  if (normalized.includes("maison lumi")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-yellow-500/5 border border-yellow-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Boutique frame */}
          <rect
            x="10"
            y="20"
            width="80"
            height="70"
            rx="4"
            fill="#FAF5EF"
            stroke="#C5A059"
            strokeWidth="2.5"
          />
          {/* Signboard */}
          <rect x="20" y="23" width="60" height="10" rx="1" fill="#1A1A1A" />
          <text
            x="50"
            y="29.5"
            fill="#FAF5EF"
            fontSize="4.5"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            MAISON LUMIÈRE
          </text>
          {/* Glass Windows */}
          <rect
            x="15"
            y="40"
            width="30"
            height="50"
            fill="#F4F8FA"
            stroke="#C5A059"
            strokeWidth="1.5"
          />
          <rect
            x="55"
            y="40"
            width="30"
            height="50"
            fill="#F4F8FA"
            stroke="#C5A059"
            strokeWidth="1.5"
          />
          {/* Mannequin / Dress in window */}
          <path d="M25 78h10v3H25z" fill="#C5A059" />
          <line
            x1="30"
            y1="58"
            x2="30"
            y2="78"
            stroke="#C5A059"
            strokeWidth="2"
          />
          <path d="M27 50c1-2 5-2 6 0l2 15H25z" fill="#E08B79" />
          {/* Hangers and clothing in other window */}
          <line
            x1="60"
            y1="50"
            x2="80"
            y2="50"
            stroke="#1A1A1A"
            strokeWidth="1.5"
          />
          <path
            d="M63 50v18M70 50v22M77 50v16"
            stroke="#D1A7A0"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Spotlights */}
          <circle cx="20" cy="37" r="1.5" fill="#FFD700" />
          <circle cx="80" cy="37" r="1.5" fill="#FFD700" />
        </svg>
      </div>
    );
  }

  // 3. Nara Table
  if (normalized.includes("nara table")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Restaurant frame */}
          <rect
            x="10"
            y="20"
            width="80"
            height="70"
            rx="4"
            fill="#FDF3E7"
            stroke="#D35400"
            strokeWidth="2.5"
          />
          {/* Signboard */}
          <rect x="25" y="23" width="50" height="10" rx="2" fill="#D35400" />
          <text
            x="50"
            y="29.5"
            fill="#FAF5EF"
            fontSize="4.5"
            fontWeight="900"
            textAnchor="middle"
          >
            NARA TABLE
          </text>
          {/* Entryway */}
          <rect
            x="38"
            y="42"
            width="24"
            height="48"
            fill="#FFFDF9"
            stroke="#E67E22"
            strokeWidth="1.5"
          />
          {/* Table set inside */}
          <rect
            x="18"
            y="55"
            width="16"
            height="35"
            rx="1"
            fill="#F5CBA7"
            stroke="#D35400"
            strokeWidth="1.5"
          />
          <circle cx="26" cy="62" r="3" fill="#E67E22" />
          <line
            x1="22"
            y1="62"
            x2="22"
            y2="62.1"
            stroke="#333"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="62"
            x2="30"
            y2="62.1"
            stroke="#333"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Lanterns */}
          <path d="M18 36c-1-3 1-5 3-5s4 2 3 5z" fill="#E67E22" />
          <path d="M78 36c-1-3 1-5 3-5s4 2 3 5z" fill="#E67E22" />
        </svg>
      </div>
    );
  }

  // 4. Golden Grocer
  if (normalized.includes("golden grocer")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-green-500/5 border border-green-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Supermarket frame */}
          <rect
            x="10"
            y="20"
            width="80"
            height="70"
            rx="4"
            fill="#F4FAF1"
            stroke="#27AE60"
            strokeWidth="2.5"
          />
          {/* Signboard */}
          <rect x="22" y="23" width="56" height="10" rx="1" fill="#27AE60" />
          <text
            x="50"
            y="29.5"
            fill="#FAF5EF"
            fontSize="4"
            fontWeight="900"
            textAnchor="middle"
          >
            GOLDEN GROCER
          </text>
          {/* Sliding Glass Doors */}
          <rect
            x="32"
            y="40"
            width="36"
            height="50"
            fill="#EBF7EA"
            stroke="#27AE60"
            strokeWidth="1.5"
          />
          <line
            x1="50"
            y1="40"
            x2="50"
            y2="90"
            stroke="#27AE60"
            strokeWidth="1.5"
          />
          {/* Display bins on the sides */}
          <rect
            x="14"
            y="60"
            width="14"
            height="30"
            fill="#E2F0D9"
            stroke="#27AE60"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="66" r="2.2" fill="#E74C3C" />
          <circle cx="24" cy="66" r="2.2" fill="#F1C40F" />
          <circle cx="21" cy="72" r="2.2" fill="#2ECC71" />
          {/* Cart Icon */}
          <rect
            x="74"
            y="65"
            width="10"
            height="25"
            fill="#27AE60"
            opacity="0.1"
          />
          <path d="M72 70h8v8h-8z" stroke="#27AE60" strokeWidth="1.2" />
          <line
            x1="72"
            y1="78"
            x2="72"
            y2="82"
            stroke="#27AE60"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    );
  }

  // 5. Aster Beauty
  if (normalized.includes("aster beauty")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-pink-500/5 border border-pink-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Cosmetics counter frame */}
          <rect
            x="10"
            y="20"
            width="80"
            height="70"
            rx="4"
            fill="#FFF5F7"
            stroke="#D63031"
            strokeWidth="2.5"
          />
          {/* Signboard */}
          <rect x="25" y="23" width="50" height="9" rx="2" fill="#D63031" />
          <text
            x="50"
            y="29"
            fill="#FAF5EF"
            fontSize="4.5"
            fontWeight="900"
            textAnchor="middle"
          >
            ASTER BEAUTY
          </text>
          {/* Counter display cases */}
          <rect
            x="15"
            y="55"
            width="22"
            height="35"
            fill="#F4F8FA"
            stroke="#D63031"
            strokeWidth="1.5"
          />
          <rect
            x="63"
            y="55"
            width="22"
            height="35"
            fill="#F4F8FA"
            stroke="#D63031"
            strokeWidth="1.5"
          />
          {/* Perfume bottle on display */}
          <rect x="22" y="64" width="8" height="12" rx="1.5" fill="#E84393" />
          <circle cx="26" cy="60" r="2" fill="#FF7675" />
          {/* Makeup mirror in middle */}
          <circle
            cx="50"
            cy="54"
            r="10"
            fill="#EBF5FA"
            stroke="#D63031"
            strokeWidth="1.5"
          />
          <line
            x1="50"
            y1="64"
            x2="50"
            y2="72"
            stroke="#D63031"
            strokeWidth="2"
          />
          <line
            x1="42"
            y1="72"
            x2="58"
            y2="72"
            stroke="#D63031"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  // 6. Well Pharmacy
  if (normalized.includes("well pharmacy")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-teal-500/5 border border-teal-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Pharmacy frame */}
          <rect
            x="10"
            y="20"
            width="80"
            height="70"
            rx="4"
            fill="#F2FAFA"
            stroke="#008080"
            strokeWidth="2.5"
          />
          {/* Signboard */}
          <rect x="24" y="23" width="52" height="10" rx="1" fill="#008080" />
          <text
            x="50"
            y="29.5"
            fill="#FAF5EF"
            fontSize="4.2"
            fontWeight="900"
            textAnchor="middle"
          >
            WELL PHARMACY
          </text>
          {/* Large Medical Cross */}
          <path d="M47 43h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#00B894" />
          {/* Counter and pharmacist stand */}
          <rect
            x="15"
            y="65"
            width="70"
            height="25"
            fill="#E6F2F2"
            stroke="#008080"
            strokeWidth="1.5"
          />
          {/* Medicine bottles */}
          <rect x="20" y="70" width="5" height="10" rx="0.5" fill="#008080" />
          <rect x="27" y="72" width="4" height="8" rx="0.5" fill="#00B894" />
          <rect x="75" y="70" width="5" height="10" rx="0.5" fill="#008080" />
        </svg>
      </div>
    );
  }

  // 7. Elevator (ลิฟต์)
  if (normalized.includes("ลิฟต์") || normalized.includes("elevator")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-sm p-2">
        <svg
          viewBox="0 0 100 100"
          className="size-full animate-pulse"
          fill="none"
        >
          {/* Elevator shaft */}
          <rect
            x="20"
            y="15"
            width="60"
            height="75"
            rx="3"
            fill="#EBF2FA"
            stroke="#3182CE"
            strokeWidth="2.5"
          />
          {/* Glass Doors */}
          <rect
            x="26"
            y="25"
            width="23"
            height="65"
            fill="#D3E2F2"
            stroke="#3182CE"
            strokeWidth="1.5"
          />
          <rect
            x="51"
            y="25"
            width="23"
            height="65"
            fill="#D3E2F2"
            stroke="#3182CE"
            strokeWidth="1.5"
          />
          {/* Directional Arrows panel */}
          <rect x="44" y="18" width="12" height="5" rx="1" fill="#1A202C" />
          <path
            d="M47 21h2l1-2 1 2h2"
            stroke="#ECC94B"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Up arrow */}
          <path
            d="M50 22v-3m-2 1.5L50 19l2 1.5"
            stroke="#48BB78"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 8. Escalator (บันไดเลื่อน)
  if (normalized.includes("บันไดเลื่อน") || normalized.includes("escalator")) {
    return (
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-indigo-500/5 border border-indigo-500/20 shadow-sm p-2">
        <svg viewBox="0 0 100 100" className="size-full" fill="none">
          {/* Escalator Side panels */}
          <path
            d="M15 80L55 35H85"
            stroke="#5A67D8"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M15 80L55 35H85"
            stroke="#EBF4FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Steps */}
          <path
            d="M15 80h10v-5h10v-5h10v-5h10v-5h10v-5h10"
            stroke="#5A67D8"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Handrail */}
          <path
            d="M13 77L53 32H83"
            stroke="#1A202C"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Direction sign */}
          <circle cx="50" cy="65" r="5" fill="#48BB78" />
          <path
            d="M50 67v-4m-1.5 1.5L50 63l1.5 1.5"
            stroke="#FFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 9. Default / Atrium / Walkway (ทางเดิน/โถงทางเดิน)
  return (
    <div className="relative flex size-36 items-center justify-center rounded-2xl bg-gray-500/5 border border-gray-500/20 shadow-sm p-2">
      <svg viewBox="0 0 100 100" className="size-full" fill="none">
        {/* Mall archways & roof */}
        <rect
          x="10"
          y="15"
          width="80"
          height="75"
          rx="2"
          fill="#FAFAFA"
          stroke="#718096"
          strokeWidth="2"
        />
        <path d="M10 40c20-10 60-10 80 0v50H10z" fill="#EDF2F7" opacity="0.5" />
        <path
          d="M30 90V55c0-10 20-10 40 0v35"
          stroke="#4A5568"
          strokeWidth="2.5"
        />
        {/* Skylight dome */}
        <path
          d="M20 15C35 5 65 5 80 15"
          stroke="#718096"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {/* Decorative Planter pot */}
        <rect
          x="15"
          y="70"
          width="8"
          height="20"
          fill="#A0AEC0"
          stroke="#4A5568"
          strokeWidth="1.5"
        />
        <path d="M13 70c-2-6 2-10 6-10s8 4 6 10z" fill="#48BB78" />
        {/* Straight direction arrow */}
        <path
          d="M50 82V62m-3 3l3-3 3 3"
          stroke="#319795"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function NavigationPage() {
  const { storeId } = Route.useParams();
  const store = stores.find((item) => item.id === storeId) ?? stores[0];
  const [accessible, setAccessible] = useState(false);
  const route = useMemo(
    () => findPath(kiosk.nodeId, store.nodeId, accessible),
    [store.nodeId, accessible],
  );
  const { isLoaded } = useAvatar();
  const avatarContainerRef = useAvatarPlaceholder();
  const [qr, setQr] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const destinationFloor = store.floor === "G" ? 0 : Number(store.floor);
  const instructions = useMemo(
    () => generateInstructions(route.nodes, "th"),
    [route.nodes],
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset step index if instructions list changes
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [instructions]);

  useEffect(() => {
    let active = true;
    const token = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
    const url = `${window.location.origin}/route/${token}?store=${store.id}`;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then((image) => {
      if (active) setQr(image);
    });
    return () => {
      active = false;
    };
  }, [store.id]);

  const activeInstruction =
    instructions[currentStepIndex]?.text || "กำลังคำนวณเส้นทาง...";
  const activeNodeId = instructions[currentStepIndex]?.nodeId;
  const activeFloor = instructions[currentStepIndex]?.floor ?? destinationFloor;

  return (
    <KioskShell locale="th">
      <section className="flex flex-1 flex-col pt-5 w-full max-w-none">
        <div className="px-6 text-center">
          <h1 className="text-xl font-black">เส้นทางไป {store.name}</h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            ตำแหน่งเริ่มต้น: {kiosk.label} · ชั้น {kiosk.floor}
          </p>
        </div>
        <div className="mt-3 px-4">
          <div className="flex overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid w-20 shrink-0 place-items-center bg-secondary font-black text-primary">
              {store.accent}
            </div>
            <div className="min-w-0 p-3">
              <h2 className="truncate text-xs font-bold">{store.name}</h2>
              <p className="mt-1 text-[0.58rem] text-muted-foreground">
                ชั้น {store.floor} · ระยะทาง {route.distance || 68} เมตร ·
                ประมาณ 3 นาที
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
            <FloorMap
              nodes={route.nodes}
              floor={activeFloor}
              compact
              destinationName={store.name}
              activeNodeId={activeNodeId}
            />
            <aside
              ref={avatarContainerRef}
              className="relative flex h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-3 text-center shadow-sm"
            >
              {!isLoaded && (
                <>
                  <style>{`
                    @keyframes float {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-12px); }
                    }
                    .animate-float {
                      animation: float 4s ease-in-out infinite;
                    }
                  `}</style>
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 opacity-50" />
                  <img
                    src={mascot}
                    alt="Navigation Mascot"
                    className="relative z-10 w-full max-h-48 object-contain animate-float"
                  />
                  <div className="relative z-10 mt-3 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                    <p className="text-[0.62rem] font-bold text-primary">
                      กบน้อยนำทาง
                    </p>
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>

        {/* Flash Card Section */}
        <div className="relative z-10 mt-auto rounded-t-[2.25rem] border border-border bg-card px-4 pb-6 pt-5 shadow-[0_-8px_35px_-22px_var(--foreground)]">
          <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
            <Link
              to="/destination/$storeId"
              params={{ storeId }}
              aria-label="ย้อนกลับ"
              className="grid size-10 place-items-center rounded-full hover:bg-secondary"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h2 className="text-center text-lg font-bold">คำแนะนำการเดินทาง</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQR(true)}
              className="grid size-10 place-items-center rounded-full hover:bg-secondary border-none bg-transparent"
              aria-label="แสดง QR Code"
            >
              <QrCode className="size-5 text-primary" />
            </Button>
          </div>

          {/* Flash Card Container */}
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-border/60 bg-secondary/30 p-5 shadow-inner">
            <span className="text-[0.68rem] font-extrabold tracking-widest text-primary uppercase">
              ขั้นตอนที่ {currentStepIndex + 1} จาก {instructions.length}
            </span>

            {/* Illustration in the Center */}
            <div className="my-5 flex items-center justify-center transition-all duration-300 transform scale-105">
              {getStepIllustration(activeInstruction)}
            </div>

            {/* Instruction Text */}
            <p className="px-2 text-center text-sm font-bold leading-relaxed text-foreground min-h-[2.5rem]">
              {activeInstruction}
            </p>

            {/* Steps Progress Dots */}
            <div className="mt-4 flex gap-1.5 justify-center">
              {instructions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`size-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? "w-4 bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`ไปที่ขั้นตอนที่ ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Flash Card Controls */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={currentStepIndex === 0}
              onClick={() =>
                setCurrentStepIndex((prev) => Math.max(0, prev - 1))
              }
              className="flex-1 rounded-full text-xs py-5"
            >
              <ChevronLeft className="size-4 mr-1" /> ย้อนกลับ
            </Button>

            <Button
              variant="default"
              disabled={currentStepIndex === instructions.length - 1}
              onClick={() =>
                setCurrentStepIndex((prev) =>
                  Math.min(instructions.length - 1, prev + 1),
                )
              }
              className="flex-1 rounded-full text-xs py-5 font-bold"
            >
              ถัดไป <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>

          {/* Accessibility & Reset Controls */}
          <div className="mt-4 border-t border-border/50 pt-4 flex flex-col gap-3">
            <Button
              variant={accessible ? "default" : "outline"}
              size="sm"
              onClick={() => setAccessible((value) => !value)}
              className="mx-auto flex rounded-full text-[0.62rem]"
            >
              เส้นทางสำหรับผู้ใช้รถเข็น {accessible ? "เปิด" : "ปิด"}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStepIndex(0);
                  window.location.reload();
                }}
                className="rounded-full"
              >
                <RefreshCw className="size-4" /> เริ่มใหม่
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/">
                  <Home className="size-4" /> กลับหน้าหลัก
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 animate-out fade-out zoom-out-95">
            <button
              onClick={() => setShowQR(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="ปิด"
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="rounded-2xl bg-primary/10 p-3 mb-3">
                <QrCode className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">สแกนเพื่อเดินต่อบนมือถือ</h3>
              <p className="mt-1 text-xs text-muted-foreground px-4">
                สแกน QR Code เพื่อนำทางต่อบนสมาร์ตโฟนของคุณได้ทันที สะดวก
                รวดเร็ว
              </p>

              <div className="relative mt-5 w-60 h-64 overflow-hidden rounded-2xl border border-primary/20 bg-white p-3 shadow-inner flex items-center justify-center">
                {qr ? (
                  <img
                    src={qr}
                    alt={`คิวอาร์โค้ดเส้นทางไป ${store.name}`}
                    width={320}
                    height={320}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full animate-pulse rounded-lg bg-secondary" />
                )}
              </div>

              <div className="mt-4 rounded-full bg-secondary/80 px-4 py-1.5 text-[0.68rem] font-medium text-muted-foreground">
                หมดอายุภายใน 30 นาที
              </div>
            </div>
          </div>
        </div>
      )}
    </KioskShell>
  );
}
