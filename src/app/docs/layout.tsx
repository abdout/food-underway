import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"
import { DocsAppSidebar } from "@/components/docs/docs-app-sidebar"
import { DocsThemeSwitcher } from "@/components/docs/docs-theme-switcher"
import { DocsTableOfContents } from "@/components/docs/toc"

interface DocsLayoutProps {
  children: React.ReactNode
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <SidebarProvider>
      <DocsAppSidebar />
      <SidebarInset className="flex-1">
        <header className="flex h-14 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="size-7" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <Button variant="ghost" size="icon" className="size-7" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <Button variant="ghost" size="icon" className="size-7">
            <Search className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <DocsThemeSwitcher />
        </header>
        <div className="flex flex-1 flex-col p-4">
          <div className="w-full">
            <main className="relative py-6 lg:gap-10 lg:pt-3 lg:pb-8">
              <div className="w-full min-w-0 max-w-[52rem]">
                {children}
              </div>
              <DocsTableOfContents />
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 