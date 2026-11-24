"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GoogleButton } from "@/components/require-auth";
import { ButtonLink, Card, ErrorBox, friendlyError, PageTitle, RoleBadge, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { myMembershipsQuery, type Member } from "@/lib/data";
import { useCollection } from "@/lib/hooks";

export default function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <MyCourses uid={user.uid} /> : <Landing />;
}

function Landing() {
  return (
    <div className="space-y-8 py-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-stone-900">
          Bingung di kelas? Tanya tanpa malu.
        </h1>
        <p className="text-stone-700">
          Learning Loop adalah ruang tanya jawab untuk satu mata kuliah. Teman sekelas tidak melihat
          namamu, teman dan peer mentor bisa menjawab, lalu dosen memverifikasi jawaban yang benar.
        </p>
      </div>
      <GoogleButton />
      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          ["1. Tanya", "Masuk dengan kode kelas, tulis pertanyaan. Namamu disembunyikan dari teman sekelas."],
          ["2. Dijawab", "Teman sekelas dan peer mentor membantu menjawab."],
          ["3. Diverifikasi", "Dosen menandai jawaban yang benar atau menulis jawaban resmi."],
        ].map(([title, text]) => (
          <li key={title}>
            <Card className="h-full">
              <p className="font-medium text-stone-900">{title}</p>
              <p className="mt-1 text-sm text-stone-600">{text}</p>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MyCourses({ uid }: { uid: string }) {
  const q = useMemo(() => myMembershipsQuery(uid), [uid]);
  const { data: memberships, loading, error } = useCollection<Member>(q);
  const courses = useMemo(
    () => [...memberships].sort((a, b) => a.courseName.localeCompare(b.courseName, "id")),
    [memberships],
  );

  return (
    <div>
      <PageTitle sub="Kelas yang kamu ikuti atau ajar.">Kelas saya</PageTitle>
      <div className="mb-6 flex flex-wrap gap-2">
        <ButtonLink href="/gabung">Gabung kelas</ButtonLink>
        <ButtonLink href="/kelas/baru" variant="secondary">
          Buat kelas (dosen)
        </ButtonLink>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox>{friendlyError(error)}</ErrorBox>
      ) : courses.length === 0 ? (
        <p className="text-sm text-stone-600">
          Kamu belum bergabung ke kelas mana pun. Minta kode kelas ke dosenmu.
        </p>
      ) : (
        <ul className="space-y-2">
          {courses.map((m) => (
            <li key={m.courseId}>
              <Link href={`/kelas/${m.courseId}`}>
                <Card className="flex items-center justify-between gap-3 hover:border-teal-600">
                  <span className="font-medium text-stone-900">{m.courseName}</span>
                  <RoleBadge role={m.role} />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
