# UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Six UX improvements: redirect to edit after exam creation, essay question type (ungraded), email as candidate identifier, publish button in edit mode, better true/false UI, and thank-you screen after exam submission.

**Architecture:** Changes span the Prisma schema, Zod validations, admin UI components, candidate exam-taking UI, and API routes. Tasks are ordered to respect dependencies (schema → validations → UI/API). No new dependencies needed.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL), Zod, React Hook Form, shadcn/ui, bcryptjs

---

### Task 1: Prisma Schema — Add `essay` type + email-as-candidate-identifier

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Edit the schema**

In `prisma/schema.prisma`, make these three changes:

**A. Add `essay` to the `QuestionType` enum:**
```prisma
enum QuestionType {
  mcq
  true_false
  fill_blank
  essay
}
```

**B. Update the `Candidate` model — remove `username`, make `email` required and unique per exam:**
```prisma
model Candidate {
  id           String   @id @default(uuid()) @db.Uuid
  examId       String   @map("exam_id") @db.Uuid
  passwordHash String   @map("password_hash") @db.VarChar(255)
  fullName     String   @map("full_name") @db.VarChar(200)
  email        String   @db.VarChar(255)
  isUsed       Boolean  @default(false) @map("is_used")
  createdAt    DateTime @default(now()) @map("created_at")

  exam     Exam          @relation(fields: [examId], references: [id], onDelete: Cascade)
          attempts ExamAttempt[]

  @@unique([examId, email])
  @@map("candidates")
}
```

**Step 2: Generate and apply the migration**

```bash
npx prisma migrate dev --name "essay_type_and_candidate_email_identifier"
```

Expected output: Migration created and applied, Prisma Client regenerated.

**Step 3: Verify the generated client**

```bash
npx prisma studio
```

Check that the `candidates` table no longer has a `username` column and has a unique index on `(exam_id, email)`. Close Prisma Studio.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add essay question type and use email as candidate identifier in schema"
```

---

### Task 2: Update Zod Validations

**Files:**
- Modify: `lib/validations/question.ts`
- Modify: `lib/validations/candidate.ts`
- Modify: `lib/validations/auth.ts`

**Step 1: Update `lib/validations/question.ts`**

Make `correctAnswer` optional (essay has no correct answer) and add `essay` to the type enum:

```typescript
import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text is required"),
});

export const createQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["mcq", "true_false", "fill_blank", "essay"]),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional().default(""),
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

**Step 2: Update `lib/validations/candidate.ts`**

Remove `username`, make `email` required:

```typescript
import { z } from "zod";

export const createCandidateSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Valid email is required"),
});

export const bulkCreateCandidatesSchema = z.object({
  candidates: z.array(createCandidateSchema).min(1, "At least one candidate required"),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type BulkCreateCandidatesInput = z.infer<typeof bulkCreateCandidatesSchema>;
```

**Step 3: Update `lib/validations/auth.ts`**

Change `username` → `email` in `candidateSignInSchema`:

```typescript
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
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
  accessLink: z.string().min(1, "Exam access link is required"),
});

export type AdminSignInInput = z.infer<typeof adminSignInSchema>;
export type AdminSignUpInput = z.infer<typeof adminSignUpSchema>;
export type CandidateSignInInput = z.infer<typeof candidateSignInSchema>;
```

**Step 4: Commit**

```bash
git add lib/validations/
git commit -m "feat: update validations for essay type and email-based candidate login"
```

---

### Task 3: Redirect to Edit Mode After Exam Creation

**Files:**
- Modify: `app/admin/(dashboard)/exams/create-exam-dialog.tsx`

**Step 1: Add `useRouter` and redirect on success**

The `createExam` server action already returns `{ data: exam }` where `exam.id` is the new exam's UUID. Add `useRouter` and navigate to the exam edit page on success.

Find the `onSubmit` function and update it:

```typescript
// At the top of the file, add useRouter:
import { useTransition } from "react";
import { useRouter } from "next/navigation";  // ADD THIS
// ... rest of imports

export function CreateExamDialog({ open, onOpenChange }: CreateExamDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();  // ADD THIS
  // ... rest of component

  function onSubmit(data: CreateExamInput) {
    startTransition(async () => {
      const result = await createExam(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Exam created — add your sections and questions");
        reset();
        onOpenChange(false);
        router.push(`/admin/exams/${result.data.id}`);  // ADD THIS
      }
    });
  }
```

**Step 2: Commit**

```bash
git add app/admin/\(dashboard\)/exams/create-exam-dialog.tsx
git commit -m "feat: redirect to exam edit page immediately after creation"
```

---

### Task 4: Essay Question Type in Admin Question Form

**Files:**
- Modify: `app/admin/(dashboard)/exams/[examId]/sections/question-form.tsx`

**Step 1: Update the `QuestionData` type**

Change:
```typescript
questionType: "mcq" | "true_false" | "fill_blank";
```
To:
```typescript
questionType: "mcq" | "true_false" | "fill_blank" | "essay";
```

**Step 2: Update the `handleTypeChange` function**

Add `essay` to the union type:
```typescript
function handleTypeChange(value: string) {
  const newType = value as "mcq" | "true_false" | "fill_blank" | "essay";
  setValue("questionType", newType);
  setValue("correctAnswer", "");

  if (newType === "mcq") {
    setValue("options", defaultOptions);
  } else {
    setValue("options", undefined as unknown as { id: string; text: string }[]);
  }
}
```

**Step 3: Add Essay to the Select dropdown**

In the `<SelectContent>` block, add after the `fill_blank` item:
```tsx
<SelectItem value="essay">Essay (Open-ended)</SelectItem>
```

**Step 4: Add Essay info block in the conditional fields area**

After the `fill_blank` block (around line 313), add:
```tsx
{questionType === "essay" && (
  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
    <p className="text-sm text-muted-foreground">
      Candidates will see a large text area to write their response.
      Essay answers are not auto-graded and are excluded from scoring.
    </p>
  </div>
)}
```

**Step 5: Update the `onSubmit` cleanup logic**

The `cleanedData` block currently only handles `mcq` and `true_false`. Add essay:
```typescript
function onSubmit(data: QuestionFormValues) {
  const cleanedData = { ...data };

  if (data.questionType !== "mcq") {
    cleanedData.options = undefined;
  }
  if (data.questionType === "essay") {
    cleanedData.correctAnswer = "";  // No correct answer for essays
  }
  // ... rest unchanged
}
```

**Step 6: Commit**

```bash
git add "app/admin/(dashboard)/exams/[examId]/sections/question-form.tsx"
git commit -m "feat: add essay question type to admin question form"
```

---

### Task 5: Exclude Essay Questions from Marks Calculation

**Files:**
- Modify: `app/admin/(dashboard)/exams/[examId]/sections/actions.ts`
- Modify: `app/admin/(dashboard)/exams/[examId]/page.tsx`

**Step 1: Update `recalculateExamMarks` in sections/actions.ts**

Essay questions should not contribute to totalMarks. Update the aggregate query:

```typescript
async function recalculateExamMarks(examId: string) {
  const result = await prisma.question.aggregate({
    where: {
      section: { examId },
      questionType: { not: "essay" },  // ADD THIS
    },
    _sum: { marks: true },
  });
  await prisma.exam.update({
    where: { id: examId },
    data: { totalMarks: Math.round(Number(result._sum.marks ?? 0)) },
  });
}
```

**Step 2: Update the `questionType` cast in `app/admin/(dashboard)/exams/[examId]/page.tsx`**

Find this line:
```typescript
questionType: q.questionType as "mcq" | "true_false" | "fill_blank",
```
Change to:
```typescript
questionType: q.questionType as "mcq" | "true_false" | "fill_blank" | "essay",
```

**Step 3: Commit**

```bash
git add "app/admin/(dashboard)/exams/[examId]/sections/actions.ts" \
        "app/admin/(dashboard)/exams/[examId]/page.tsx"
git commit -m "feat: exclude essay questions from exam total marks calculation"
```

---

### Task 6: Publish Button in Exam Edit Page

**Files:**
- Create: `app/admin/(dashboard)/exams/[examId]/publish-button.tsx`
- Modify: `app/admin/(dashboard)/exams/[examId]/page.tsx`

**Step 1: Create `publish-button.tsx`**

```typescript
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { togglePublishExam } from "../actions";

interface PublishButtonProps {
  examId: string;
  isPublished: boolean;
}

export function PublishButton({ examId, isPublished }: PublishButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await togglePublishExam(examId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.data?.isPublished ? "Exam published" : "Exam unpublished"
        );
      }
    });
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={isPublished ? "outline" : "default"}
      size="sm"
    >
      {isPending
        ? isPublished
          ? "Unpublishing..."
          : "Publishing..."
        : isPublished
          ? "Unpublish"
          : "Publish Exam"}
    </Button>
  );
}
```

**Step 2: Add `PublishButton` to the exam header in `page.tsx`**

Import the new component at the top:
```typescript
import { PublishButton } from "./publish-button";
```

Find the exam header section (`<div className="flex items-start justify-between">`).
The right side currently has an empty `<div>` (closing of `items-start justify-between`). Add the button there:

Replace:
```tsx
      </div>
    </div>
```
(the closing of the header div and its right side)

With:
```tsx
      </div>
      <PublishButton examId={examId} isPublished={exam.isPublished} />
    </div>
```

Note: The header div structure is:
```tsx
<div className="flex items-start justify-between">
  <div className="space-y-1">   {/* left: title + badge */}
    ...
  </div>
                                {/* right side is empty — add PublishButton here */}
</div>
```

**Step 3: Also add `revalidatePath` for the exam detail page in `togglePublishExam`**

In `app/admin/(dashboard)/exams/actions.ts`, find `togglePublishExam` and add:
```typescript
revalidatePath(`/admin/exams/${examId}`);  // ADD after existing revalidatePath
revalidatePath("/admin/exams");
```

**Step 4: Commit**

```bash
git add "app/admin/(dashboard)/exams/[examId]/publish-button.tsx" \
        "app/admin/(dashboard)/exams/[examId]/page.tsx" \
        "app/admin/(dashboard)/exams/actions.ts"
git commit -m "feat: add publish/unpublish button directly on exam edit page"
```

---

### Task 7: Candidate Email-as-Identifier (Form + Actions + Login)

**Files:**
- Modify: `app/admin/(dashboard)/exams/[examId]/candidates/add-candidate-dialog.tsx`
- Modify: `app/admin/(dashboard)/exams/[examId]/candidates/actions.ts`
- Modify: `app/exam/[accessLink]/actions.ts`
- Modify: `app/exam/[accessLink]/login/page.tsx`

**Step 1: Update `add-candidate-dialog.tsx`**

Remove the `username` field entirely. Make `email` required (remove the "(optional)" label).

Replace the entire component's form section:

```typescript
// defaultValues — remove username, email is now required string
defaultValues: {
  fullName: "",
  password: "",
  email: "",
},
```

Remove the entire Username `<div className="grid gap-2">` block (lines 110–124).

Update the Email field — remove `(optional)` from label and change type to required:
```tsx
{/* Email */}
<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="e.g. john@example.com"
    {...register("email")}
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p className="text-destructive text-sm">{errors.email.message}</p>
  )}
</div>
```

Update the success toast (no longer shows username):
```typescript
toast.success(
  `Candidate created — Email: ${result.data.email}, Password: ${result.data.rawPassword}`,
  { duration: 10000 }
);
```

**Step 2: Update `candidates/actions.ts`**

Replace `createCandidate` to use `email` instead of `username`:

```typescript
export async function createCandidate(examId: string, input: unknown) {
  await verifyExamOwnership(examId);
  const parsed = createCandidateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    const candidate = await prisma.candidate.create({
      data: {
        examId,
        passwordHash,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
      },
    });

    revalidatePath(`/admin/exams/${examId}/candidates`);
    return {
      data: {
        id: candidate.id,
        email: candidate.email,
        rawPassword: parsed.data.password,
      },
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return {
        error: "A candidate with this email already exists for this exam",
      };
    }
    return { error: "Failed to create candidate" };
  }
}
```

Also update `bulkCreateCandidates` — replace `username: candidate.username` with `email: candidate.email` in both the create data and the results array.

**Step 3: Update `app/exam/[accessLink]/actions.ts` — `signInCandidate`**

Change the lookup from `examId_username` to `examId_email`:

```typescript
// Change this:
const candidate = await prisma.candidate.findUnique({
  where: { examId_username: { examId: exam.id, username: parsed.data.username } },
});

// To this:
const candidate = await prisma.candidate.findUnique({
  where: { examId_email: { examId: exam.id, email: parsed.data.email } },
});
```

**Step 4: Update `app/exam/[accessLink]/login/page.tsx`**

Change the form field from `username` to `email`:

```typescript
// defaultValues
defaultValues: {
  email: "",      // was: username: ""
  password: "",
  accessLink: params.accessLink ?? "",
},
```

Replace the username `FormField` with email:
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Step 5: Commit**

```bash
git add "app/admin/(dashboard)/exams/[examId]/candidates/" \
        "app/exam/[accessLink]/actions.ts" \
        "app/exam/[accessLink]/login/page.tsx"
git commit -m "feat: use email as candidate identifier, remove username field"
```

---

### Task 8: Essay Question Type in Exam-Taking UI

**Files:**
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/question-display.tsx`
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx`

**Step 1: Update `question-display.tsx`**

**A. Update the `QuestionDisplayProps` type:**
```typescript
type QuestionDisplayProps = {
  question: {
    id: string;
    text: string;
    type: "mcq" | "true_false" | "fill_blank" | "essay";  // ADD essay
    options: { id: string; text: string }[] | null;
    marks: number;
  };
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  questionNumber: number;
};
```

**B. Add essay handler before the final `fill_blank` return:**

```tsx
if (question.type === "essay") {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
        {questionNumber}. {question.text}
      </h1>
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {question.marks} {question.marks === 1 ? "mark" : "marks"} &bull; Open-ended
      </div>
      <div className="mt-2">
        <textarea
          value={selectedAnswer || ""}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="Write your answer here..."
          rows={8}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base resize-y"
        />
      </div>
    </div>
  );
}
```

**Step 2: Update `exam-client.tsx` — add `essay` to the `Question` type**

```typescript
type Question = {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "fill_blank" | "essay";  // ADD essay
  options: { id: string; text: string }[] | null;
  marks: number;
  imageUrl?: string | null;
};
```

Also update the `handleNext` function — essay questions can be submitted with empty answer:
```typescript
async function handleNext() {
  if (!question) return;
  // For essay: allow empty answer (selectedAnswer can be "" or null)
  if (question.type !== "essay" && !selectedAnswer) return;
  // ...rest unchanged
}
```

Also update the Next button's disabled state to allow essay submission:
```tsx
disabled={question.type !== "essay" && (!selectedAnswer || submitting) || (question.type === "essay" && submitting)}
```

Simplify the disabled logic:
```tsx
disabled={submitting || (question.type !== "essay" && !selectedAnswer)}
```

**Step 3: Commit**

```bash
git add "app/exam/[accessLink]/attempt/[attemptId]/question-display.tsx" \
        "app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx"
git commit -m "feat: add essay question type to candidate exam-taking UI"
```

---

### Task 9: Handle Essay Answers in the Answer API Route

**Files:**
- Modify: `app/api/v1/exam/attempt/[attemptId]/answer/route.ts`

**Step 1: Update the answer route**

The current route rejects empty `selectedAnswer`. Essay questions should accept any text (including empty). Also, essay answers should always be `isCorrect: false` and `marksAwarded: 0`.

Replace the initial validation and the correctness logic:

```typescript
// Change the initial validation — only require questionId
if (!questionId) {
  return NextResponse.json(
    { error: "questionId is required" },
    { status: 400 }
  );
}
// selectedAnswer can be empty string for essays — allow it

// ... (keep existing attempt lookup and expiry check unchanged) ...

// After fetching the question, update the isCorrect + marksAwarded logic:
let isCorrect = false;
let marksAwarded = 0;

if (question.questionType === "essay") {
  // Essays are ungraded — always false / 0
  isCorrect = false;
  marksAwarded = 0;
} else {
  isCorrect = selectedAnswer === question.correctAnswer;
  if (isCorrect) {
    marksAwarded = Number(question.marks);
  } else {
    const exam = await prisma.exam.findUnique({ where: { id: attempt.examId } });
    if (exam?.allowNegativeMarking) {
      marksAwarded = -Number(exam.negativeMarkValue);
    }
  }
}
```

Also update the `selectedAnswer` storage — for essay use the essay text, for others use the selection:
```typescript
await prisma.response.create({
  data: {
    attemptId,
    questionId,
    sectionId: question.sectionId,
    selectedAnswer: selectedAnswer ?? "",  // store essay text or answer id
    isCorrect,
    marksAwarded,
  },
});
```

**Step 2: Commit**

```bash
git add "app/api/v1/exam/attempt/[attemptId]/answer/route.ts"
git commit -m "feat: handle essay answers in answer API (ungraded, store text response)"
```

---

### Task 10: Exclude Essay from Scoring in `computeAndSubmitAttempt`

**Files:**
- Modify: `lib/exam-engine.ts`

**Step 1: Update `computeAndSubmitAttempt`**

Essay questions should not count as "wrong" answers. `totalWrong` needs to exclude essay responses. `totalUnanswered` needs to exclude essay questions from the count.

Replace the scoring section:

```typescript
export async function computeAndSubmitAttempt(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: { question: true },  // ADD: include question to check type
      },
      exam: {
        include: {
          sections: {
            include: { questions: true },
          },
        },
      },
    },
  });
  if (!attempt) return null;

  // Exclude essay questions from scoring counts
  const gradableQuestions = attempt.exam.sections.flatMap((s) =>
    s.questions.filter((q) => q.questionType !== "essay")
  );
  const totalGradableQuestions = gradableQuestions.length;

  const gradableResponses = attempt.responses.filter(
    (r) => r.question.questionType !== "essay"
  );

  const totalCorrect = gradableResponses.filter((r) => r.isCorrect).length;
  const totalWrong = gradableResponses.filter(
    (r) => !r.isCorrect && r.selectedAnswer
  ).length;
  const totalUnanswered = totalGradableQuestions - gradableResponses.length;
  const totalScore = attempt.responses.reduce(
    (sum, r) => sum + Number(r.marksAwarded),
    0
  );

  const timeRemaining = await getTimeRemaining(attemptId);

  const updated = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: timeRemaining <= 0 ? "timed_out" : "completed",
      submittedAt: new Date(),
      timeRemainingSec: timeRemaining,
      totalScore,
      totalCorrect,
      totalWrong,
      totalUnanswered,
    },
  });

  return updated;
}
```

**Step 2: Commit**

```bash
git add lib/exam-engine.ts
git commit -m "feat: exclude essay questions from pass/fail scoring in computeAndSubmitAttempt"
```

---

### Task 11: Thank-You Screen After Exam Submission

**Files:**
- Create: `app/exam/[accessLink]/complete/page.tsx`
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx`

**Step 1: Create `app/exam/[accessLink]/complete/page.tsx`**

```tsx
import Image from "next/image";
import { ClipboardList } from "lucide-react";

export default function ExamCompletePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5 px-6 h-14">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 overflow-hidden">
            <Image
              src="/GC LOGO.png"
              alt="GC Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="font-semibold tracking-tight">GCIA Assessment Platform</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <ClipboardList className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Thank You for Attempting the Exam
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Your responses have been submitted successfully.
              Results will be shared to your email once evaluated.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              You may now close this window.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Update all redirects in `exam-client.tsx`**

There are four places that redirect to the result page. Change all of them from `/result/${attemptId}` to `/complete`.

1. In `fetchCurrentQuestion`, status 410:
```typescript
router.push(`/exam/${accessLink}/complete`);
```

2. In `fetchCurrentQuestion`, status 403:
```typescript
router.push(`/exam/${accessLink}/complete`);
```

3. In `handleNext`, status 410:
```typescript
router.push(`/exam/${accessLink}/complete`);
```

4. In `handleSubmitExam`:
```typescript
if (res.ok || res.status === 403) {
  router.push(`/exam/${accessLink}/complete`);
}
```

**Step 3: Commit**

```bash
git add "app/exam/[accessLink]/complete/page.tsx" \
        "app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx"
git commit -m "feat: show thank-you screen after exam submission instead of results"
```

---

### Task 12: Improve True/False UI in Exam-Taking (Button Style)

**Files:**
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/question-display.tsx`

The existing true/false implementation already uses label-wrapped radio inputs styled as clickable boxes (same pattern as MCQ). The radio input circle is still visible though. Improve it to pure button-style options without the radio circle, making it cleaner and more touch-friendly.

**Step 1: Replace the true_false block in `question-display.tsx`**

```tsx
if (question.type === "true_false") {
  const tfOptions = [
    { id: "true", text: "True" },
    { id: "false", text: "False" },
  ];
  return (
    <div className="flex flex-col gap-3 flex-1">
      <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
        {questionNumber}. {question.text}
      </h1>
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {question.marks} {question.marks === 1 ? "mark" : "marks"}
      </div>
      <div className="flex gap-4 mt-2">
        {tfOptions.map((option) => {
          const isSelected = selectedAnswer === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`flex-1 rounded-xl border-2 py-5 text-lg font-bold transition-all
                ${isSelected
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/exam/[accessLink]/attempt/[attemptId]/question-display.tsx"
git commit -m "feat: replace radio-style true/false with clean button-style options"
```

---

## Summary of All Changes

| Task | Files Modified | Description |
|------|---------------|-------------|
| 1 | `prisma/schema.prisma` + migration | Add essay enum, email-as-identifier |
| 2 | `lib/validations/` (3 files) | Update schemas |
| 3 | `create-exam-dialog.tsx` | Redirect to edit after creation |
| 4 | `question-form.tsx` | Essay type in admin form |
| 5 | `sections/actions.ts`, `[examId]/page.tsx` | Exclude essay from marks |
| 6 | New `publish-button.tsx`, `[examId]/page.tsx`, `exams/actions.ts` | Publish button in edit mode |
| 7 | `add-candidate-dialog.tsx`, `candidates/actions.ts`, `exam/actions.ts`, `login/page.tsx` | Email as identifier |
| 8 | `question-display.tsx`, `exam-client.tsx` | Essay UI in exam-taking |
| 9 | `answer/route.ts` | Essay answer handling in API |
| 10 | `lib/exam-engine.ts` | Essay excluded from scoring |
| 11 | New `complete/page.tsx`, `exam-client.tsx` | Thank-you screen |
| 12 | `question-display.tsx` | True/False button UI |
