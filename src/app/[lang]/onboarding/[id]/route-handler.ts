/**
 * Onboarding Route Handler
 * Ensures proper merchant context and access for onboarding flow
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getOrCreateMerchantForOnboarding,
  syncUserMerchantContext 
} from "@/lib/merchant-access";

export async function ensureOnboardingAccess(requestedMerchantId?: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    console.log(" [ONBOARDING] No authenticated user, redirecting to login");
    redirect("/login");
  }

  const userId = session.user.id;
  
  try {
    // Get or create merchant for onboarding
    const { merchantId, isNew, merchant } = await getOrCreateMerchantForOnboarding(
      userId,
      requestedMerchantId
    );

    console.log(" [ONBOARDING] Merchant context established:", {
      userId,
      merchantId,
      isNew,
      merchantName: merchant.name,
      requestedMerchantId,
      sessionMerchantId: (session.user as any).merchantId,
    });

    // If the merchant ID doesn't match what was requested, redirect to correct URL
    if (requestedMerchantId && requestedMerchantId !== merchantId) {
      console.log(" [ONBOARDING] Redirecting to correct merchant:", {
        from: requestedMerchantId,
        to: merchantId,
      });
      redirect(`/onboarding/${merchantId}`);
    }

    // Sync the user's merchant context to ensure session consistency
    await syncUserMerchantContext(userId);

    return {
      merchantId,
      merchant,
      userId,
      isNew,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error ensuring access:", error);
    
    // Fallback: redirect to onboarding overview
    redirect("/onboarding");
  }
}