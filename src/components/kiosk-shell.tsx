import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const REQUIRED_CLICKS = 10;
const PASSWORD = "123456";

export function KioskShell({ children, locale, setLocale }: { children: ReactNode; locale: string; setLocale?: (value: "th" | "en" | "cn") => void }) {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (clickCount >= REQUIRED_CLICKS) {
      setShowUnlockModal(true);
      setClickCount(0);
    }
  }, [clickCount]);

  const handleLogoClick = () => {
    setClickCount((prev) => prev + 1);
  };

  const handleKeyPress = (value: string) => {
    if (value === "backspace") {
      setPassword((prev) => prev.slice(0, -1));
      setError("");
      return;
    }

    if (value === "clear") {
      setPassword("");
      setError("");
      return;
    }

    if (value === "enter") {
      if (password === PASSWORD) {
        setShowUnlockModal(false);
        setPassword("");
        setError("");
        navigate({ to: "/blank-admin" });
        return;
      }

      setError("Invalid password");
      return;
    }

    if (password.length >= PASSWORD.length) return;

    setPassword((prev) => prev + value);
    setError("");
  };

  const keyboardRows = useMemo(
    () => [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["0", "clear", "backspace"],
    ],
    []
  );

  return (
    <main className="min-h-screen w-full bg-background safe-area-left safe-area-right">
      <div className="flex min-h-full w-full flex-col bg-background max-w-none">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6 sm:py-5">
         <Link
  to="/"
  onClick={handleLogoClick}
  className="flex min-w-0 items-center gap-2.5 text-primary"
>
            <Sparkles className="size-6 shrink-0 fill-primary/20" />
            <span className="min-w-0"><span className="block truncate text-sm font-bold tracking-wide">NAVIGATION SYSTEM</span><span className="block text-[0.45rem] uppercase tracking-[0.14em] text-muted-foreground">Your journey, made easy</span></span>
          </Link>
          <button onClick={() => setLocale?.(locale === "th" ? "en" : "th")} className="min-h-9 rounded-full border border-border bg-card px-3 text-[0.65rem] font-bold uppercase text-foreground">{locale === "th" ? "TH 🇹🇭" : "EN 🇬🇧"}</button>
        </header>
        <div className="flex-1 safe-area-bottom">
          {children}
        </div>
      </div>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Access code</p>
              <h2 className="mt-2 text-2xl font-bold">Enter password</h2>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-card p-3">
              <input
                type="password"
                value={password}
                readOnly
                className="w-full bg-transparent text-center text-2xl font-semibold outline-none"
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="mt-3 text-center text-sm text-red-500">{error}</p> : null}

            <div className="mt-5 grid gap-2">
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-2">
                  {row.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeyPress(key)}
                      className={`min-h-12 rounded-xl border px-3 text-sm font-semibold ${
                        key === "enter"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {key === "backspace" ? "⌫" : key === "clear" ? "Reset" : key}
                    </button>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleKeyPress("enter")}
                className="min-h-12 rounded-xl border border-primary bg-primary text-sm font-semibold text-primary-foreground"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}