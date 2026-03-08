# PRODUCT REQUIREMENTS DOCUMENT
## Online Exam Portal — v1.0

**Date:** March 2026  
**Status:** Draft

---

## 1. Project Overview

The Online Exam Portal is a full-stack web application designed to facilitate secure, timed online examinations. The platform provides a role-based system with two primary actors: **Administrators** (who create, configure, and manage exams) and **Candidates** (who attempt exams under controlled conditions).

The system emphasizes exam integrity through features such as forward-only navigation, auto-start countdown timers, credential-based access, and dynamic exam configuration.

---

## 2. Goals & Objectives

- Provide a secure, scalable platform for conducting online examinations.
- Enable administrators to dynamically create and configure exams with custom sections and questions.
- Enforce exam integrity through forward-only navigation and timed sessions.
- Deliver a streamlined candidate experience from login to submission.
- Provide real-time score tracking and result dashboards for administrators.

---

## 3. User Roles & Permissions

| Role | Access Level | Key Capabilities |
|------|-------------|-----------------|
| **Admin** | Full System Access | Create/edit/delete exams, manage sections & questions, generate candidate credentials, view scores & analytics, export results |
| **Candidate (User)** | Exam Access Only | Login via provided credentials, attempt assigned exam, view own score post-submission |

---

## 4. Exam Structure & Rules

### 4.1 Exam Composition

- Each exam consists of **multiple sections** (default: 5, configurable by admin).
- Each section contains a configurable number of questions (default range: **25–30 per section**).
- Question types supported: **Multiple Choice (MCQ)**, **True/False**, and **Fill-in-the-Blank**.
- Each question carries configurable marks (positive marking; optional negative marking).
- Sections and questions are stored dynamically and can be modified per exam.

### 4.2 Timer & Auto-Submission

- A countdown timer starts **automatically** when the candidate begins the exam.
- Default duration: **45 minutes** (configurable per exam by admin).
- Timer is displayed prominently on-screen at all times during the exam.
- When the timer reaches **00:00**, the exam **auto-submits** with all answered responses saved.
- Timer state is persisted **server-side** to prevent manipulation via browser refresh.

### 4.3 Navigation Rules

- **Forward-only navigation**: once a candidate moves to the next question, they cannot return to any previously viewed question.
- Each question is **locked** after the candidate clicks "Next" or "Submit Answer."
- Candidates can see their current section and question number but not previous answers.
- Section transitions are automatic after the last question in a section is answered.

---

## 5. User Flows

### 5.1 Admin Flow

1. Admin logs in via the admin dashboard using admin credentials.
2. Admin creates a new exam by entering: Exam title, Description, Duration (minutes), Number of sections.
3. For each section, admin adds: Section title, Questions with options, correct answers, and marks.
4. Admin generates candidate credentials (username + password) and a unique exam access link.
5. Admin distributes the link and credentials to candidates.
6. Post-exam: Admin views scores, analytics, and can export results as CSV/PDF.

### 5.2 Candidate Flow

1. Candidate receives an exam link and login credentials from the admin.
2. Candidate opens the link and enters their username and password.
3. Candidate views exam instructions (sections, question count, duration, navigation rules).
4. Candidate clicks "Start Exam" — the 45-minute countdown timer begins.
5. Candidate answers questions section by section in forward-only mode.
6. Exam ends when: the timer expires (auto-submit), or the candidate manually submits after the last question.
7. Candidate views their score summary on a results screen.

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) + TypeScript | Full-stack framework — RSC for frontend, Server Actions & Route Handlers for backend |
| Database | PostgreSQL (via Supabase) | Managed PostgreSQL with row-level security and real-time capabilities |
| ORM | Prisma | Type-safe database queries and schema migrations against Supabase Postgres |
| Authentication | Supabase Auth | Built-in OAuth, magic links, and email/password auth with session management |
| File Storage | Supabase Storage | Managed S3-compatible object storage for question images and exported reports |
| State / Data Fetching | TanStack Query | Client-side caching, loading states, and mutation management |
| Forms & Validation | React Hook Form + Zod | Schema-validated forms on both client and server |
| UI Components | Shadcn/UI + Tailwind CSS v4 | Accessible component library with utility-first styling |
| Deployment | Vercel | Zero-config Next.js deployment with edge functions and CI/CD |
| Testing | Jest + React Testing Library | Unit, integration, and end-to-end tests |

### 6.2 System Architecture (High Level)

```
[Next.js App (RSC + Client Components)]
        ↓   ↓
[Server Actions / Route Handlers]  →  [Supabase (Auth + Postgres + Storage)]
                                              ↓
                                         [Prisma ORM]
```

---

## 7. Database Schema

The schema uses PostgreSQL with UUID primary keys for security and scalability.

### 7.1 `admins`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique admin identifier |
| name | VARCHAR(100) | NOT NULL | Full name of the admin |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Admin login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | ENUM('super_admin','admin') | DEFAULT 'admin' | Admin privilege level |
| is_active | BOOLEAN | DEFAULT true | Soft delete / deactivation flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 7.2 `exams`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique exam identifier |
| admin_id | UUID | FK → admins(id), NOT NULL | Creator admin reference |
| title | VARCHAR(255) | NOT NULL | Exam display title |
| description | TEXT | NULLABLE | Exam description / instructions |
| duration_minutes | INTEGER | NOT NULL, DEFAULT 45 | Total exam time in minutes |
| total_marks | INTEGER | COMPUTED | Sum of all question marks |
| passing_percentage | DECIMAL(5,2) | DEFAULT 40.00 | Minimum % to pass |
| is_published | BOOLEAN | DEFAULT false | Whether candidates can access it |
| shuffle_questions | BOOLEAN | DEFAULT false | Randomize question order |
| allow_negative_marking | BOOLEAN | DEFAULT false | Enable penalty for wrong answers |
| negative_mark_value | DECIMAL(5,2) | DEFAULT 0.00 | Points deducted per wrong answer |
| access_link | VARCHAR(255) | UNIQUE, NOT NULL | Unique URL slug for exam access |
| starts_at | TIMESTAMP | NULLABLE | Scheduled exam start (optional) |
| expires_at | TIMESTAMP | NULLABLE | Exam access expiration |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 7.3 `sections`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | Unique section identifier |
| exam_id | UUID | FK → exams(id) ON DELETE CASCADE | Parent exam reference |
| title | VARCHAR(255) | NOT NULL | Section display name |
| description | TEXT | NULLABLE | Section instructions |
| order_index | INTEGER | NOT NULL | Display order within exam |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

### 7.4 `questions`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | Unique question identifier |
| section_id | UUID | FK → sections(id) ON DELETE CASCADE | Parent section reference |
| question_text | TEXT | NOT NULL | The question content |
| question_type | ENUM('mcq','true_false','fill_blank') | NOT NULL | Type of question |
| options | JSONB | NULLABLE | Array of option objects for MCQ |
| correct_answer | TEXT | NOT NULL | Correct answer value |
| marks | DECIMAL(5,2) | NOT NULL, DEFAULT 1.00 | Points for correct answer |
| explanation | TEXT | NULLABLE | Answer explanation (shown post-exam) |
| image_url | VARCHAR(500) | NULLABLE | Optional question image |
| order_index | INTEGER | NOT NULL | Display order within section |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**JSONB options format:**
```json
[
  {"id": "A", "text": "Option 1"},
  {"id": "B", "text": "Option 2"},
  {"id": "C", "text": "Option 3"},
  {"id": "D", "text": "Option 4"}
]
```

### 7.5 `candidates`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | Unique candidate identifier |
| exam_id | UUID | FK → exams(id) ON DELETE CASCADE | Assigned exam reference |
| username | VARCHAR(100) | NOT NULL | Login username (unique per exam) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(200) | NOT NULL | Candidate full name |
| email | VARCHAR(255) | NULLABLE | Candidate email for notifications |
| is_used | BOOLEAN | DEFAULT false | Whether credentials have been used |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

> **Unique constraint:** `UNIQUE(exam_id, username)` — ensures username uniqueness within each exam.

### 7.6 `exam_attempts`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | Unique attempt identifier |
| candidate_id | UUID | FK → candidates(id) | Candidate who attempted |
| exam_id | UUID | FK → exams(id) | Exam that was attempted |
| started_at | TIMESTAMP | NOT NULL | Exact exam start time |
| submitted_at | TIMESTAMP | NULLABLE | Submission time (null = in progress) |
| time_remaining_sec | INTEGER | NULLABLE | Seconds left at submission |
| total_score | DECIMAL(7,2) | DEFAULT 0.00 | Computed total score |
| total_correct | INTEGER | DEFAULT 0 | Number of correct answers |
| total_wrong | INTEGER | DEFAULT 0 | Number of wrong answers |
| total_unanswered | INTEGER | DEFAULT 0 | Number of skipped questions |
| status | ENUM('in_progress','completed','timed_out','abandoned') | DEFAULT 'in_progress' | Attempt status |
| current_question_id | UUID | FK → questions(id), NULLABLE | Tracks current question for forward-only nav |
| ip_address | VARCHAR(45) | NULLABLE | Candidate IP for audit |
| user_agent | TEXT | NULLABLE | Browser info for audit |

### 7.7 `responses`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | Unique response identifier |
| attempt_id | UUID | FK → exam_attempts(id) ON DELETE CASCADE | Parent attempt reference |
| question_id | UUID | FK → questions(id) | Answered question reference |
| section_id | UUID | FK → sections(id) | Section reference for analytics |
| selected_answer | TEXT | NULLABLE | Candidate's submitted answer |
| is_correct | BOOLEAN | COMPUTED | Whether answer matches correct_answer |
| marks_awarded | DECIMAL(5,2) | DEFAULT 0.00 | Points awarded for this response |
| time_spent_sec | INTEGER | NULLABLE | Time spent on this question |
| answered_at | TIMESTAMP | DEFAULT NOW() | When the answer was submitted |

> **Unique constraint:** `UNIQUE(attempt_id, question_id)` — one response per question per attempt.

---

## 8. API Routes

The backend is implemented using **Next.js Route Handlers** (`app/api/`) for external-facing endpoints and **Server Actions** for all form-based mutations directly in the UI.  
**Base URL:** `/api/v1`  
**Auth:** Managed by Supabase Auth; the Supabase session cookie is validated server-side on every request using `createServerClient`.

### 8.1 Authentication Endpoints

| Method | Endpoint / Action | Auth | Description |
|--------|---------|------|-------------|
| Server Action | `signInAdmin()` | None | Admin sign-in via Supabase Auth email/password |
| Server Action | `signUpAdmin()` | Super Admin | Create a new admin account via Supabase Auth |
| Server Action | `signInCandidate()` | None | Candidate login — validates credentials in the `candidates` table and creates a scoped Supabase session |
| Server Action | `signOut()` | Any | Invalidates Supabase session and clears cookies |

### 8.2 Admin — Exam Management

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/admin/exams` | List all exams created by the admin (paginated) |
| POST | `/api/v1/admin/exams` | Create a new exam (title, description, duration, settings) |
| GET | `/api/v1/admin/exams/:examId` | Get full exam details with sections and question counts |
| PUT | `/api/v1/admin/exams/:examId` | Update exam metadata (title, duration, settings) |
| DELETE | `/api/v1/admin/exams/:examId` | Soft-delete an exam (marks as archived) |
| PATCH | `/api/v1/admin/exams/:examId/publish` | Toggle exam published/unpublished status |
| POST | `/api/v1/admin/exams/:examId/duplicate` | Clone an entire exam with all sections and questions |

### 8.3 Admin — Section Management

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/admin/exams/:examId/sections` | List all sections in an exam |
| POST | `/api/v1/admin/exams/:examId/sections` | Add a new section to an exam |
| PUT | `/api/v1/admin/sections/:sectionId` | Update section title, description, or order |
| DELETE | `/api/v1/admin/sections/:sectionId` | Delete a section and all its questions |
| PATCH | `/api/v1/admin/exams/:examId/sections/reorder` | Reorder sections via array of IDs |

### 8.4 Admin — Question Management

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/admin/sections/:sectionId/questions` | List all questions in a section |
| POST | `/api/v1/admin/sections/:sectionId/questions` | Add a new question to a section |
| POST | `/api/v1/admin/sections/:sectionId/questions/bulk` | Bulk import questions (JSON/CSV) |
| PUT | `/api/v1/admin/questions/:questionId` | Update question text, options, or correct answer |
| DELETE | `/api/v1/admin/questions/:questionId` | Delete a specific question |
| PATCH | `/api/v1/admin/sections/:sectionId/questions/reorder` | Reorder questions via array of IDs |

### 8.5 Admin — Candidate Management

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/admin/exams/:examId/candidates` | List all candidates for an exam |
| POST | `/api/v1/admin/exams/:examId/candidates` | Create a single candidate with credentials |
| POST | `/api/v1/admin/exams/:examId/candidates/bulk` | Bulk create candidates via CSV upload |
| DELETE | `/api/v1/admin/candidates/:candidateId` | Remove a candidate from an exam |
| POST | `/api/v1/admin/exams/:examId/candidates/notify` | Send exam link + credentials via email |

### 8.6 Admin — Results & Analytics

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/admin/exams/:examId/results` | Get all candidate scores (paginated, sortable) |
| GET | `/api/v1/admin/exams/:examId/results/:attemptId` | Detailed result: per-question breakdown |
| GET | `/api/v1/admin/exams/:examId/analytics` | Exam analytics: avg score, pass rate, section-wise breakdown |
| GET | `/api/v1/admin/exams/:examId/results/export` | Export results as CSV or PDF |

### 8.7 Candidate — Exam Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/exam/:accessLink/info` | Get exam metadata (title, sections count, duration, rules) |
| POST | `/api/v1/exam/:accessLink/start` | Start the exam → creates attempt, returns first question + timer |
| GET | `/api/v1/exam/attempt/:attemptId/current` | Get the current question (enforces forward-only) |
| POST | `/api/v1/exam/attempt/:attemptId/answer` | Submit answer for current question → returns next question |
| POST | `/api/v1/exam/attempt/:attemptId/skip` | Skip current question → marks unanswered, moves to next |
| POST | `/api/v1/exam/attempt/:attemptId/submit` | Manually submit the exam before timer expires |
| GET | `/api/v1/exam/attempt/:attemptId/timer` | Get server-side remaining time (anti-cheat) |
| GET | `/api/v1/exam/attempt/:attemptId/result` | Get score and summary after exam completion |

---

## 9. Security & Anti-Cheat Measures

### 9.1 Authentication & Authorization

- **Supabase Auth** manages admin sessions (email/password with built-in refresh token rotation).
- Candidate credentials (username + password) are stored in the `candidates` table; login is validated server-side and a custom scoped session is issued.
- Supabase **Row Level Security (RLS)** policies enforce data access at the database level — admins can only see their own exams; candidates can only see their own attempts.
- **Next.js Middleware** (`middleware.ts`) uses `createServerClient` to validate the Supabase session on every request and redirects unauthenticated users.
- Admin routes are protected by checking the user's role stored in Supabase Auth user metadata.

### 9.2 Exam Integrity

- **Server-side timer:** Exam start time is recorded server-side; remaining time is computed on every request. Browser-side timer is for display only.
- **Forward-only enforcement:** The API tracks `current_question_id` in the attempt record. Any request for a previously answered question returns `403 Forbidden`.
- **Single-session enforcement:** If a candidate logs in from a second device, the first session is invalidated.
- **Browser tab/focus monitoring:** Frontend detects tab switches and logs them (optional flag/warning system).
- **IP and User-Agent logging** for post-exam auditing.

### 9.3 Data Protection

- HTTPS enforced for all endpoints.
- Input validation and sanitization on all Server Actions and Route Handlers (using Zod).
- Rate limiting on auth endpoints (5 attempts per minute per IP).
- SQL injection prevention via parameterized queries (ORM layer).
- CORS configured to allow only the frontend domain.

---

## 10. Non-Functional Requirements

| Requirement | Target | Details |
|------------|--------|---------|
| Performance | < 200ms API response | 95th percentile response time for question fetch/submit |
| Scalability | 500+ concurrent users | Horizontal scaling via load balancer + stateless API servers |
| Availability | 99.9% uptime | Health checks, auto-restart, database replication |
| Data Backup | Daily automated | PostgreSQL pg_dump + S3 storage with 30-day retention |
| Browser Support | Chrome, Firefox, Safari, Edge | Latest 2 versions of each browser |
| Mobile Responsive | Yes | Candidate exam UI must work on tablets and large phones |
| Accessibility | WCAG 2.1 AA | Keyboard navigation, screen reader support, color contrast |

---

## 11. Entity Relationship Summary

- **admins** → has many → **exams** (one admin creates many exams)
- **exams** → has many → **sections** (one exam has multiple sections)
- **sections** → has many → **questions** (one section has multiple questions)
- **exams** → has many → **candidates** (one exam has many assigned candidates)
- **candidates** → has many → **exam_attempts** (one candidate may have one attempt per exam)
- **exam_attempts** → has many → **responses** (one attempt has one response per question)

> **Key constraint:** Each candidate is allowed only ONE exam attempt. The `UNIQUE(candidate_id, exam_id)` constraint on `exam_attempts` enforces this rule.

---

## 12. Environment Variables

| Variable | Example Value | Description |
|----------|--------------|-------------|
| DATABASE_URL | `postgresql://...@db.<project>.supabase.co:5432/postgres` | Direct Prisma connection string to Supabase Postgres |
| DIRECT_URL | `postgresql://...@db.<project>.supabase.co:5432/postgres` | Used by Prisma for migrations (bypasses PgBouncer) |
| NEXT_PUBLIC_SUPABASE_URL | `https://<project>.supabase.co` | Public Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | `<anon-key>` | Public Supabase anon key for client-side auth |
| SUPABASE_SERVICE_ROLE_KEY | `<service-role-key>` | Secret service key for privileged server-side operations |
| NEXT_PUBLIC_APP_URL | `https://exam.example.com` | Public app URL used for auth redirects and CORS |
| SMTP_HOST | `smtp.example.com` | Email server for candidate notifications |
| NODE_ENV | `production` | Runtime environment |

---

## 13. Development Milestones

| Phase | Duration | Deliverables |
|-------|---------|-------------|
| Phase 1: Foundation | Week 1–2 | Project setup, DB schema, Auth system (admin + candidate login), basic API scaffolding |
| Phase 2: Admin Panel | Week 3–4 | Exam CRUD, Section/Question management, Candidate credential generation, Admin dashboard UI |
| Phase 3: Exam Engine | Week 5–6 | Candidate exam flow, forward-only navigation, server-side timer, auto-submission, response recording |
| Phase 4: Results & Polish | Week 7–8 | Scoring engine, results dashboard, analytics, CSV/PDF export, email notifications |
| Phase 5: Testing & Deploy | Week 9–10 | Unit/integration tests, UAT, performance testing, staging deployment, production launch |

---

## 14. Future Enhancements (Post-MVP)

- Question bank with tagging and search for reusability across exams.
- AI-powered question generation from uploaded study materials.
- Proctoring integration (webcam monitoring, screen recording).
- Multi-language support for questions and UI.
- Candidate self-registration with admin approval workflow.
- Real-time admin monitoring of active exam sessions.
- Advanced analytics: question difficulty index, discrimination index, time-per-question heatmaps.
- Webhook/API integrations with LMS platforms (Moodle, Canvas).