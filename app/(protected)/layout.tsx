import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 text-sm">
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/">Trip Planner</Link>
            <Link href="/saved-trips" className="text-slate-700 hover:text-blue-600">
              My trips
            </Link>
          </div>
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
    </main>
  );
}


