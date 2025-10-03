"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"

import { ScrollArea } from "@/components/ui/scroll-area"
import { docsConfig } from "@/components/template/docs-sidebar/constant"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"

// Translation mapping for navigation items
function translateNavTitle(title: string, dictionary?: Dictionary): string {
  if (!dictionary?.docs) return title

  const translationMap: Record<string, keyof typeof dictionary.docs> = {
    'Introduction': 'introduction',
    'Requirements': 'requirements',
    'Roadmap': 'roadmap',
    'Architecture': 'architecture',
    'Pattern': 'pattern',
    'Stack': 'stack',
    'Database': 'database',
    'Getting Started': 'gettingStarted',
  }

  const key = translationMap[title]
  if (key && dictionary.docs[key]) {
    return dictionary.docs[key] as string
  }

  return title
}

// Flatten the sidebar navigation to a single list
function flattenSidebarNav(items: typeof docsConfig.sidebarNav, dictionary?: Dictionary) {
  const flatItems: Array<{
    title: string
    href: string
    isActive?: boolean
  }> = []

  items.forEach((section) => {
    section.items.forEach((item) => {
      if (item.href) {
        flatItems.push({
          title: translateNavTitle(item.title, dictionary),
          href: item.href,
        })
      }
      // Add sub-items if they exist
      if (item.items && item.items.length > 0) {
        item.items.forEach((subItem) => {
          if (subItem.href) {
            flatItems.push({
              title: translateNavTitle(subItem.title, dictionary),
              href: subItem.href,
            })
          }
        })
      }
    })
  })

  return flatItems
}

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  dictionary?: Dictionary
  lang?: Locale
  side?: "left" | "right"
}

export function DocsSidebar({ dictionary, lang, side = "left", ...props }: DocsSidebarProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const flatNavItems = React.useMemo(() => flattenSidebarNav(docsConfig.sidebarNav, dictionary), [dictionary])
  const isRtl = lang === 'ar'

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <Sidebar
      {...props}
      side={side}
      className="w-56"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <SidebarHeader className=" ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${lang || 'en'}/docs`} className={`flex items-center ${isRtl ? 'justify-end' : 'justify-start'}`} onClick={handleLinkClick}>
                <div className="flex flex-col leading-none">
                  <span className="font-medium text-foreground">
                    {dictionary?.docs?.title || 'Documentation'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea
          className="h-full"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <SidebarGroup className={`${isRtl ? 'pr-2 pl-3' : 'p-2'}`}>
            <SidebarMenu className="space-y-1">
              {flatNavItems.map((item) => {
                // Prepend language to href if not already present
                const localizedHref = item.href.startsWith('/docs')
                  ? `/${lang || 'en'}${item.href}`
                  : item.href
                const isActive = pathname === localizedHref

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link href={localizedHref} className={`flex items-center ${isRtl ? 'justify-end' : 'justify-start'}`} onClick={handleLinkClick}>
                        <div className="flex flex-col leading-none">
                          <span className="muted">
                            {item.title}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
} 