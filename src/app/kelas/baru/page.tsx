"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Button, Card, ErrorBox, friendlyError, PageTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { createCourse, parseTopics } from "@/lib/data";

export default function NewCoursePage() {
  return (
    <RequireAuth>
      <NewCourseForm />
    </RequireAuth>
  );
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-600 focus:outline-none";

function NewCourseForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [topics, setTopics] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createCourse(user, name.trim(), parseTopics(topics));
      router.push(`/kelas/${id}`);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle sub="Kamu akan menjadi dosen kelas ini dan mendapat kode untuk dibagikan ke mahasiswa.">
        Buat kelas
      </PageTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Nama mata kuliah dan kelas</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={3}
              maxLength={100}
              placeholder="contoh: Struktur Data - Kelas A"
              className={inputClass}
              required
            />
            <span className="mt-1 block text-xs text-stone-500">Nama tidak bisa diubah setelah kelas dibuat.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Daftar topik (satu per baris)</span>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows={6}
              placeholder={"Rekursi\nLinked List\nStack dan Queue\nPohon Biner"}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-stone-500">
              Mahasiswa memilih topik saat bertanya, supaya pertanyaan bisa dikelompokkan. Pilihan
              &quot;Lainnya&quot; selalu tersedia.
            </span>
          </label>
          {error && <ErrorBox>{error}</ErrorBox>}
          <Button type="submit" disabled={busy || name.trim().length < 3}>
            {busy ? "Membuat…" : "Buat kelas"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
