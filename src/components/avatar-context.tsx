import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

interface AvatarContextType {
  setTarget: (el: HTMLElement | null) => void;
  isLoaded: boolean;
}

const AvatarContext = createContext<AvatarContextType | null>(null);

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) throw new Error("useAvatar must be used within AvatarProvider");
  return context;
};

export const useAvatarPlaceholder = () => {
  const { setTarget } = useAvatar();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) setTarget(ref.current);
    // ไม่ clear target ตอน unmount — route ใหม่จะ setTarget เองอยู่แล้ว
  }, [setTarget]);

  return ref;
};

// Widget container ที่อยู่นอก React tree ทั้งหมด
// สร้างครั้งเดียว append ลง body โดยตรง React ไม่แตะเลย
function getOrCreateWidgetContainer(): HTMLDivElement {
  const id = "global-webavatar-container";
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText = [
      "position:fixed",
      "z-index:40",
      "overflow:hidden",
      "border-radius:1rem",
      "background:transparent",
      "opacity:0",
      "pointer-events:none",
      "transition:top 0.6s cubic-bezier(0.16,1,0.3,1),left 0.6s cubic-bezier(0.16,1,0.3,1),width 0.6s cubic-bezier(0.16,1,0.3,1),height 0.6s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease",
    ].join(";");
    document.body.appendChild(el);
  }
  return el;
}

// อัปเดต position ของ container ตาม target element โดยตรง ไม่ผ่าน React state
function positionContainer(container: HTMLDivElement, target: HTMLElement, loaded: boolean) {
  const rect = target.getBoundingClientRect();
  container.style.top = `${rect.top}px`;
  container.style.left = `${rect.left}px`;
  container.style.width = `${rect.width}px`;
  container.style.height = `${rect.height}px`;
  container.style.opacity = loaded ? "1" : "0";
  container.style.pointerEvents = loaded ? "auto" : "none";
}

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number>(0);
  const isLoadedRef = useRef(false);

  // sync isLoaded ลง ref เพื่อใช้ใน rAF loop
  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);

  // สร้าง container นอก React tree ครั้งเดียว
  useEffect(() => {
    containerRef.current = getOrCreateWidgetContainer();

    // โหลด script ครั้งเดียว
    const scriptId = "webavatar-jssdk";
    if (!document.getElementById(scriptId)) {
      (window as any).ChatWidgetConfig = {
        mode: "realtime-fullscreen",
        widgetId: "Navigation-Demo",
        container: containerRef.current,
      };
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://webavatar.didthat.cc/chat-widget.js";
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
    }

    // ❌ ไม่มี cleanup เลย — widget และ container อยู่ตลอดอายุของ app
  }, []);

  // rAF loop ติดตาม position ของ target — ทำงานตรง DOM ไม่ผ่าน React state
  useEffect(() => {
    const tick = () => {
      const container = containerRef.current;
      const target = targetRef.current;
      if (container && target) {
        positionContainer(container, target, isLoadedRef.current);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const setTarget = useCallback((el: HTMLElement | null) => {
    if (el) targetRef.current = el;
    // ไม่รับ null — ให้ widget อยู่ที่เดิมระหว่าง page transition
  }, []);

  return (
    <AvatarContext.Provider value={{ setTarget, isLoaded }}>
      {children}
    </AvatarContext.Provider>
  );
};