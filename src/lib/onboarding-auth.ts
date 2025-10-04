/**
 * Onboarding-specific authentication utilities
 * Provides flexible auth checks during the onboarding flow
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthContext, TenantError } from "./auth-security";

/**
 * Check if a user has access to a merchant during onboarding
 * This is more lenient than standard merchant ownership checks
 * to handle race conditions during merchant creation
 */
export async function checkOnboardingAccess(
  userId: string,
  merchantId: string
): Promise<boolean> {
  try {
    // Check if user has merchantId access
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { merchantId: true, createdAt: true }
    });

    if (user?.merchantId === merchantId) {
      logger.debug('User has matching merchantId', { userId, merchantId });
      return true;
    }

    // Check if this is a recent onboarding session (within 1 hour)
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { createdAt: true }
    });

    if (!merchant) {
      return false;
    }

    // Allow access if both merchant and user were created recently
    // This handles race conditions during onboarding
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const merchantIsRecent = merchant.createdAt > oneHourAgo;
    const userIsRecent = user && user.createdAt > oneHourAgo;

    if (merchantIsRecent && userIsRecent) {
      logger.info('Allowing onboarding access for recent entities', {
        userId,
        merchantId,
        merchantAge: Date.now() - merchant.createdAt.getTime(),
        userAge: user ? Date.now() - user.createdAt.getTime() : null
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error checking onboarding access', error, { userId, schoolId: merchantId });
    return false;
  }
}

/**
 * Determines if an error is due to cross-tenant access denial
 */
export function isCrossTenantError(error: unknown): boolean {
  if (error instanceof TenantError && error.code === 'CROSS_TENANT_ACCESS_DENIED') {
    return true;
  }
  
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as any).code === 'CROSS_TENANT_ACCESS_DENIED';
  }
  
  return false;
}

/**
 * Get merchant data with onboarding fallback
 * Attempts standard auth first, falls back to onboarding checks if needed
 */
export async function getMerchantWithOnboardingFallback(
  merchantId: string,
  requireOwnership: (id: string) => Promise<void>
) {
  try {
    // Try standard ownership check first
    await requireOwnership(merchantId);
    
    // If successful, fetch and return the merchant
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    return { school: merchant, fallbackUsed: false };
  } catch (error) {
    // Only attempt fallback for cross-tenant errors during onboarding
    if (!isCrossTenantError(error)) {
      throw error;
    }

    logger.debug('Standard auth failed, attempting onboarding fallback', { merchantId });

    // Get auth context for fallback check
    const authContext = await getAuthContext();
    
    // Check if user has onboarding access
    const hasAccess = await checkOnboardingAccess(authContext.userId, merchantId);
    
    if (!hasAccess) {
      logger.warn('Onboarding access denied', { 
        userId: authContext.userId, 
        merchantId 
      });
      throw error; // Re-throw original error
    }

    // Fetch the merchant data
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    logger.info('Onboarding fallback successful', {
      userId: authContext.userId,
      merchantId
    });

    return { school: merchant, fallbackUsed: true };
  }
}