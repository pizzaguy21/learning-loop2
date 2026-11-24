import type { User } from "firebase/auth";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { displayNameOf } from "./auth";
import { db } from "./firebase";

export type Role = "student" | "mentor" | "lecturer";
export type QuestionStatus = "open" | "answered" | "verified";

export type Course = {
  id: string;
  name: string;
  code: string;
  topics: string[];
  lecturerUid: string;
  lecturerName: string;
  createdAt: Timestamp | null;
  demo?: boolean;
};

export type Member = {
  id: string;
  uid: string;
  courseId: string;
  name: string;
  email: string;
  role: Role;
  courseName: string;
  joinCode: string;
  joinedAt: Timestamp | null;
  demo?: boolean;
};

export type Question = {
  id: string;
  title: string;
  body: string;
  topic: string;
  status: QuestionStatus;
  answerCount: number;
  verifiedAnswerId: string | null;
  createdAt: Timestamp | null;
  lastActivityAt: Timestamp | null;
  demo?: boolean;
};

export type Answer = {
  id: string;
  body: string;
  authorUid: string;
  authorName: string;
  authorRole: Role;
  official: boolean;
  verified: boolean;
  verifiedAt: Timestamp | null;
  createdAt: Timestamp | null;
  demo?: boolean;
};

export type QuestionAuthor = {
  id: string;
  uid: string;
  name: string;
  email: string;
  createdAt: Timestamp | null;
};

export const OTHER_TOPIC = "Lainnya";

// --- references and queries -------------------------------------------------

export const courseRef = (cid: string) => doc(db, "courses", cid);
export const memberRef = (cid: string, uid: string) => doc(db, "courses", cid, "members", uid);
export const questionRef = (cid: string, qid: string) =>
  doc(db, "courses", cid, "questions", qid);
export const questionAuthorRef = (cid: string, qid: string) =>
  doc(db, "courses", cid, "questionAuthors", qid);

export const myMembershipsQuery = (uid: string) =>
  query(collectionGroup(db, "members"), where("uid", "==", uid));
export const membersQuery = (cid: string) => collection(db, "courses", cid, "members");
export const questionsQuery = (cid: string) =>
  query(collection(db, "courses", cid, "questions"), orderBy("lastActivityAt", "desc"));
export const answersQuery = (cid: string, qid: string) =>
  query(collection(db, "courses", cid, "questions", qid, "answers"), orderBy("createdAt", "asc"));
export const myQuestionAuthorsQuery = (cid: string, uid: string) =>
  query(collection(db, "courses", cid, "questionAuthors"), where("uid", "==", uid));

// --- courses -----------------------------------------------------------------

// No 0/O or 1/I/L, so codes are easy to read aloud and copy from a slide.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function parseTopics(raw: string) {
  const seen = new Set<string>();
  for (const t of raw.split(/[\n,]/)) {
    const topic = t.trim().slice(0, 60);
    if (topic && topic !== OTHER_TOPIC) seen.add(topic);
  }
  return [...seen].slice(0, 29);
}

/** Creates a course with the signed-in user as its lecturer. Returns its id. */
export async function createCourse(user: User, name: string, topics: string[]) {
  // A taken code makes the batch fail (joinCodes cannot be overwritten), so retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const course = doc(collection(db, "courses"));
    const batch = writeBatch(db);
    batch.set(course, {
      name,
      code,
      topics,
      lecturerUid: user.uid,
      lecturerName: displayNameOf(user),
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "joinCodes", code), { courseId: course.id, courseName: name });
    batch.set(memberRef(course.id, user.uid), {
      uid: user.uid,
      courseId: course.id,
      name: displayNameOf(user),
      email: user.email,
      role: "lecturer",
      courseName: name,
      joinCode: code,
      joinedAt: serverTimestamp(),
    });
    try {
      await batch.commit();
      return course.id;
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  throw new Error("unreachable");
}

export class JoinError extends Error {}

/** Joins a course by code as a student. Returns the course id. */
export async function joinCourse(user: User, rawCode: string) {
  const code = normalizeCode(rawCode);
  if (code.length !== 6) throw new JoinError("Kode kelas terdiri dari 6 karakter.");
  const codeSnap = await getDoc(doc(db, "joinCodes", code));
  if (!codeSnap.exists()) throw new JoinError("Kode kelas tidak ditemukan.");
  const { courseId, courseName } = codeSnap.data() as { courseId: string; courseName: string };

  const existing = await getDoc(memberRef(courseId, user.uid));
  if (existing.exists()) return courseId;

  const batch = writeBatch(db);
  batch.set(memberRef(courseId, user.uid), {
    uid: user.uid,
    courseId,
    name: displayNameOf(user),
    email: user.email,
    role: "student",
    courseName,
    joinCode: code,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return courseId;
}

export function setMemberRole(cid: string, uid: string, role: "student" | "mentor") {
  const batch = writeBatch(db);
  batch.update(memberRef(cid, uid), { role });
  return batch.commit();
}

// --- questions and answers ---------------------------------------------------

/**
 * Posts a question. The question document carries no author; the author goes
 * to questionAuthors, which only the asker and the lecturer can read.
 */
export async function askQuestion(
  cid: string,
  member: Member,
  input: { title: string; body: string; topic: string },
) {
  const question = doc(collection(db, "courses", cid, "questions"));
  const batch = writeBatch(db);
  batch.set(question, {
    title: input.title,
    body: input.body,
    topic: input.topic,
    status: "open",
    answerCount: 0,
    verifiedAnswerId: null,
    createdAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
  batch.set(questionAuthorRef(cid, question.id), {
    uid: member.uid,
    name: member.name,
    email: member.email,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return question.id;
}

/** A classmate or peer mentor answers. Lecturers use postOfficialAnswer. */
export function postAnswer(cid: string, question: Question, member: Member, body: string) {
  const answer = doc(collection(db, "courses", cid, "questions", question.id, "answers"));
  const batch = writeBatch(db);
  batch.set(answer, {
    body,
    authorUid: member.uid,
    authorName: member.name,
    authorRole: member.role,
    official: false,
    verified: false,
    verifiedAt: null,
    createdAt: serverTimestamp(),
  });
  batch.update(questionRef(cid, question.id), {
    answerCount: increment(1),
    status: question.status === "open" ? "answered" : question.status,
    lastActivityAt: serverTimestamp(),
  });
  return batch.commit();
}

/** The lecturer writes an answer that is official and verified at once. */
export function postOfficialAnswer(
  cid: string,
  question: Question,
  member: Member,
  body: string,
) {
  const answer = doc(collection(db, "courses", cid, "questions", question.id, "answers"));
  const batch = writeBatch(db);
  batch.set(answer, {
    body,
    authorUid: member.uid,
    authorName: member.name,
    authorRole: member.role,
    official: true,
    verified: true,
    verifiedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  if (question.verifiedAnswerId) unverify(batch, cid, question);
  batch.update(questionRef(cid, question.id), {
    answerCount: increment(1),
    status: "verified",
    verifiedAnswerId: answer.id,
    lastActivityAt: serverTimestamp(),
  });
  return batch.commit();
}

/** The lecturer marks an existing (peer) answer as the verified one. */
export function verifyAnswer(cid: string, question: Question, answerId: string) {
  const batch = writeBatch(db);
  if (question.verifiedAnswerId && question.verifiedAnswerId !== answerId) {
    unverify(batch, cid, question);
  }
  batch.update(doc(db, "courses", cid, "questions", question.id, "answers", answerId), {
    verified: true,
    verifiedAt: serverTimestamp(),
  });
  batch.update(questionRef(cid, question.id), {
    status: "verified",
    verifiedAnswerId: answerId,
    lastActivityAt: serverTimestamp(),
  });
  return batch.commit();
}

function unverify(batch: ReturnType<typeof writeBatch>, cid: string, question: Question) {
  batch.update(
    doc(db, "courses", cid, "questions", question.id, "answers", question.verifiedAnswerId!),
    { verified: false, verifiedAt: null },
  );
}
