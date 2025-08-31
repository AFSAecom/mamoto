"use client";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => { setIsDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => {
    const root = document.documentElement;
    const nowDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nowDark);
    setIsDark(nowDark);
    try { localStorage.setItem("theme", nowDark ? "dark" : "light"); } catch {}
  };
  useEffect(() => { try { if (localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark"); setIsDark(true);} } catch {} }, []);
  return <button onClick={toggle} className="px-3 py-1 rounded-md border border-[--border] bg-[--card] text-[--foreground] shadow-[var(--shadow-sm)]">{isDark ? "Mode clair" : "Mode sombre"}</button>;
}
