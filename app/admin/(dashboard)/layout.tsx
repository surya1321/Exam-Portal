import Link from "next/link";
import { LayoutDashboard, FileText, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/admin/(auth)/actions";
import { MobileSidebar } from "./components/mobile-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">Exam Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/exams"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <FileText className="h-4 w-4" />
            Exams
          </Link>
        </nav>

        {/* Sign out */}
        <div className="border-t p-4">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
        <MobileSidebar />
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">Exam Portal</span>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
