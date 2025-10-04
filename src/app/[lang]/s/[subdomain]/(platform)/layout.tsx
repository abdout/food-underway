import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
// import PlatformHeader from "@/components/template/platform-header/content";
import PlatformSidebar from "@/components/template/platform-sidebar/content";
import { MerchantProvider } from "@/components/platform/context";
import { getMerchantBySubdomain } from "@/components/platform/dashboard/actions";
import { notFound } from "next/navigation";

interface PlatformLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

export default async function PlatformLayout({
  children,
  params,
}: Readonly<PlatformLayoutProps>) {
  const { subdomain } = await params;
  const result = await getMerchantBySubdomain(subdomain);

  if (!result.success || !result.data) {
    console.error('School not found for subdomain:', subdomain, result);
    notFound();
  }

  const merchant = result.data;
  
  // Debug logging
  console.log('Platform layout - merchant data:', { subdomain, merchant });

  return (
    <MerchantProvider merchant={merchant}>
      <SidebarProvider>
        <ModalProvider>
          {/* Ensure the provider's flex wrapper has a single column child to preserve layout */}
          <div className="flex min-h-svh w-full flex-col">
            {/*<PlatformHeader merchant={merchant} />*/}
            <div className="flex pt-6">
              {/*<PlatformSidebar merchant={merchant} />*/}
              <div className="w-full pb-10">{children}</div>
            </div>
          </div>
        </ModalProvider>
      </SidebarProvider>
    </MerchantProvider>
  );
}