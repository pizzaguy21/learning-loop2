# Learning Loop

Per-course Q&A for university classes: students ask questions that are
**anonymous to classmates but visible to the lecturer**, classmates and peer
mentors answer, and the lecturer verifies the correct answer or writes an
official one. Built by team Trio Pejabat for STACK 2026 (GDGoC ITB), Case 1:
Smarter Campus and Learning. The user interface is in Indonesian.

## Status (25 November 2026)

| Feature | Status |
|---|---|
| Google Sign-In | Done |
| Lecturer creates a course and gets a 6-character join code | Done |
| Student joins with the code | Done |
| Anonymous question (asker hidden from classmates, visible to lecturer) | Done |
| Classmates and peer mentors answer | Done |
| Lecturer verifies a peer answer or posts an official answer | Done |
| Lecturer promotes students to peer mentor | Done |
| Filter questions by status and topic; "my questions" | Done |
| Weekly topic summary for the lecturer | **Not started** (planned 7-16 Dec) |
| Similar-question matching (TF-IDF) | **Not started** (planned for Final Day) |
| Notifications | **Not started** |
| Deployment (Vercel + Firebase project) | **Not started** |

All data in the demo course is **synthetic** and shown with a "Data demo"
label. It does not come from real students or from the team's survey.

## How anonymity is enforced

A question document stores no author. The asker is stored separately in
`courses/{courseId}/questionAuthors/{questionId}`, which Firestore security
rules let only the asker and the course lecturer read. Classmates therefore
cannot find the asker even with browser developer tools. Answers show the
answerer's name. See `firestore.rules` and `tests/firestore.rules.test.ts`.

## Tech stack

Next.js 16 (App Router, client-side data), React 19, Tailwind CSS 4,
Firebase Authentication (Google), Cloud Firestore. No generative AI answers
questions.

## Running locally

Requirements: Node.js 22 or newer, and **Java 21 or newer** (the Firebase
Emulator needs it).

```bash
npm install
cp .env.example .env.local      # emulator mode, no Firebase project needed
npm run emulators               # terminal 1: Auth + Firestore emulators, UI at http://127.0.0.1:4000
npm run dev                     # terminal 2: app at http://localhost:3000
npm run seed                    # terminal 3: synthetic demo course, join code DEMO26
```

In emulator mode, "Masuk dengan Google" opens a fake sign-in window where you
can add any test account. To make your test account the demo course's
lecturer, sign in once and run `npm run seed -- --lecturer <that email>`.

Emulator data is wiped when the emulators stop; run `npm run seed` again.

## Tests

```bash
npm run test:rules   # 19 security-rule tests (starts its own Firestore emulator)
npm run smoke        # end-to-end run of src/lib/data.ts; needs `npm run emulators` running
```

## Known limitations

- Anyone signed in can create a course and become its lecturer; lecturers are
  not verified.
- A course name cannot be changed after creation.
- A member could raise a question's answer counter without posting an answer;
  this affects only the displayed count.
- Not yet tested with real students or lecturers.
- Light theme only.

## Third-party resources

Next.js, React, Tailwind CSS, the Firebase JavaScript SDK, Firebase Admin SDK,
Firebase CLI and Emulator Suite, Vitest, tsx, and the Geist font (Google
Fonts). Project scaffolded with `create-next-app`.

## AI assistance disclosure

Claude (Anthropic) was used through Claude Code to write most of the initial
code in this repository (data model, Firestore security rules, pages, tests,
seed script) and this README, under the team's direction. The team reviews,
tests, and is responsible for the code.

## Team

| Member | Role and contributions |
|---|---|
| Vincent Joe Wangsadidjaja | _to be filled in_ |
| Steven Wijaya | _to be filled in_ |
| Jonathan Hartanto | _to be filled in_ |
