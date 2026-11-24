"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorBox, friendlyError } from "@/components/ui";
import { askQuestion, OTHER_TOPIC } from "@/lib/data";
import { useCourse } from "../course-context";

const inputClass =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-teal-600 focus:outline-none";

export default function AskPage() {
  const { cid, course, me } = useCourse();
  const router = useRouter();
  const topics = [...course.topics, OTHER_TOPIC];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (me.role === "lecturer")
    return <p className="text-sm text-stone-600">Dosen menjawab pertanyaan, bukan mengajukannya.</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const qid = await askQuestion(cid, me, { title: title.trim(), body: body.trim(), topic });
      router.push(`/kelas/${cid}/pertanyaan/${qid}`);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Tulis pertanyaan</h2>
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          🔒 Teman sekelas <strong>tidak</strong> melihat namamu. Dosen kelas ini tetap bisa melihat
          siapa yang bertanya.
        </p>
        <label className="block">
          <span className="text-sm font-medium text-stone-800">Topik</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass}>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-800">Pertanyaan singkat</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={5}
            maxLength={150}
            placeholder="contoh: Kenapa rekursi butuh base case?"
            className={inputClass}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-800">Penjelasan (opsional)</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={3000}
            rows={6}
            placeholder="Bagian mana yang membingungkan? Apa yang sudah kamu coba?"
            className={inputClass}
          />
        </label>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy || title.trim().length < 5}>
            {busy ? "Mengirim…" : "Kirim pertanyaan"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </Card>
  );
}
