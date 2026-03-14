import { requireAdmin } from "@/lib/auth";
import { AppSidebar } from "./components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar variant="inset" admin={{ name: admin.name, email: admin.email }} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center border-b bg-card px-4">
          {/* Left: trigger + mobile logo */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center justify-center">
                <Image
                  src="/GC LOGO.svg"
                  alt="Exam Portal Logo"
                  width={26}
                  height={26}
                  quality={100}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold tracking-tight">Exam Portal</span>
            </div>
          </div>

          {/* Right: user info */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-medium text-foreground leading-tight text-right w-full">
                {admin.name}
              </span>
              <span className="text-xs text-muted-foreground leading-tight text-right w-full">
                {admin.email}
              </span>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary select-none">
              {admin.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
