"use client";

import type { Timestamp } from "firebase/firestore";
import Link from "next/link";
import type { QuestionStatus, Role } from "@/lib/data";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-700/50",
    secondary:
      "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 disabled:opacity-50",
    ghost: "text-teal-800 hover:bg-teal-50 disabled:opacity-50",
  }[variant];
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const styles =
    variant === "primary"
      ? "bg-teal-700 text-white hover:bg-teal-800"
      : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50";
  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${styles}`}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "teal" | "amber" | "green" | "violet";
  children: React.ReactNode;
}) {
  const styles = {
    neutral: "bg-stone-100 text-stone-700",
    teal: "bg-teal-50 text-teal-800",
    amber: "bg-amber-50 text-amber-800",
    green: "bg-green-50 text-green-800",
    violet: "bg-violet-50 text-violet-800",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  if (role === "lecturer") return <Badge tone="violet">Dosen</Badge>;
  if (role === "mentor") return <Badge tone="teal">Peer mentor</Badge>;
  return <Badge>Mahasiswa</Badge>;
}

export function StatusBadge({ status }: { status: QuestionStatus }) {
  if (status === "verified") return <Badge tone="green">✓ Diverifikasi dosen</Badge>;
  if (status === "answered") return <Badge tone="teal">Sudah dijawab</Badge>;
  return <Badge tone="amber">Belum dijawab</Badge>;
}

/** Synthetic seed data must be labelled (STACK 2026 handbook). */
export function DemoBadge({ demo }: { demo?: boolean }) {
  return demo ? <Badge>Data demo</Badge> : null;
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <p className="py-10 text-center text-sm text-stone-500" role="status">
      {label}
    </p>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
      {children}
    </p>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-stone-600">{sub}</p>}
    </div>
  );
}

const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

export function timeAgo(ts: Timestamp | null | undefined) {
  if (!ts) return "baru saja";
  const seconds = (ts.toMillis() - Date.now()) / 1000;
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return "";
}

export function friendlyError(err: unknown) {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") return "Kamu tidak punya akses untuk tindakan ini.";
  if (code === "unavailable") return "Tidak bisa terhubung ke server. Periksa koneksi internetmu.";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request")
    return "Login dibatalkan.";
  if (code === "auth/popup-blocked") return "Pop-up login diblokir browser. Izinkan pop-up lalu coba lagi.";
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}
