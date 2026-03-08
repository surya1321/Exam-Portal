# Project Rules and Architecture Guidelines

This document outlines the mandatory tech stack and architecture constraints for all coding tasks within the `Exam-Portal` project.

---

## 🏗️ Core Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Data Fetching/State**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/) (Mandatory for all schema validations)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)

---

## 🛤️ Architectural Principles

### 1. Server-First Approach
- **React Server Components (RSC)**: Use Server Components for all data fetching where possible. Client Components (`'use client'`) should only be used for interactivity, hooks, or when requiring manual browser APIs.
- **Server Actions**: All database mutations (Create, Update, Delete) **MUST** be implemented using Server Actions. Direct API route creation should be avoided unless explicitly required for external integrations.

### 2. Data Management (Prisma)
- **Singleton Pattern**: Always import the Prisma client from `@/lib/prisma`.
- **Security**: Never expose direct Prisma queries in Client Components.

### 3. TanStack Query Integration
- Use **TanStack Query** for client-side data fetching that requires caching, polling, or sophisticated loading states.
- When performing mutations via Server Actions, use TanStack Query's `useMutation` hook to manage loading states and trigger cache invalidation.

### 4. Forms and Validation
- **React Hook Form**: Use for all complex forms.
- **Zod Schemas**: Define validation schemas in a shared `lib/validations` (or similar) folder to ensure consistent validation between the client-side forms and Server Actions.
- **Server-Side Validation**: Always re-validate input data inside Server Actions using the same Zod schema used on the client.

### 5. Styling and UI
- Follow **Mobile-First** responsiveness.
- Use **Shadcn/UI** components as the foundation.
- Prefer **Tailwind CSS** utility classes over custom CSS files.

---

## 📋 Coding Conventions
- Use **TypeScript** for everything (no `any`).
- Use **ESLint** and **Prettier** standards (defined in the project configuration).
- Write clean, modular, and self-documenting code.
- Implement proper error handling for all asynchronous operations.
