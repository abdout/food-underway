"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { platformNav } from "@/components/template/platform-sidebar/constant";
import type { Role } from "@/components/template/platform-sidebar/constant";
import { Icons } from "@/components/template/platform-sidebar/icons";
import { useCurrentRole } from "@/components/auth/use-current-role";
import type { School } from "@/components/site/types";

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  school: School;
}

export default function PlatformSidebar({ school, ...props }: PlatformSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const role = useCurrentRole();
  const currentRole = (role as unknown as Role | undefined) ?? undefined;

  // Defensive check for school data
  if (!school || !school.name) {
    return (
      <div className="w-56 top-12 p-4">
        <div className="text-sm text-muted-foreground">Loading school data...</div>
      </div>
    );
  }

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <Sidebar {...props} className="w-56 top-12" collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center" onClick={handleLinkClick}>
                <div className="flex flex-col leading-none">
                  <span className="font-medium text-base text-foreground -ml-1">{school.name}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea className="h-full">
          <SidebarGroup className="p-2">
            <SidebarMenu className="space-y-1">
              {platformNav
                .filter((item) => (currentRole ? item.roles.includes(currentRole) : false))
                .map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link href={item.href} className="text-sm font-normal" onClick={handleLinkClick}>
                        <span className={`mr-2 inline-flex items-center justify-center ${
                          item.className ? "size-auto" : "size-4"
                        }`}>
                          {(() => {
                            const Icon = Icons[item.icon];
                            if (item.className) {
                              return Icon ? <Icon className={item.className} /> : null;
                            }
                            return Icon ? <Icon className="h-4 w-4" /> : null;
                          })()}
                        </span>
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
