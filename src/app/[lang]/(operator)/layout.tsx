import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
// import SaasHeader from "@/components/template/saas-header/content";
// import SaasSidebar from "@/components/template/saas-sidebar/content";

export default async function OperatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const session = await auth();
  const { lang } = await params;

  // CRITICAL: Only PLATFORM_ADMIN can access operator routes
  if (!session?.user || (session.user as any).role !== 'PLATFORM_ADMIN') {
    console.warn('🚨 Unauthorized access attempt to operator dashboard:', {
      userId: session?.user?.id,
      userRole: (session?.user as any)?.role,
      timestamp: new Date().toISOString()
    });

    // Redirect based on user state
    if (!session?.user) {
      redirect(`/${lang}/login?callbackUrl=/${lang}/dashboard`);
    }

    const userMerchantId = (session.user as any)?.merchantId;

    // If user has no merchant, send to onboarding
    if (!userMerchantId) {
      redirect(`/${lang}/onboarding`);
    }

    // If user has merchant, redirect to their subdomain dashboard
    try {
      const merchant = await db.merchant.findUnique({
        where: { id: userMerchantId },
        select: { subdomain: true }
      });

      if (merchant?.subdomain) {
        const tenantDashboard = process.env.NODE_ENV === 'production'
          ? `https://${merchant.subdomain}.databayt.org/${lang}/dashboard`
          : `http://${merchant.subdomain}.localhost:3000/${lang}/dashboard`;

        redirect(tenantDashboard);
      }
    } catch (error) {
      console.error('❌ Error fetching merchant for redirect:', error);
    }

    // Fallback: redirect to home
    redirect(`/${lang}`);
  }

  return (
    <SidebarProvider>
      <ModalProvider>
        <div className="flex min-h-svh w-full flex-col">
          {/*<SaasHeader />*/}
          <div className="flex pt-6">
            {/*<SaasSidebar />*/}
            <div className="w-full pb-10">{children}</div>
          </div>
        </div>
      </ModalProvider>
    </SidebarProvider>
  );
}