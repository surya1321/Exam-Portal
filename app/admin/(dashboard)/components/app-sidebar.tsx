"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, FileText, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { signOut } from "@/app/admin/(auth)/actions"

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Exams",
    url: "/admin/exams",
    icon: FileText,
  },
]

export function AppSidebar({
  admin,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  admin: { name?: string | null; email?: string | null }
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="flex h-12 items-center gap-2.5 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex shrink-0 items-center justify-center">
            <Image
              src="/GC LOGO.svg"
              alt="Exam Portal Logo"
              width={26}
              height={26}
              quality={100}
              className="object-contain"
            />
          </div>
          <span className="font-semibold tracking-tight text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
            Exam Portal
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.url === "/admin/dashboard"
                    ? pathname === "/admin/dashboard"
                    : pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {/* Expanded state: sign out button */}
        <div className="group-data-[collapsible=icon]:hidden">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>

        {/* Collapsed state: centered sign-out icon */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="flex items-center justify-center rounded-md p-1.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
