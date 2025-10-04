/**
 * Merchant Access Control and Management
 * Handles merchant creation, ownership, and access permissions
 */

import { db } from "./db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * Merchant access result types
 */
export interface MerchantAccessResult {
  hasAccess: boolean;
  merchant?: any;
  userRole?: UserRole;
  isOwner?: boolean;
  reason?: string;
}

/**
 * Merchant creation result
 */
export interface MerchantCreationResult {
  success: boolean;
  merchantId?: string;
  merchant?: any;
  error?: string;
}

/**
 * Check if user can access a specific merchant
 */
export async function canUserAccessMerchant(
  userId: string,
  merchantId: string
): Promise<MerchantAccessResult> {
  try {
    // Get user with their merchant association
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        merchantId: true,
      },
    });

    if (!user) {
      return { hasAccess: false, reason: "User not found" };
    }

    // Developers (platform admins) can access any merchant
    if (user.role === "PLATFORM_ADMIN") {
      const merchant = await db.merchant.findUnique({
        where: { id: merchantId },
      });

      return {
        hasAccess: true,
        merchant,
        userRole: user.role,
        isOwner: false,
        reason: "Platform admin access",
      };
    }

    // Check if user belongs to this merchant
    if (user.merchantId === merchantId) {
      const merchant = await db.merchant.findUnique({
        where: { id: merchantId },
      });

      return {
        hasAccess: true,
        merchant,
        userRole: user.role,
        isOwner: true,
        reason: "User belongs to merchant",
      };
    }

    // Check if this is a new/orphaned merchant that user can claim
    const orphanedMerchant = await db.merchant.findFirst({
      where: {
        id: merchantId,
        users: {
          none: {}, // No users associated
        },
      },
    });

    if (orphanedMerchant) {
      // Allow user to claim orphaned merchant
      return {
        hasAccess: true,
        merchant: orphanedMerchant,
        userRole: user.role,
        isOwner: false,
        reason: "Orphaned merchant can be claimed",
      };
    }

    // Check if user has been invited or has secondary access
    const merchantWithUsers = await db.merchant.findFirst({
      where: {
        id: merchantId,
        users: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (merchantWithUsers) {
      return {
        hasAccess: true,
        merchant: merchantWithUsers,
        userRole: user.role,
        isOwner: false,
        reason: "User has secondary access",
      };
    }

    return {
      hasAccess: false,
      reason: "User does not have access to this merchant",
    };
  } catch (error) {
    console.error("Error checking merchant access:", error);
    return {
      hasAccess: false,
      reason: "Error checking access permissions",
    };
  }
}

/**
 * Create or get user's merchant for onboarding
 */
export async function ensureUserMerchant(userId: string): Promise<MerchantCreationResult> {
  try {
    // Check if user already has a merchant
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // If user already has a merchant, return it
    if (user.merchantId && user.merchant) {
      console.log("Merchant User already has a merchant:", {
        userId,
        merchantId: user.merchantId,
        merchantName: user.merchant.name,
      });

      return {
        success: true,
        merchantId: user.merchantId,
        merchant: user.merchant,
      };
    }

    // Create a new merchant for the user
    console.log("Merchant Creating new merchant for user:", userId);

    const newMerchant = await db.merchant.create({
      data: {
        name: "New Merchant",
        phone: "",  // Required field
        address: "",  // Required field
        city: "",  // Required field
        owner: {
          connect: { id: userId }
        },
      },
    });

    // Update user with the new merchant
    await db.user.update({
      where: { id: userId },
      data: { 
        merchantId: newMerchant.id,
        // Set appropriate role if not set
        role: user.role || "ADMIN",
      },
    });

    console.log("✅ Merchant created and linked to user:", {
      userId,
      merchantId: newMerchant.id,
      merchantName: newMerchant.name,
    });

    return {
      success: true,
      merchantId: newMerchant.id,
      merchant: newMerchant,
    };
  } catch (error) {
    console.error("Error ensuring user merchant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create merchant",
    };
  }
}

/**
 * Switch user to a different merchant (for multi-merchant scenarios)
 */
export async function switchUserMerchant(
  userId: string,
  newMerchantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user can access the new merchant
    const accessResult = await canUserAccessMerchant(userId, newMerchantId);

    if (!accessResult.hasAccess) {
      return {
        success: false,
        error: accessResult.reason || "Access denied",
      };
    }

    // Update user's current merchant
    await db.user.update({
      where: { id: userId },
      data: { 
        merchantId: newMerchantId,
        updatedAt: new Date(), // Force session refresh
      },
    });

    console.log("🔄 User switched to merchant:", {
      userId,
      newMerchantId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error switching merchant:", error);
    return {
      success: false,
      error: "Failed to switch merchant",
    };
  }
}

/**
 * Get or create merchant for onboarding flow
 */
export async function getOrCreateMerchantForOnboarding(
  userId: string,
  requestedMerchantId?: string
): Promise<{ merchantId: string; isNew: boolean; merchant: any }> {
  // If a specific merchant is requested, check access
  if (requestedMerchantId) {
    const accessResult = await canUserAccessMerchant(userId, requestedMerchantId);
    
    if (accessResult.hasAccess && accessResult.merchant) {
      return {
        merchantId: requestedMerchantId,
        isNew: false,
        merchant: accessResult.merchant,
      };
    }
  }

  // Otherwise, ensure user has a merchant
  const result = await ensureUserMerchant(userId);
  
  if (!result.success || !result.merchantId || !result.merchant) {
    throw new Error(result.error || "Failed to ensure user merchant");
  }

  return {
    merchantId: result.merchantId,
    isNew: !requestedMerchantId, // New if no specific merchant was requested
    merchant: result.merchant,
  };
}

/**
 * Validate merchant ownership for sensitive operations
 */
export async function validateMerchantOwnership(
  userId: string,
  merchantId: string,
  requiredRole?: UserRole
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        merchantId: true,
      },
    });

    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Developers (platform admins) bypass all checks
    if (user.role === "PLATFORM_ADMIN") {
      return { isValid: true };
    }

    // Check merchant association
    if (user.merchantId !== merchantId) {
      // For onboarding, allow access to orphaned merchants
      const isOrphaned = await db.merchant.findFirst({
        where: {
          id: merchantId,
          users: { none: {} },
        },
      });

      if (!isOrphaned) {
        return { isValid: false, error: "User does not own this merchant" };
      }
    }

    // Check role requirements
    if (requiredRole) {
      const roleHierarchy: Record<UserRole, number> = {
        USER: 1,
        DELIVERY: 2,
        CHEF: 3,
        WAITER: 4,
        CASHIER: 5,
        MANAGER: 6,
        OWNER: 7,
        PLATFORM_ADMIN: 8,
      };

      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        return { isValid: false, error: "Insufficient permissions" };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating ownership:", error);
    return { isValid: false, error: "Validation error" };
  }
}

/**
 * Sync user session with merchant context
 */
export async function syncUserMerchantContext(userId: string): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        merchantId: true,
        updatedAt: true,
      },
    });

    if (user) {
      // Force a session update by updating the user record
      await db.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() },
      });

      console.log("🔄 User merchant context synced:", {
        userId,
        merchantId: user.merchantId,
      });
    }
  } catch (error) {
    console.error("Error syncing merchant context:", error);
  }
}