import SiteHeader from "@/components/template/site-header/content";
import {getMerchantBySubdomain} from "@/components/platform/dashboard/actions";
import { notFound } from "next/navigation";

// import { SiteFooter } from "@/components/site-footer";

interface SiteLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

export default async function SiteLayout({
  children,
  params,
}: Readonly<SiteLayoutProps>) {
  const { subdomain } = await params;
  const result = await getMerchantBySubdomain(subdomain);

  if (!result.success || !result.data) {
    notFound();
  }

  const merchant = result.data;

  return (
    <div data-slot="site-layout">
      {/*<SiteHeader merchant={merchant} />*/}
      <main 
        data-slot="main-content"
        role="main"
      >
        {children}
      </main>
      {/* <SiteFooter /> */}
    </div>
  );
}