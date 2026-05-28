"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Swords, FlaskConical, Home } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/review", label: "Game Review", icon: BarChart3 },
  { href: "/analysis", label: "Analysis", icon: FlaskConical },
  { href: "/play", label: "Play", icon: Swords },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#262421] border-b border-white/[0.04] px-4 py-0 flex items-center gap-1 h-11 shrink-0">
      {/* Logo */}
      <Link href="/" className="text-sm font-bold text-[#e8e6e3] mr-4 tracking-tight">
        Xiangqi<span className="text-[#81b64c]">.app</span>
      </Link>

      {/* Nav links */}
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              active
                ? "bg-white/[0.08] text-[#e8e6e3]"
                : "text-[#8b8784] hover:text-[#e8e6e3] hover:bg-white/[0.04]"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
