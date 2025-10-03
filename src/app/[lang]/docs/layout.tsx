import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"
import { DocsSidebar } from "@/components/template/docs-sidebar/content"
import { DocsThemeSwitcher } from "@/components/docs/docs-theme-switcher"
import { DocsTableOfContents } from "@/components/docs/toc"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface DocsLayoutProps {
  children: React.ReactNode
  params: { lang: Locale }
}

export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const dictionary = await getDictionary(params.lang)
  const isRtl = params.lang === 'ar'

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={params.lang} className={isRtl ? "font-rubik" : "font-inter"}>
      <SidebarProvider defaultOpen={true}>
        <DocsSidebar
          dictionary={dictionary}
          lang={params.lang}
          side={isRtl ? "right" : "left"}
        />
        <SidebarInset
          dir={isRtl ? "rtl" : "ltr"}
          className={isRtl ? 'rtl-sidebar-content' : ''}
        >
            <header className="flex h-14 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="size-7" />
              <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
              <Button variant="ghost" size="icon" className="size-7" asChild>
                <Link href={`/${params.lang}`}>
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
                <main className={`relative py-6 lg:gap-10 lg:pt-3 lg:pb-8 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div className={`w-full min-w-0 max-w-[52rem] ${isRtl ? 'mr-auto' : 'ml-0'}`}>
                    {children}
                  </div>
                  {/* Table of Contents is hidden on smaller screens, shown on large screens */}
                  <DocsTableOfContents isRtl={isRtl} />
                </main>
              </div>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
} 