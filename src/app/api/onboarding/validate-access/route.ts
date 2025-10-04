import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  getOrCreateMerchantForOnboarding,
  syncUserMerchantContext 
} from '@/lib/merchant-access';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { schoolId: requestedMerchantId } = await request.json();
    const userId = session.user.id;

    console.log(" [API] Validating merchant access:", {
      userId,
      requestedMerchantId,
      sessionMerchantId: (session.user as any).merchantId,
    });

    // Get or create merchant for onboarding
    const { merchantId, isNew, merchant } = await getOrCreateMerchantForOnboarding(
      userId,
      requestedMerchantId
    );

    // If the merchant ID doesn't match what was requested, return redirect
    if (requestedMerchantId && requestedMerchantId !== merchantId) {
      console.log(" [API] Merchant ID mismatch, suggesting redirect:", {
        requested: requestedMerchantId,
        actual: merchantId,
      });
      
      return NextResponse.json({
        success: false,
        redirectTo: `/onboarding/${merchantId}/title`,
      });
    }

    // Sync the user's merchant context
    await syncUserMerchantContext(userId);

    return NextResponse.json({
      success: true,
      merchantId,
      merchantName: merchant.name,
      isNew,
    });

  } catch (error) {
    console.error(" [API] Error validating access:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate access' 
      },
      { status: 500 }
    );
  }
}