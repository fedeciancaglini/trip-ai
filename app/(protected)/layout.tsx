import { AuthButton } from "@/components/auth-button";
import { Navbar } from "@/components/navbar";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 text-sm">
          <Navbar />
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
    </main>
  );
}


