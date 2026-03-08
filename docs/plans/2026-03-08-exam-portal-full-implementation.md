# Exam Portal — Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete online exam portal with admin exam management, candidate exam-taking with forward-only navigation and server-side timers, scoring, and results analytics.

**Architecture:** Next.js 16 App Router with React Server Components for data fetching, Server Actions for all mutations, and Route Handlers only for candidate exam endpoints (real-time timer, forward-only navigation). Supabase PostgreSQL via Prisma ORM. Supabase Auth for admin sessions; custom credential-based auth for candidates.

**Tech Stack:** Next.js 16, React 19, TypeScript (strict), Prisma 7, Supabase (Auth + Postgres), TanStack Query, React Hook Form + Zod, shadcn/UI, Tailwind CSS v4

**Important Notes:**
- Package manager: `pnpm`
- Prisma client singleton: `@/lib/prisma`
- Generated Prisma output: `@/lib/generated/prisma`
- RULES.md mandates: Server Actions for mutations, Zod validation shared between client/server, RSC-first, no `any` types
- The existing `app/page.tsx` is a static UI mockup — it will be replaced with actual dynamic pages

---

## Phase 1: Foundation (Database Schema, Auth, Project Scaffolding)

### Task 1.1: Install Missing Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Supabase packages + bcryptjs + nanoid**

Run:
```bash
pnpm add @supabase/supabase-js @supabase/ssr bcryptjs nanoid
pnpm add -D @types/bcryptjs
```

**Step 2: Verify installation**

Run: `pnpm list @supabase/supabase-js @supabase/ssr bcryptjs nanoid`
Expected: All four packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add supabase, bcryptjs, and nanoid dependencies"
```

---

### Task 1.2: Define Prisma Schema — All Models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Write the complete Prisma schema**

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Enums ────────────────────────────────────────────────

enum AdminRole {
  super_admin
  admin
}

enum QuestionType {
  mcq
  true_false
  fill_blank
}

enum AttemptStatus {
  in_progress
  completed
  timed_out
  abandoned
}

// ─── Models ───────────────────────────────────────────────

model Admin {
  id            String    @id @default(uuid()) @db.Uuid
  supabaseId    String    @unique @map("supabase_id")
  name          String    @db.VarChar(100)
  email         String    @unique @db.VarChar(255)
  role          AdminRole @default(admin)
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  exams Exam[]

  @@map("admins")
}

model Exam {
  id                    String   @id @default(uuid()) @db.Uuid
  adminId               String   @map("admin_id") @db.Uuid
  title                 String   @db.VarChar(255)
  description           String?  @db.Text
  durationMinutes       Int      @default(45) @map("duration_minutes")
  totalMarks            Int      @default(0) @map("total_marks")
  passingPercentage     Decimal  @default(40.00) @map("passing_percentage") @db.Decimal(5, 2)
  isPublished           Boolean  @default(false) @map("is_published")
  shuffleQuestions      Boolean  @default(false) @map("shuffle_questions")
  allowNegativeMarking  Boolean  @default(false) @map("allow_negative_marking")
  negativeMarkValue     Decimal  @default(0.00) @map("negative_mark_value") @db.Decimal(5, 2)
  accessLink            String   @unique @map("access_link") @db.VarChar(255)
  startsAt              DateTime? @map("starts_at")
  expiresAt             DateTime? @map("expires_at")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  admin      Admin       @relation(fields: [adminId], references: [id])
  sections   Section[]
  candidates Candidate[]
  attempts   ExamAttempt[]

  @@map("exams")
}

model Section {
  id          String   @id @default(uuid()) @db.Uuid
  examId      String   @map("exam_id") @db.Uuid
  title       String   @db.VarChar(255)
  description String?  @db.Text
  orderIndex  Int      @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")

  exam      Exam       @relation(fields: [examId], references: [id], onDelete: Cascade)
  questions Question[]
  responses Response[]

  @@map("sections")
}

model Question {
  id            String       @id @default(uuid()) @db.Uuid
  sectionId     String       @map("section_id") @db.Uuid
  questionText  String       @map("question_text") @db.Text
  questionType  QuestionType @map("question_type")
  options       Json?        @db.JsonB
  correctAnswer String       @map("correct_answer") @db.Text
  marks         Decimal      @default(1.00) @db.Decimal(5, 2)
  explanation   String?      @db.Text
  imageUrl      String?      @map("image_url") @db.VarChar(500)
  orderIndex    Int          @map("order_index")
  createdAt     DateTime     @default(now()) @map("created_at")

  section   Section    @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  responses Response[]
  currentAttempts ExamAttempt[] @relation("CurrentQuestion")

  @@map("questions")
}

model Candidate {
  id           String   @id @default(uuid()) @db.Uuid
  examId       String   @map("exam_id") @db.Uuid
  username     String   @db.VarChar(100)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  fullName     String   @map("full_name") @db.VarChar(200)
  email        String?  @db.VarChar(255)
  isUsed       Boolean  @default(false) @map("is_used")
  createdAt    DateTime @default(now()) @map("created_at")

  exam     Exam          @relation(fields: [examId], references: [id], onDelete: Cascade)
  attempts ExamAttempt[]

  @@unique([examId, username])
  @@map("candidates")
}

model ExamAttempt {
  id                String        @id @default(uuid()) @db.Uuid
  candidateId       String        @map("candidate_id") @db.Uuid
  examId            String        @map("exam_id") @db.Uuid
  startedAt         DateTime      @map("started_at")
  submittedAt       DateTime?     @map("submitted_at")
  timeRemainingSec  Int?          @map("time_remaining_sec")
  totalScore        Decimal       @default(0.00) @map("total_score") @db.Decimal(7, 2)
  totalCorrect      Int           @default(0) @map("total_correct")
  totalWrong        Int           @default(0) @map("total_wrong")
  totalUnanswered   Int           @default(0) @map("total_unanswered")
  status            AttemptStatus @default(in_progress)
  currentQuestionId String?       @map("current_question_id") @db.Uuid
  ipAddress         String?       @map("ip_address") @db.VarChar(45)
  userAgent         String?       @map("user_agent") @db.Text

  candidate       Candidate  @relation(fields: [candidateId], references: [id])
  exam            Exam       @relation(fields: [examId], references: [id])
  currentQuestion Question?  @relation("CurrentQuestion", fields: [currentQuestionId], references: [id])
  responses       Response[]

  @@unique([candidateId, examId])
  @@map("exam_attempts")
}

model Response {
  id             String   @id @default(uuid()) @db.Uuid
  attemptId      String   @map("attempt_id") @db.Uuid
  questionId     String   @map("question_id") @db.Uuid
  sectionId      String   @map("section_id") @db.Uuid
  selectedAnswer String?  @map("selected_answer") @db.Text
  isCorrect      Boolean  @default(false) @map("is_correct")
  marksAwarded   Decimal  @default(0.00) @map("marks_awarded") @db.Decimal(5, 2)
  timeSpentSec   Int?     @map("time_spent_sec")
  answeredAt     DateTime @default(now()) @map("answered_at")

  attempt  ExamAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question Question    @relation(fields: [questionId], references: [id])
  section  Section     @relation(fields: [sectionId], references: [id])

  @@unique([attemptId, questionId])
  @@map("responses")
}
```

**Step 2: Generate Prisma client and push schema**

Run:
```bash
npx prisma generate
npx prisma db push
```
Expected: "Your database is now in sync with your Prisma schema."

**Step 3: Commit**

```bash
git add prisma/schema.prisma lib/generated/
git commit -m "feat: define complete database schema with all 7 models"
```

---

### Task 1.3: Create Zod Validation Schemas

**Files:**
- Create: `lib/validations/auth.ts`
- Create: `lib/validations/exam.ts`
- Create: `lib/validations/section.ts`
- Create: `lib/validations/question.ts`
- Create: `lib/validations/candidate.ts`

**Step 1: Create auth validation schemas**

```typescript
// lib/validations/auth.ts
import { z } from "zod";

export const adminSignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminSignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const candidateSignInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  accessLink: z.string().min(1, "Exam access link is required"),
});

export type AdminSignInInput = z.infer<typeof adminSignInSchema>;
export type AdminSignUpInput = z.infer<typeof adminSignUpSchema>;
export type CandidateSignInInput = z.infer<typeof candidateSignInSchema>;
```

**Step 2: Create exam validation schemas**

```typescript
// lib/validations/exam.ts
import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(480).default(45),
  passingPercentage: z.number().min(0).max(100).default(40),
  shuffleQuestions: z.boolean().default(false),
  allowNegativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().min(0).max(100).default(0),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateExamSchema = createExamSchema.partial();

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
```

**Step 3: Create section validation schemas**

```typescript
// lib/validations/section.ts
import { z } from "zod";

export const createSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0),
});

export const updateSectionSchema = createSectionSchema.partial();

export const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
```

**Step 4: Create question validation schemas**

```typescript
// lib/validations/question.ts
import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text is required"),
});

export const createQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["mcq", "true_false", "fill_blank"]),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  marks: z.number().min(0).default(1),
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
```

**Step 5: Create candidate validation schemas**

```typescript
// lib/validations/candidate.ts
import { z } from "zod";

export const createCandidateSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email().optional(),
});

export const bulkCreateCandidatesSchema = z.object({
  candidates: z.array(createCandidateSchema).min(1, "At least one candidate required"),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type BulkCreateCandidatesInput = z.infer<typeof bulkCreateCandidatesSchema>;
```

**Step 6: Commit**

```bash
git add lib/validations/
git commit -m "feat: add Zod validation schemas for all entities"
```

---

### Task 1.4: Create Supabase Client Utilities

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

**Step 1: Create server-side Supabase client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

**Step 2: Create browser-side Supabase client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 3: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase server and browser client utilities"
```

---

### Task 1.5: Create Auth Helpers & Middleware

**Files:**
- Create: `lib/auth.ts`
- Create: `middleware.ts` (project root)

**Step 1: Create auth helper to get current admin**

```typescript
// lib/auth.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await prisma.admin.findUnique({
    where: { supabaseId: user.id },
  });

  return admin;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Unauthorized");
  }
  return admin;
}
```

**Step 2: Create Next.js middleware for route protection**

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Admin routes: require authenticated user
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Admin login: redirect to dashboard if already logged in
  if (pathname === "/admin/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

**Step 3: Commit**

```bash
git add lib/auth.ts middleware.ts
git commit -m "feat: add auth helpers and route protection middleware"
```

---

### Task 1.6: Admin Auth — Server Actions (Sign In / Sign Up / Sign Out)

**Files:**
- Create: `app/admin/(auth)/actions.ts`
- Create: `app/admin/(auth)/login/page.tsx`
- Create: `app/admin/(auth)/layout.tsx`

**Step 1: Create admin auth server actions**

```typescript
// app/admin/(auth)/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { adminSignInSchema, adminSignUpSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export async function signInAdmin(formData: { email: string; password: string }) {
  const parsed = adminSignInSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/admin/dashboard");
}

export async function signUpAdmin(formData: {
  name: string;
  email: string;
  password: string;
}) {
  const parsed = adminSignUpSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { role: "admin" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await prisma.admin.create({
      data: {
        supabaseId: data.user.id,
        name: parsed.data.name,
        email: parsed.data.email,
      },
    });
  }

  redirect("/admin/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

**Step 2: Create auth layout (centered card layout)**

```typescript
// app/admin/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      {children}
    </div>
  );
}
```

**Step 3: Create admin login page**

Build a login page using shadcn `Card`, `Input`, `Button`, `Label` components with React Hook Form + Zod validation. The form calls `signInAdmin` server action. Include a link to sign up. Show error messages via `sonner` toast or inline error.

Key structure:
```
Card > CardHeader (title: "Admin Login") > CardContent > Form with email + password fields > Button "Sign In"
```

**Step 4: Create admin sign-up page at `app/admin/(auth)/signup/page.tsx`**

Similar to login but with name, email, password fields. Calls `signUpAdmin`.

**Step 5: Commit**

```bash
git add app/admin/
git commit -m "feat: add admin auth (login, signup) with server actions"
```

---

### Task 1.7: Set Up App Route Structure

**Files:**
- Create: `app/admin/(dashboard)/layout.tsx` — sidebar + top nav layout for admin
- Create: `app/admin/(dashboard)/dashboard/page.tsx` — admin dashboard home
- Create: `app/exam/[accessLink]/page.tsx` — candidate exam entry point
- Create: `app/exam/[accessLink]/login/page.tsx` — candidate login page

**Step 1: Create admin dashboard layout**

This layout wraps all authenticated admin pages. It should include:
- A sidebar with navigation links (Dashboard, Exams, Settings)
- A top bar with admin name and sign-out button
- Use shadcn `Sidebar` component (already installed)
- Call `requireAdmin()` at the top (RSC — no `'use client'`)

**Step 2: Create admin dashboard page**

A simple page showing:
- Welcome message with admin name
- Stats cards: Total Exams, Total Candidates, Active Exams (use placeholder data for now; will be wired in Phase 2)

**Step 3: Create candidate exam entry and login pages**

- `app/exam/[accessLink]/page.tsx`: RSC that fetches exam info by `accessLink` and shows exam title, description, duration, section count, rules. Has a "Login to Start" button that navigates to the login page.
- `app/exam/[accessLink]/login/page.tsx`: Client component with username/password form. Validates credentials via server action. On success, redirects to exam start.

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: scaffold admin dashboard and candidate exam route structure"
```

---

## Phase 2: Admin Panel (Exam CRUD, Sections, Questions, Candidates)

### Task 2.1: Exam CRUD — Server Actions

**Files:**
- Create: `app/admin/(dashboard)/exams/actions.ts`

**Step 1: Implement exam server actions**

```typescript
// app/admin/(dashboard)/exams/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createExamSchema, updateExamSchema } from "@/lib/validations/exam";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function createExam(input: unknown) {
  const admin = await requireAdmin();
  const parsed = createExamSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exam = await prisma.exam.create({
    data: {
      ...parsed.data,
      adminId: admin.id,
      accessLink: nanoid(12),
    },
  });

  revalidatePath("/admin/exams");
  return { data: exam };
}

export async function updateExam(examId: string, input: unknown) {
  const admin = await requireAdmin();
  const parsed = updateExamSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  const updated = await prisma.exam.update({
    where: { id: examId },
    data: parsed.data,
  });

  revalidatePath(`/admin/exams/${examId}`);
  return { data: updated };
}

export async function deleteExam(examId: string) {
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  await prisma.exam.delete({ where: { id: examId } });

  revalidatePath("/admin/exams");
  return { success: true };
}

export async function togglePublishExam(examId: string) {
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  const updated = await prisma.exam.update({
    where: { id: examId },
    data: { isPublished: !exam.isPublished },
  });

  revalidatePath(`/admin/exams`);
  return { data: updated };
}

export async function duplicateExam(examId: string) {
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
    include: {
      sections: {
        include: { questions: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  if (!exam) return { error: "Exam not found" };

  const newExam = await prisma.exam.create({
    data: {
      adminId: admin.id,
      title: `${exam.title} (Copy)`,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      passingPercentage: exam.passingPercentage,
      shuffleQuestions: exam.shuffleQuestions,
      allowNegativeMarking: exam.allowNegativeMarking,
      negativeMarkValue: exam.negativeMarkValue,
      accessLink: nanoid(12),
      sections: {
        create: exam.sections.map((section) => ({
          title: section.title,
          description: section.description,
          orderIndex: section.orderIndex,
          questions: {
            create: section.questions.map((q) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              options: q.options as any,
              correctAnswer: q.correctAnswer,
              marks: q.marks,
              explanation: q.explanation,
              imageUrl: q.imageUrl,
              orderIndex: q.orderIndex,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/admin/exams");
  return { data: newExam };
}
```

**Step 2: Commit**

```bash
git add app/admin/(dashboard)/exams/actions.ts
git commit -m "feat: add exam CRUD server actions"
```

---

### Task 2.2: Exam List & Create UI

**Files:**
- Create: `app/admin/(dashboard)/exams/page.tsx` — exam list (RSC)
- Create: `app/admin/(dashboard)/exams/exam-list-client.tsx` — client wrapper for interactivity
- Create: `app/admin/(dashboard)/exams/create-exam-dialog.tsx` — create exam modal

**Step 1: Build exam list page (RSC)**

Server component that fetches all exams for the current admin using Prisma with `_count` for sections, questions, and candidates. Passes data to client component.

Key query:
```typescript
const exams = await prisma.exam.findMany({
  where: { adminId: admin.id },
  include: {
    _count: { select: { sections: true, candidates: true, attempts: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

Display as a grid of `Card` components showing: title, status badge (published/draft), duration, question count, candidate count, created date. Each card has Edit, Delete, Publish/Unpublish, Duplicate actions via `DropdownMenu`.

**Step 2: Build create exam dialog**

Client component using shadcn `Dialog`, React Hook Form + Zod. Fields: title, description (textarea), duration (number input), passing percentage (slider), shuffle questions (switch), negative marking (switch + value input). Calls `createExam` server action via `useMutation`.

**Step 3: Commit**

```bash
git add app/admin/(dashboard)/exams/
git commit -m "feat: add exam list page and create exam dialog"
```

---

### Task 2.3: Exam Detail Page — Sections & Questions

**Files:**
- Create: `app/admin/(dashboard)/exams/[examId]/page.tsx` — exam detail (RSC)
- Create: `app/admin/(dashboard)/exams/[examId]/sections/actions.ts` — section server actions
- Create: `app/admin/(dashboard)/exams/[examId]/sections/section-manager.tsx` — section management client component
- Create: `app/admin/(dashboard)/exams/[examId]/sections/question-form.tsx` — question add/edit form

**Step 1: Create section server actions**

```typescript
// sections/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createSectionSchema, updateSectionSchema, reorderSectionsSchema } from "@/lib/validations/section";
import { createQuestionSchema, updateQuestionSchema, reorderQuestionsSchema } from "@/lib/validations/question";
import { revalidatePath } from "next/cache";

export async function createSection(examId: string, input: unknown) { /* ... */ }
export async function updateSection(sectionId: string, input: unknown) { /* ... */ }
export async function deleteSection(sectionId: string) { /* ... */ }
export async function reorderSections(examId: string, input: unknown) { /* ... */ }

export async function createQuestion(sectionId: string, input: unknown) { /* ... */ }
export async function updateQuestion(questionId: string, input: unknown) { /* ... */ }
export async function deleteQuestion(questionId: string) { /* ... */ }
export async function reorderQuestions(sectionId: string, input: unknown) { /* ... */ }
```

Each action follows the same pattern: `requireAdmin()` → validate with Zod → verify ownership → Prisma mutation → `revalidatePath`.

**Step 2: Build exam detail page (RSC)**

Fetches exam with all sections and questions. Shows:
- Exam header with title, edit button, publish toggle
- Exam metadata (duration, marks, settings)
- Section list as accordion/collapsible panels
- Each section shows its questions in a table
- Add Section button, Add Question button per section

**Step 3: Build section manager (client component)**

Uses shadcn `Accordion` for collapsible sections. Each section header shows title + question count. Expand to see questions table. Support drag-and-drop reorder (optional, can use up/down buttons instead). Add/Edit/Delete buttons wire to server actions via `useMutation`.

**Step 4: Build question form**

Dialog with React Hook Form. Fields vary by `questionType`:
- MCQ: question text, 4 option fields (A/B/C/D), correct answer select, marks
- True/False: question text, correct answer (true/false radio), marks
- Fill-in-the-blank: question text, correct answer text input, marks
- Common: explanation (optional textarea), image URL (optional)

**Step 5: Commit**

```bash
git add app/admin/(dashboard)/exams/[examId]/
git commit -m "feat: add exam detail page with section and question management"
```

---

### Task 2.4: Candidate Management

**Files:**
- Create: `app/admin/(dashboard)/exams/[examId]/candidates/actions.ts`
- Create: `app/admin/(dashboard)/exams/[examId]/candidates/page.tsx`
- Create: `app/admin/(dashboard)/exams/[examId]/candidates/add-candidate-dialog.tsx`

**Step 1: Create candidate server actions**

```typescript
// candidates/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createCandidateSchema, bulkCreateCandidatesSchema } from "@/lib/validations/candidate";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createCandidate(examId: string, input: unknown) {
  const admin = await requireAdmin();
  const parsed = createCandidateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Verify admin owns this exam
  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const candidate = await prisma.candidate.create({
    data: {
      examId,
      username: parsed.data.username,
      passwordHash,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
    },
  });

  revalidatePath(`/admin/exams/${examId}/candidates`);
  return { data: { ...candidate, rawPassword: parsed.data.password } };
}

export async function bulkCreateCandidates(examId: string, input: unknown) {
  // Similar pattern — validate, loop, bcrypt hash each, prisma.candidate.createMany
}

export async function deleteCandidate(candidateId: string) {
  // Verify admin ownership via exam → admin chain, then delete
}
```

**Step 2: Build candidate list page**

RSC that fetches all candidates for the exam. Displays a `Table` with columns: Name, Username, Email, Status (used/unused), Created. Actions: Delete. Shows the exam access link prominently with a copy button.

**Step 3: Build add candidate dialog**

Form with username, password (auto-generated option), full name, email fields. Also include a bulk upload option that accepts CSV (name, username, password, email per row).

**Step 4: Commit**

```bash
git add app/admin/(dashboard)/exams/[examId]/candidates/
git commit -m "feat: add candidate management with single and bulk creation"
```

---

### Task 2.5: Admin Dashboard Stats

**Files:**
- Modify: `app/admin/(dashboard)/dashboard/page.tsx`

**Step 1: Wire real data to dashboard**

Query Prisma for actual stats:
```typescript
const admin = await requireAdmin();
const [examCount, candidateCount, activeExams, recentAttempts] = await Promise.all([
  prisma.exam.count({ where: { adminId: admin.id } }),
  prisma.candidate.count({ where: { exam: { adminId: admin.id } } }),
  prisma.exam.count({ where: { adminId: admin.id, isPublished: true } }),
  prisma.examAttempt.findMany({
    where: { exam: { adminId: admin.id } },
    take: 10,
    orderBy: { startedAt: "desc" },
    include: { candidate: true, exam: true },
  }),
]);
```

Display with shadcn `Card` stat cards and a recent activity table.

**Step 2: Commit**

```bash
git add app/admin/(dashboard)/dashboard/
git commit -m "feat: wire admin dashboard with real stats"
```

---

## Phase 3: Exam Engine (Candidate Flow, Timer, Forward-Only Navigation)

### Task 3.1: Candidate Auth — Server Actions

**Files:**
- Create: `app/exam/[accessLink]/actions.ts`

**Step 1: Implement candidate login and exam start actions**

```typescript
// app/exam/[accessLink]/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { candidateSignInSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function signInCandidate(input: unknown) {
  const parsed = candidateSignInSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exam = await prisma.exam.findUnique({
    where: { accessLink: parsed.data.accessLink },
  });
  if (!exam || !exam.isPublished) return { error: "Exam not found or not available" };

  // Check exam time window
  const now = new Date();
  if (exam.startsAt && now < exam.startsAt) return { error: "Exam has not started yet" };
  if (exam.expiresAt && now > exam.expiresAt) return { error: "Exam has expired" };

  const candidate = await prisma.candidate.findUnique({
    where: { examId_username: { examId: exam.id, username: parsed.data.username } },
  });
  if (!candidate) return { error: "Invalid credentials" };

  const validPassword = await bcrypt.compare(parsed.data.password, candidate.passwordHash);
  if (!validPassword) return { error: "Invalid credentials" };

  // Check if already attempted
  const existingAttempt = await prisma.examAttempt.findUnique({
    where: { candidateId_examId: { candidateId: candidate.id, examId: exam.id } },
  });
  if (existingAttempt && existingAttempt.status !== "in_progress") {
    return { error: "You have already completed this exam" };
  }

  // Set candidate session cookie (signed, httpOnly)
  const cookieStore = await cookies();
  cookieStore.set("candidate_session", JSON.stringify({
    candidateId: candidate.id,
    examId: exam.id,
    attemptId: existingAttempt?.id || null,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 3, // 3 hours
    path: "/",
  });

  return {
    data: {
      candidateId: candidate.id,
      examId: exam.id,
      attemptId: existingAttempt?.id || null,
      hasExistingAttempt: !!existingAttempt,
    },
  };
}

export async function startExam(examId: string, candidateId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: { orderBy: { orderIndex: "asc" }, take: 1 },
        },
      },
    },
  });
  if (!exam) return { error: "Exam not found" };

  const firstQuestion = exam.sections[0]?.questions[0];
  if (!firstQuestion) return { error: "Exam has no questions" };

  const attempt = await prisma.examAttempt.create({
    data: {
      candidateId,
      examId,
      startedAt: new Date(),
      currentQuestionId: firstQuestion.id,
      status: "in_progress",
    },
  });

  // Mark candidate credentials as used
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { isUsed: true },
  });

  return { data: { attemptId: attempt.id } };
}
```

**Step 2: Commit**

```bash
git add app/exam/
git commit -m "feat: add candidate auth and exam start server actions"
```

---

### Task 3.2: Exam Attempt — API Route Handlers

These need to be Route Handlers (not Server Actions) because the candidate exam flow requires precise request/response control for forward-only enforcement and timer checks.

**Files:**
- Create: `app/api/v1/exam/attempt/[attemptId]/current/route.ts`
- Create: `app/api/v1/exam/attempt/[attemptId]/answer/route.ts`
- Create: `app/api/v1/exam/attempt/[attemptId]/skip/route.ts`
- Create: `app/api/v1/exam/attempt/[attemptId]/submit/route.ts`
- Create: `app/api/v1/exam/attempt/[attemptId]/timer/route.ts`
- Create: `lib/exam-engine.ts` — shared exam logic

**Step 1: Create exam engine utility**

```typescript
// lib/exam-engine.ts
import { prisma } from "@/lib/prisma";

export async function getTimeRemaining(attemptId: string): Promise<number> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt) return 0;

  const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
  const totalSeconds = attempt.exam.durationMinutes * 60;
  return Math.max(0, Math.floor(totalSeconds - elapsed));
}

export async function isAttemptExpired(attemptId: string): Promise<boolean> {
  return (await getTimeRemaining(attemptId)) <= 0;
}

export async function getNextQuestion(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questions: { orderBy: { orderIndex: "asc" } },
            },
          },
        },
      },
      responses: { select: { questionId: true } },
    },
  });
  if (!attempt) return null;

  const answeredIds = new Set(attempt.responses.map((r) => r.questionId));

  for (const section of attempt.exam.sections) {
    for (const question of section.questions) {
      if (!answeredIds.has(question.id)) {
        return { question, section };
      }
    }
  }
  return null; // All questions answered
}

export async function autoSubmitAttempt(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: true,
      exam: {
        include: {
          sections: {
            include: { questions: true },
          },
        },
      },
    },
  });
  if (!attempt) return;

  const totalQuestions = attempt.exam.sections.reduce(
    (sum, s) => sum + s.questions.length, 0
  );

  const totalCorrect = attempt.responses.filter((r) => r.isCorrect).length;
  const totalWrong = attempt.responses.filter((r) => !r.isCorrect && r.selectedAnswer).length;
  const totalUnanswered = totalQuestions - attempt.responses.length;
  const totalScore = attempt.responses.reduce(
    (sum, r) => sum + Number(r.marksAwarded), 0
  );

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: "completed",
      submittedAt: new Date(),
      timeRemainingSec: 0,
      totalScore,
      totalCorrect,
      totalWrong,
      totalUnanswered,
    },
  });
}
```

**Step 2: Create `/current` route — get current question**

```typescript
// app/api/v1/exam/attempt/[attemptId]/current/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTimeRemaining, isAttemptExpired, autoSubmitAttempt, getNextQuestion } from "@/lib/exam-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt || attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Invalid attempt" }, { status: 403 });
  }

  if (await isAttemptExpired(attemptId)) {
    await autoSubmitAttempt(attemptId);
    return NextResponse.json({ error: "Time expired", status: "timed_out" }, { status: 410 });
  }

  const next = await getNextQuestion(attemptId);
  if (!next) {
    return NextResponse.json({ error: "No more questions" }, { status: 404 });
  }

  const timeRemaining = await getTimeRemaining(attemptId);

  return NextResponse.json({
    question: {
      id: next.question.id,
      text: next.question.questionText,
      type: next.question.questionType,
      options: next.question.options,
      marks: next.question.marks,
      imageUrl: next.question.imageUrl,
    },
    section: {
      id: next.section.id,
      title: next.section.title,
    },
    timeRemaining,
  });
}
```

**Step 3: Create `/answer` route — submit answer**

Validates that the question matches `currentQuestionId` (forward-only enforcement). Creates a `Response` record, computes `is_correct` and `marks_awarded`, updates `currentQuestionId` to next question, returns next question data.

**Step 4: Create `/skip` route — skip question**

Same as answer but sets `selectedAnswer: null`, `isCorrect: false`, `marksAwarded: 0`.

**Step 5: Create `/submit` route — manual submission**

Calls `autoSubmitAttempt()`, returns final score summary.

**Step 6: Create `/timer` route — get server-side time**

Returns `{ timeRemaining: number }` computed server-side.

**Step 7: Commit**

```bash
git add app/api/v1/exam/ lib/exam-engine.ts
git commit -m "feat: add exam attempt API routes with forward-only navigation and server timer"
```

---

### Task 3.3: Candidate Exam UI

**Files:**
- Create: `app/exam/[accessLink]/attempt/[attemptId]/page.tsx` — exam-taking page
- Create: `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx` — client component
- Create: `app/exam/[accessLink]/attempt/[attemptId]/timer.tsx` — countdown timer component
- Create: `app/exam/[accessLink]/attempt/[attemptId]/question-display.tsx` — question renderer
- Create: `hooks/use-exam-timer.ts` — timer hook with server sync

**Step 1: Create timer hook**

```typescript
// hooks/use-exam-timer.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useExamTimer(attemptId: string, initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  // Sync with server every 30 seconds
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/timer`);
      if (res.ok) {
        const data = await res.json();
        setSeconds(data.timeRemaining);
      }
    }, 30000);
    return () => clearInterval(syncInterval);
  }, [attemptId]);

  const formatted = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(
    Math.floor((seconds % 3600) / 60)
  ).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return { seconds, formatted, isExpired: seconds <= 0 };
}
```

**Step 2: Build exam client component**

Refactor the existing static UI from `app/page.tsx` into a dynamic client component:
- Fetches current question from `/api/v1/exam/attempt/:attemptId/current`
- Renders question based on type (MCQ options, True/False radio, Fill-blank text input)
- Next button submits answer to `/api/v1/exam/attempt/:attemptId/answer`
- Skip button calls `/skip` endpoint
- Submit Exam button calls `/submit` endpoint
- Timer component displays countdown
- Progress bar shows answered/total questions
- Remove "Back" button (forward-only navigation)
- Auto-submit when timer expires

**Step 3: Build question display component**

Renders different question types:
- MCQ: Radio group with option cards (reuse existing design from `app/page.tsx`)
- True/False: Two radio buttons
- Fill-in-blank: Text input

**Step 4: Commit**

```bash
git add app/exam/ hooks/use-exam-timer.ts
git commit -m "feat: build candidate exam-taking UI with timer and forward-only navigation"
```

---

### Task 3.4: Exam Results Page (Candidate View)

**Files:**
- Create: `app/exam/[accessLink]/result/[attemptId]/page.tsx`

**Step 1: Build results page**

RSC that fetches the completed attempt with all responses. Shows:
- Score summary card: total score, percentage, pass/fail status
- Section-wise breakdown: correct/wrong/unanswered per section
- Question-by-question review (if admin enables it): question text, selected answer, correct answer, explanation

**Step 2: Commit**

```bash
git add app/exam/
git commit -m "feat: add candidate exam results page"
```

---

## Phase 4: Results & Analytics (Admin)

### Task 4.1: Results Dashboard — Server Actions & Page

**Files:**
- Create: `app/admin/(dashboard)/exams/[examId]/results/page.tsx`
- Create: `app/admin/(dashboard)/exams/[examId]/results/results-table.tsx`
- Create: `app/admin/(dashboard)/exams/[examId]/results/[attemptId]/page.tsx`

**Step 1: Build results list page**

RSC that fetches all attempts for an exam:
```typescript
const results = await prisma.examAttempt.findMany({
  where: { examId, exam: { adminId: admin.id } },
  include: { candidate: true },
  orderBy: { totalScore: "desc" },
});
```

Display as sortable `Table` with columns: Rank, Candidate Name, Username, Score, Percentage, Status (pass/fail), Time Taken, Submitted At. Use shadcn `Table` component.

**Step 2: Build individual result detail page**

Shows per-question breakdown for a specific attempt. Table with: Question #, Question Text, Selected Answer, Correct Answer, Is Correct (checkmark/cross), Marks Awarded, Time Spent.

**Step 3: Commit**

```bash
git add app/admin/(dashboard)/exams/[examId]/results/
git commit -m "feat: add admin results dashboard with per-attempt detail view"
```

---

### Task 4.2: Analytics Page

**Files:**
- Create: `app/admin/(dashboard)/exams/[examId]/analytics/page.tsx`
- Create: `app/admin/(dashboard)/exams/[examId]/analytics/charts.tsx`

**Step 1: Build analytics page**

RSC that computes analytics from attempt data:
- Average score, median score, pass rate
- Score distribution histogram (using `recharts` BarChart)
- Section-wise performance (average score per section)
- Question difficulty analysis (% correct per question)

Use `recharts` (already installed) for charts. Wrap chart components in `'use client'` since recharts requires client rendering.

**Step 2: Commit**

```bash
git add app/admin/(dashboard)/exams/[examId]/analytics/
git commit -m "feat: add exam analytics with charts and statistics"
```

---

### Task 4.3: CSV Export

**Files:**
- Create: `app/api/v1/admin/exams/[examId]/results/export/route.ts`

**Step 1: Build CSV export route handler**

```typescript
// app/api/v1/admin/exams/[examId]/results/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  const admin = await requireAdmin();
  const { examId } = await params;

  const attempts = await prisma.examAttempt.findMany({
    where: { examId, exam: { adminId: admin.id } },
    include: { candidate: true },
    orderBy: { totalScore: "desc" },
  });

  const headers = "Rank,Name,Username,Email,Score,Total Marks,Percentage,Status,Submitted At\n";
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  const rows = attempts.map((a, i) => {
    const pct = exam?.totalMarks
      ? ((Number(a.totalScore) / exam.totalMarks) * 100).toFixed(2)
      : "0";
    const status = Number(pct) >= Number(exam?.passingPercentage ?? 40) ? "Pass" : "Fail";
    return `${i + 1},"${a.candidate.fullName}","${a.candidate.username}","${a.candidate.email ?? ""}",${a.totalScore},${exam?.totalMarks ?? 0},${pct}%,${status},${a.submittedAt?.toISOString() ?? "In Progress"}`;
  }).join("\n");

  return new NextResponse(headers + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="results-${examId}.csv"`,
    },
  });
}
```

**Step 2: Add export button to results page**

Add a "Export CSV" button on the results page that links to this route.

**Step 3: Commit**

```bash
git add app/api/v1/admin/exams/[examId]/results/export/ app/admin/(dashboard)/exams/[examId]/results/
git commit -m "feat: add CSV export for exam results"
```

---

## Phase 5: Polish, Security & Deployment

### Task 5.1: Update `totalMarks` Computed Field

**Files:**
- Modify: `app/admin/(dashboard)/exams/[examId]/sections/actions.ts`

**Step 1: Add trigger to recalculate total marks**

After every question create/update/delete, recalculate and update `exam.totalMarks`:

```typescript
async function recalculateExamMarks(examId: string) {
  const result = await prisma.question.aggregate({
    where: { section: { examId } },
    _sum: { marks: true },
  });
  await prisma.exam.update({
    where: { id: examId },
    data: { totalMarks: Number(result._sum.marks ?? 0) },
  });
}
```

Call this function at the end of `createQuestion`, `updateQuestion`, `deleteQuestion`, and `deleteSection`.

**Step 2: Commit**

```bash
git add app/admin/(dashboard)/exams/[examId]/sections/actions.ts
git commit -m "feat: auto-recalculate totalMarks on question changes"
```

---

### Task 5.2: Error Handling & Loading States

**Files:**
- Create: `app/admin/(dashboard)/exams/loading.tsx`
- Create: `app/admin/(dashboard)/exams/[examId]/loading.tsx`
- Create: `app/admin/(dashboard)/exams/[examId]/error.tsx`
- Create: `app/admin/(dashboard)/dashboard/loading.tsx`
- Create: `app/exam/[accessLink]/loading.tsx`

**Step 1: Add loading.tsx files**

Each `loading.tsx` uses shadcn `Skeleton` components matching the page layout.

**Step 2: Add error.tsx boundary**

```typescript
"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="...">Try again</button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/
git commit -m "feat: add loading skeletons and error boundaries"
```

---

### Task 5.3: Environment Variables & Deployment Config

**Files:**
- Modify: `.env` (add all required variables)
- Create: `.env.example` (template without secrets)

**Step 1: Create .env.example**

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Step 2: Update `.gitignore` to exclude `.env` but include `.env.example`**

**Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add .env.example and update gitignore"
```

---

### Task 5.4: Update Root Page & Navigation

**Files:**
- Modify: `app/page.tsx` — replace static mockup with landing/redirect
- Modify: `app/layout.tsx` — update metadata

**Step 1: Replace root page**

Replace the static exam mockup with either:
- A landing page with "Admin Login" and "Take Exam" links
- Or a redirect to `/admin/dashboard`

**Step 2: Update metadata**

```typescript
export const metadata: Metadata = {
  title: "Exam Portal",
  description: "Secure online examination platform",
};
```

**Step 3: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: update root page and metadata"
```

---

## Summary: File Structure After Implementation

```
app/
├── layout.tsx
├── page.tsx                          # Landing page
├── globals.css
├── admin/
│   ├── (auth)/
│   │   ├── layout.tsx                # Centered auth layout
│   │   ├── actions.ts                # signIn, signUp, signOut
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                # Sidebar + topbar layout
│       ├── dashboard/
│       │   ├── page.tsx              # Stats dashboard
│       │   └── loading.tsx
│       └── exams/
│           ├── page.tsx              # Exam list
│           ├── loading.tsx
│           ├── actions.ts            # Exam CRUD actions
│           ├── create-exam-dialog.tsx
│           ├── exam-list-client.tsx
│           └── [examId]/
│               ├── page.tsx          # Exam detail
│               ├── loading.tsx
│               ├── error.tsx
│               ├── sections/
│               │   ├── actions.ts    # Section + Question actions
│               │   ├── section-manager.tsx
│               │   └── question-form.tsx
│               ├── candidates/
│               │   ├── page.tsx
│               │   ├── actions.ts
│               │   └── add-candidate-dialog.tsx
│               ├── results/
│               │   ├── page.tsx      # Results table
│               │   ├── results-table.tsx
│               │   └── [attemptId]/page.tsx
│               └── analytics/
│                   ├── page.tsx
│                   └── charts.tsx
├── exam/
│   └── [accessLink]/
│       ├── page.tsx                  # Exam info page
│       ├── loading.tsx
│       ├── actions.ts               # Candidate auth + start
│       ├── login/page.tsx            # Candidate login
│       ├── attempt/
│       │   └── [attemptId]/
│       │       ├── page.tsx
│       │       ├── exam-client.tsx
│       │       ├── timer.tsx
│       │       └── question-display.tsx
│       └── result/
│           └── [attemptId]/page.tsx
└── api/
    └── v1/
        ├── exam/
        │   └── attempt/
        │       └── [attemptId]/
        │           ├── current/route.ts
        │           ├── answer/route.ts
        │           ├── skip/route.ts
        │           ├── submit/route.ts
        │           └── timer/route.ts
        └── admin/
            └── exams/
                └── [examId]/
                    └── results/
                        └── export/route.ts

lib/
├── prisma.ts
├── auth.ts
├── exam-engine.ts
├── utils.ts
├── supabase/
│   ├── server.ts
│   └── client.ts
├── validations/
│   ├── auth.ts
│   ├── exam.ts
│   ├── section.ts
│   ├── question.ts
│   └── candidate.ts
└── generated/prisma/

hooks/
├── use-mobile.ts
└── use-exam-timer.ts

middleware.ts
prisma/schema.prisma
```

---

## Dependency Graph

```
Phase 1 (Foundation)
  Task 1.1 → Task 1.2 → Task 1.3 (can parallel with 1.4)
  Task 1.4 → Task 1.5 → Task 1.6 → Task 1.7

Phase 2 (Admin Panel) — depends on Phase 1
  Task 2.1 → Task 2.2 → Task 2.3 → Task 2.4 → Task 2.5

Phase 3 (Exam Engine) — depends on Phase 1 + Task 2.3
  Task 3.1 → Task 3.2 → Task 3.3 → Task 3.4

Phase 4 (Results) — depends on Phase 3
  Task 4.1 → Task 4.2 (can parallel) → Task 4.3

Phase 5 (Polish) — depends on Phase 2-4
  Tasks 5.1-5.4 can run in parallel
```
