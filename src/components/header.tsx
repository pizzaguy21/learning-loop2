"use client";

import Link from "next/link";
import { signOut, useAuth } from "@/lib/auth";
import { usingEmulators } from "@/lib/firebase";

export function Header() {
  const { user } = useAuth();
  return (
    <header className="border-b border-stone-200 bg-white">
      {usingEmulators && (
        <p className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
          Mode pengembangan lokal (Firebase Emulator). Data di sini tidak tersimpan permanen.
        </p>
      )}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-teal-700 text-sm text-white">
            ↻
          </span>
          Learning Loop
        </Link>
        {user && (
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span className="hidden truncate text-stone-600 sm:inline">{user.displayName ?? user.email}</span>
            <button onClick={() => signOut()} className="shrink-0 text-teal-800 hover:underline">
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
