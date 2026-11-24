"use client";

import { useMemo, useState } from "react";
import { Button, Card, DemoBadge, ErrorBox, friendlyError, RoleBadge, Spinner } from "@/components/ui";
import { membersQuery, setMemberRole, type Member } from "@/lib/data";
import { useCollection } from "@/lib/hooks";
import { useCourse } from "../course-context";

const ROLE_ORDER = { lecturer: 0, mentor: 1, student: 2 } as const;

export default function MembersPage() {
  const { cid, me } = useCourse();
  const isLecturer = me.role === "lecturer";
  const mq = useMemo(() => (isLecturer ? membersQuery(cid) : null), [cid, isLecturer]);
  const members = useCollection<Member>(mq);

  if (!isLecturer) return <p className="text-sm text-stone-600">Hanya dosen yang dapat melihat daftar anggota.</p>;
  if (members.loading) return <Spinner />;
  if (members.error) return <ErrorBox>{friendlyError(members.error)}</ErrorBox>;

  const sorted = [...members.data].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name, "id"),
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        {members.data.length} anggota. Jadikan mahasiswa yang menguasai materi sebagai peer mentor;
        jawaban mereka diberi label khusus.
      </p>
      <ul className="space-y-2">
        {sorted.map((m) => (
          <li key={m.id}>
            <MemberRow cid={cid} member={m} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemberRow({ cid, member }: { cid: string; member: Member }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = member.role === "mentor" ? "student" : "mentor";
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 font-medium text-stone-900">
            {member.name} <RoleBadge role={member.role} /> <DemoBadge demo={member.demo} />
          </p>
          <p className="truncate text-xs text-stone-500">{member.email}</p>
        </div>
        {member.role !== "lecturer" && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await setMemberRole(cid, member.uid, next);
              } catch (err) {
                setError(friendlyError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            {next === "mentor" ? "Jadikan peer mentor" : "Jadikan mahasiswa biasa"}
          </Button>
        )}
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
    </Card>
  );
}
