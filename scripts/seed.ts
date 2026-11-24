/**
 * Fills the local Firebase Emulator with a SYNTHETIC demo course.
 * Every seeded document has `demo: true`, and the app labels it "Data demo".
 * None of it comes from real students or real survey responses.
 *
 *   npm run seed                         # demo course with fictional people
 *   npm run seed -- --lecturer you@x.com # also make your emulator account its lecturer
 *
 * Sign in once in the app first so the account in --lecturer exists.
 * This script refuses to run against a real Firebase project.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
const projectId = "demo-learning-loop";

const CID = "demo-struktur-data";
const CODE = "DEMO26";
const COURSE_NAME = "Struktur Data - Kelas Demo";
const TOPICS = ["Rekursi", "Linked List", "Stack dan Queue", "Pohon Biner", "Kompleksitas Waktu"];

const people = {
  dosen: { uid: "demo-dosen", name: "Dosen Demo", email: "dosen.demo@example.com", role: "lecturer" },
  mentor: { uid: "demo-mentor", name: "Mentor Demo", email: "mentor.demo@example.com", role: "mentor" },
  m1: { uid: "demo-mhs-1", name: "Mahasiswa Demo 1", email: "mhs1.demo@example.com", role: "student" },
  m2: { uid: "demo-mhs-2", name: "Mahasiswa Demo 2", email: "mhs2.demo@example.com", role: "student" },
  m3: { uid: "demo-mhs-3", name: "Mahasiswa Demo 3", email: "mhs3.demo@example.com", role: "student" },
} as const;
type Key = keyof typeof people;

type SeedAnswer = { by: Key; body: string; verified?: boolean; official?: boolean; hoursAgo: number };
type SeedQuestion = { by: Key; topic: string; title: string; body: string; hoursAgo: number; answers: SeedAnswer[] };

const questions: SeedQuestion[] = [
  {
    by: "m1",
    topic: "Rekursi",
    title: "Kenapa fungsi rekursif saya stack overflow?",
    body: "Saya menulis faktorial rekursif, tapi untuk n negatif programnya error stack overflow. Apa yang kurang?",
    hoursAgo: 50,
    answers: [
      { by: "m2", body: "Mungkin base case-nya cuma n == 0, jadi n negatif tidak pernah berhenti.", hoursAgo: 48 },
      {
        by: "dosen",
        official: true,
        verified: true,
        body: "Betul, base case harus menangkap semua kondisi berhenti. Tambahkan pengecekan n < 0 (tolak input) dan pastikan setiap pemanggilan rekursif bergerak mendekati base case.",
        hoursAgo: 30,
      },
    ],
  },
  {
    by: "m2",
    topic: "Linked List",
    title: "Bedanya singly dan doubly linked list kapan dipakai?",
    body: "Di slide minggu 4 dua-duanya dibahas, tapi saya bingung kapan harus pilih doubly.",
    hoursAgo: 40,
    answers: [
      {
        by: "mentor",
        verified: true,
        body: "Doubly berguna kalau sering perlu jalan mundur atau menghapus node yang sudah kamu pegang tanpa mencari node sebelumnya. Bayarannya: tiap node butuh satu pointer tambahan.",
        hoursAgo: 36,
      },
    ],
  },
  {
    by: "m3",
    topic: "Kompleksitas Waktu",
    title: "Apakah dua loop bersarang selalu O(n^2)?",
    body: "",
    hoursAgo: 20,
    answers: [
      { by: "m1", body: "Iya, setiap loop bersarang pasti O(n^2).", hoursAgo: 18 },
      {
        by: "mentor",
        body: "Tidak selalu. Kalau loop dalam berjalan sampai konstanta (misal 10 kali), totalnya O(n). Kalau loop dalam berjalan log n kali, totalnya O(n log n).",
        hoursAgo: 16,
      },
    ],
  },
  {
    by: "m1",
    topic: "Stack dan Queue",
    title: "Kenapa queue pakai array harus circular?",
    body: "Kalau tidak circular, katanya ada ruang terbuang. Maksudnya bagaimana?",
    hoursAgo: 6,
    answers: [],
  },
  {
    by: "m2",
    topic: "Pohon Biner",
    title: "Traversal inorder pada BST hasilnya selalu urut?",
    body: "",
    hoursAgo: 3,
    answers: [{ by: "m3", body: "Setahu saya iya, karena kiri < akar < kanan.", hoursAgo: 2 }],
  },
];

const ago = (hours: number) => Timestamp.fromMillis(Date.now() - hours * 3_600_000);

async function main() {
  const lecturerEmail = process.argv.includes("--lecturer")
    ? process.argv[process.argv.indexOf("--lecturer") + 1]
    : undefined;

  initializeApp({ projectId });
  const auth = getAuth();
  const db = getFirestore();

  for (const p of Object.values(people)) {
    await auth.deleteUser(p.uid).catch(() => {});
    await auth.createUser({ uid: p.uid, displayName: p.name, email: p.email });
  }

  let lecturer: { uid: string; name: string; email: string } = people.dosen;
  if (lecturerEmail) {
    const user = await auth.getUserByEmail(lecturerEmail).catch(() => null);
    if (!user) throw new Error(`No emulator account for ${lecturerEmail}. Sign in once in the app first.`);
    lecturer = { uid: user.uid, name: user.displayName ?? user.email!, email: user.email! };
  }

  await db.recursiveDelete(db.doc(`courses/${CID}`));
  const batch = db.batch();
  batch.set(db.doc(`courses/${CID}`), {
    name: COURSE_NAME,
    code: CODE,
    topics: TOPICS,
    lecturerUid: lecturer.uid,
    lecturerName: lecturer.name,
    createdAt: ago(72),
    demo: true,
  });
  batch.set(db.doc(`joinCodes/${CODE}`), { courseId: CID, courseName: COURSE_NAME });

  const members = Object.values(people).filter((p) => p.role !== "lecturer" || !lecturerEmail);
  for (const p of [...members, ...(lecturerEmail ? [{ ...lecturer, role: "lecturer" as const }] : [])]) {
    batch.set(db.doc(`courses/${CID}/members/${p.uid}`), {
      uid: p.uid,
      courseId: CID,
      name: p.name,
      email: p.email,
      role: p.role,
      courseName: COURSE_NAME,
      joinCode: CODE,
      joinedAt: ago(70),
      demo: true,
    });
  }

  questions.forEach((q, i) => {
    const qid = `demo-q${i + 1}`;
    const asker = people[q.by];
    const verifiedIndex = q.answers.findIndex((a) => a.verified);
    const lastActivity = Math.min(q.hoursAgo, ...q.answers.map((a) => a.hoursAgo));
    batch.set(db.doc(`courses/${CID}/questions/${qid}`), {
      title: q.title,
      body: q.body,
      topic: q.topic,
      status: verifiedIndex >= 0 ? "verified" : q.answers.length ? "answered" : "open",
      answerCount: q.answers.length,
      verifiedAnswerId: verifiedIndex >= 0 ? `demo-a${verifiedIndex + 1}` : null,
      createdAt: ago(q.hoursAgo),
      lastActivityAt: ago(lastActivity),
      demo: true,
    });
    batch.set(db.doc(`courses/${CID}/questionAuthors/${qid}`), {
      uid: asker.uid,
      name: asker.name,
      email: asker.email,
      createdAt: ago(q.hoursAgo),
    });
    q.answers.forEach((a, j) => {
      const by = a.by === "dosen" ? { ...lecturer, role: "lecturer" } : people[a.by];
      batch.set(db.doc(`courses/${CID}/questions/${qid}/answers/demo-a${j + 1}`), {
        body: a.body,
        authorUid: by.uid,
        authorName: by.name,
        authorRole: by.role,
        official: a.official ?? false,
        verified: a.verified ?? false,
        verifiedAt: a.verified ? ago(a.hoursAgo) : null,
        createdAt: ago(a.hoursAgo),
        demo: true,
      });
    });
  });
  await batch.commit();

  console.log(`Seeded synthetic course "${COURSE_NAME}" (join code ${CODE}).`);
  console.log(`Lecturer: ${lecturer.name} <${lecturer.email}>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
