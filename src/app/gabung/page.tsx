"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Button, Card, ErrorBox, friendlyError, PageTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { joinCourse, JoinError } from "@/lib/data";

export default function JoinPage() {
  return (
    <RequireAuth>
      <JoinForm />
    </RequireAuth>
  );
}

function JoinForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const courseId = await joinCourse(user, code);
      router.push(`/kelas/${courseId}`);
    } catch (err) {
      setError(err instanceof JoinError ? err.message : friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle sub="Masukkan 6 karakter kode kelas dari dosenmu.">Gabung kelas</PageTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Kode kelas</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="contoh: K7MP2Q"
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-lg tracking-widest uppercase focus:border-teal-600 focus:outline-none"
              required
            />
          </label>
          {error && <ErrorBox>{error}</ErrorBox>}
          <Button type="submit" disabled={busy || code.trim().length < 6}>
            {busy ? "Bergabung…" : "Gabung"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
