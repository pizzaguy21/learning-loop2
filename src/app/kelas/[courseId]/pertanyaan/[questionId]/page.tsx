"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  ErrorBox,
  friendlyError,
  RoleBadge,
  Spinner,
  StatusBadge,
  timeAgo,
} from "@/components/ui";
import {
  answersQuery,
  postAnswer,
  postOfficialAnswer,
  questionAuthorRef,
  questionRef,
  verifyAnswer,
  type Answer,
  type Question,
  type QuestionAuthor,
} from "@/lib/data";
import { useCollection, useDoc } from "@/lib/hooks";
import { useCourse } from "../../course-context";

export default function QuestionPage() {
  const { questionId: qid } = useParams<{ questionId: string }>();
  const { cid, me } = useCourse();
  const isLecturer = me.role === "lecturer";

  const qRef = useMemo(() => questionRef(cid, qid), [cid, qid]);
  const question = useDoc<Question>(qRef);
  const aq = useMemo(() => answersQuery(cid, qid), [cid, qid]);
  const answers = useCollection<Answer>(aq);
  // Readable only by the asker and the lecturer; anyone else gets an error,
  // which here simply means "not yours".
  const authorRef = useMemo(() => questionAuthorRef(cid, qid), [cid, qid]);
  const author = useDoc<QuestionAuthor>(authorRef);

  if (question.loading) return <Spinner />;
  if (question.error) return <ErrorBox>{friendlyError(question.error)}</ErrorBox>;
  if (!question.data) return <ErrorBox>Pertanyaan tidak ditemukan.</ErrorBox>;
  const q = question.data;

  const sorted = [...answers.data].sort(
    (a, b) => Number(b.verified) - Number(a.verified) || (a.createdAt?.toMillis() ?? Infinity) - (b.createdAt?.toMillis() ?? Infinity),
  );

  return (
    <div className="space-y-4">
      <Link href={`/kelas/${cid}`} className="text-sm text-teal-800 hover:underline">
        ← Semua pertanyaan
      </Link>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={q.status} />
          <Badge>{q.topic}</Badge>
          <DemoBadge demo={q.demo} />
        </div>
        <h2 className="text-lg font-semibold text-stone-900">{q.title}</h2>
        {q.body && <p className="whitespace-pre-wrap text-stone-800">{q.body}</p>}
        <p className="text-xs text-stone-500">
          {isLecturer && author.data ? (
            <>
              Ditanyakan oleh <strong className="text-stone-700">{author.data.name}</strong> ({author.data.email}),
              hanya terlihat oleh dosen ·{" "}
            </>
          ) : author.data ? (
            <>Pertanyaanmu, teman sekelas melihatnya sebagai anonim · </>
          ) : (
            <>Penanya anonim · </>
          )}
          {timeAgo(q.createdAt)}
        </p>
      </Card>

      <h3 className="pt-2 text-sm font-semibold text-stone-700">{q.answerCount} jawaban</h3>
      {answers.loading ? (
        <Spinner />
      ) : answers.error ? (
        <ErrorBox>{friendlyError(answers.error)}</ErrorBox>
      ) : (
        <ul className="space-y-2">
          {sorted.map((a) => (
            <li key={a.id}>
              <AnswerCard cid={cid} question={q} answer={a} canVerify={isLecturer} />
            </li>
          ))}
        </ul>
      )}

      <AnswerForm question={q} />
    </div>
  );
}

function AnswerCard({
  cid,
  question,
  answer,
  canVerify,
}: {
  cid: string;
  question: Question;
  answer: Answer;
  canVerify: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className={answer.verified ? "border-green-300 bg-green-50/40" : ""}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm">
        <span className="font-medium text-stone-900">{answer.authorName}</span>
        <RoleBadge role={answer.authorRole} />
        {answer.verified && (
          <Badge tone="green">{answer.official ? "✓ Jawaban resmi dosen" : "✓ Diverifikasi dosen"}</Badge>
        )}
        <DemoBadge demo={answer.demo} />
        <span className="text-xs text-stone-500">{timeAgo(answer.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap text-stone-800">{answer.body}</p>
      {canVerify && !answer.verified && (
        <div className="mt-3 space-y-2">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await verifyAnswer(cid, question, answer.id);
              } catch (err) {
                setError(friendlyError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            ✓ Tandai sebagai jawaban benar
          </Button>
          {error && <ErrorBox>{error}</ErrorBox>}
        </div>
      )}
    </Card>
  );
}

function AnswerForm({ question }: { question: Question }) {
  const { cid, me } = useCourse();
  const isLecturer = me.role === "lecturer";
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const text = body.trim();
      if (isLecturer) await postOfficialAnswer(cid, question, me, text);
      else await postAnswer(cid, question, me, text);
      setBody("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-stone-800">
            {isLecturer ? "Tulis jawaban resmi (atau koreksi)" : "Bantu jawab"}
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={3000}
            rows={4}
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-teal-600 focus:outline-none"
            required
          />
        </label>
        <p className="text-xs text-stone-500">
          {isLecturer
            ? "Jawaban resmi langsung ditandai terverifikasi dan menggantikan verifikasi sebelumnya."
            : "Namamu ditampilkan pada jawaban. Hanya penanya yang anonim."}
        </p>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" disabled={busy || body.trim().length === 0}>
          {busy ? "Mengirim…" : isLecturer ? "Kirim jawaban resmi" : "Kirim jawaban"}
        </Button>
      </form>
    </Card>
  );
}
