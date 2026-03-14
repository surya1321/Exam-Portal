import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { AppSidebar } from "./components/app-sidebar";
import { DashboardBreadcrumb } from "./components/dashboard-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="bg-muted/40 dark:bg-zinc-950">
      <AppSidebar 
        variant="sidebar" 
        className="!border-none [&>div[data-slot=sidebar-inner]]:bg-transparent pt-[5px]"
        admin={{ name: admin.name, email: admin.email }} 
      />
      <SidebarInset className="bg-transparent p-1 md:p-1 md:pl-0">
        <div className="bg-background rounded-md border flex flex-col h-full w-full overflow-hidden">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            {/* Left: trigger + breadcrumb + mobile logo */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
              <DashboardBreadcrumb />
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
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
