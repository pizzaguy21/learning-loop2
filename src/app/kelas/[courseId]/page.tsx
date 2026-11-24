"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Badge,
  ButtonLink,
  Card,
  DemoBadge,
  ErrorBox,
  friendlyError,
  Spinner,
  StatusBadge,
  timeAgo,
} from "@/components/ui";
import {
  myQuestionAuthorsQuery,
  questionsQuery,
  type Question,
  type QuestionAuthor,
} from "@/lib/data";
import { useCollection } from "@/lib/hooks";
import { useCourse } from "./course-context";

type Filter = "all" | "todo" | "verified" | "mine";

export default function QuestionListPage() {
  const { cid, course, me } = useCourse();
  const isLecturer = me.role === "lecturer";
  const [filter, setFilter] = useState<Filter>(isLecturer ? "todo" : "all");
  const [topic, setTopic] = useState("");

  const qq = useMemo(() => questionsQuery(cid), [cid]);
  const questions = useCollection<Question>(qq);
  const mq = useMemo(() => (isLecturer ? null : myQuestionAuthorsQuery(cid, me.uid)), [cid, me.uid, isLecturer]);
  const mine = useCollection<QuestionAuthor>(mq);
  const mineIds = useMemo(() => new Set(mine.data.map((a) => a.id)), [mine.data]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Semua" },
    { id: "todo", label: isLecturer ? "Perlu verifikasi" : "Belum diverifikasi" },
    { id: "verified", label: "Diverifikasi" },
    ...(isLecturer ? [] : [{ id: "mine" as const, label: "Pertanyaan saya" }]),
  ];

  const shown = questions.data.filter((q) => {
    if (topic && q.topic !== topic) return false;
    if (filter === "todo") return q.status !== "verified";
    if (filter === "verified") return q.status === "verified";
    if (filter === "mine") return mineIds.has(q.id);
    return true;
  });
  const topics = [...new Set([...course.topics, ...questions.data.map((q) => q.topic)])];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Saring pertanyaan">
          {filters.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === f.id ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!isLecturer && <ButtonLink href={`/kelas/${cid}/tanya`}>+ Tanya</ButtonLink>}
      </div>

      {topics.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          Topik
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5"
          >
            <option value="">Semua topik</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      )}

      {questions.loading ? (
        <Spinner />
      ) : questions.error ? (
        <ErrorBox>{friendlyError(questions.error)}</ErrorBox>
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-600">
          {questions.data.length === 0
            ? isLecturer
              ? "Belum ada pertanyaan. Bagikan kode kelas ke mahasiswa."
              : "Belum ada pertanyaan. Jadilah yang pertama bertanya."
            : "Tidak ada pertanyaan untuk saringan ini."}
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((q) => (
            <li key={q.id}>
              <Link href={`/kelas/${cid}/pertanyaan/${q.id}`}>
                <Card className="space-y-2 hover:border-teal-600">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={q.status} />
                    <Badge>{q.topic}</Badge>
                    {mineIds.has(q.id) && <Badge tone="violet">Pertanyaanmu</Badge>}
                    <DemoBadge demo={q.demo} />
                  </div>
                  <p className="font-medium text-stone-900">{q.title}</p>
                  <p className="text-xs text-stone-500">
                    {q.answerCount} jawaban · aktivitas terakhir {timeAgo(q.lastActivityAt)}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
