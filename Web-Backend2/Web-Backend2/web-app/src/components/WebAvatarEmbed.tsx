import { useEffect } from "react";

declare global {
  interface Window {
    ChatWidgetConfig?: Record<string, unknown>;
  }
}

export function WebAvatarEmbed() {
  useEffect(() => {
    const widgetId = import.meta.env.VITE_WEBAVATAR_WIDGET_ID as string | undefined;
    if (!widgetId) return;

    window.ChatWidgetConfig = {
      mode: "realtime-widget",
      widgetId,
      avatarUrl: import.meta.env.VITE_WEBAVATAR_AVATAR_URL || "Botnoi",
      greetingInstruction:
        import.meta.env.VITE_WEBAVATAR_GREETING ||
        "You are a friendly indoor navigation assistant.",
      container: "#webavatar-slot",
    };

    if (document.getElementById("webavatar-jssdk")) return;
    const script = document.createElement("script");
    script.id = "webavatar-jssdk";
    script.src = "https://webavatar.didthat.cc/chat-widget.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return <div id="webavatar-slot" className="webavatar-slot" aria-label="WebAvatar container" />;
}
