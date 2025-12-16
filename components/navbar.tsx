"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/trips/");
    }
    return pathname === href;
  };

  return (
    <nav className="bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3 text-sm font-semibold">
        <Link
          href="/"
          className={isActive("/") ? "border-b-2 border-primary" : ""}
        >
          Trip Planner
        </Link>
        <Link
          href="/saved-trips"
          className={isActive("/saved-trips") ? "border-b-2 border-primary" : ""}
        >
          My Trips
        </Link>
      </div>
    </nav>
  );
}
