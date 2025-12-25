"use client";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon";
import { SunIcon } from "@/components/tiptap-icons/sun-icon";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const prefersMetaDark = !!document?.querySelector(
        'meta[name="color-scheme"][content="dark"]'
      );
      const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      return prefersMetaDark || stored === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setIsDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Initialize from explicit meta or saved preference; default stays light
    try {
      const prefersMetaDark = !!document.querySelector(
        'meta[name="color-scheme"][content="dark"]'
      );
      const stored = localStorage.getItem("theme");
      const initialDarkMode = prefersMetaDark || stored === "dark";
      setIsDarkMode(initialDarkMode);
    } catch {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {}
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark);

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      data-style="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  );
}
