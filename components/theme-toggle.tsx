"use client";

import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

function getSnapshot(): Theme {
  return (localStorage.getItem("cartograph-theme") as Theme) || "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const applyTheme = (nextTheme: Theme) => {
    try {
      localStorage.setItem("cartograph-theme", nextTheme);
      document.cookie = `cartograph-theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    const isDark =
      nextTheme === "dark" ||
      (nextTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const root = document.documentElement;
    root.setAttribute("data-theme", nextTheme);
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div
      className="flex items-center rounded border border-[var(--panel-border)] bg-[var(--panel)] p-0.5 text-[11px] font-mono text-[var(--color-muted)]"
      data-testid="theme-control"
    >
      <button
        type="button"
        onClick={() => applyTheme("system")}
        className={`px-2 py-0.5 rounded transition-colors ${
          theme === "system"
            ? "bg-[var(--panel-border)] text-[var(--color-foreground)] font-semibold"
            : "hover:text-[var(--color-foreground)]"
        }`}
        title="Follow System"
      >
        system
      </button>
      <button
        type="button"
        onClick={() => applyTheme("light")}
        className={`px-2 py-0.5 rounded transition-colors ${
          theme === "light"
            ? "bg-[var(--panel-border)] text-[var(--color-foreground)] font-semibold"
            : "hover:text-[var(--color-foreground)]"
        }`}
        title="Force Light"
      >
        light
      </button>
      <button
        type="button"
        onClick={() => applyTheme("dark")}
        className={`px-2 py-0.5 rounded transition-colors ${
          theme === "dark"
            ? "bg-[var(--panel-border)] text-[var(--color-foreground)] font-semibold"
            : "hover:text-[var(--color-foreground)]"
        }`}
        title="Force Dark"
      >
        dark
      </button>
    </div>
  );
}
