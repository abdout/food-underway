"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getMerchantWithOnboardingFallback } from "@/lib/onboarding-auth";
import { 
  getAuthContext, 
  requireMerchantAccess,
  requireMerchantOwnership,
  requireRole,
  createActionResponse,
  createTenantSafeWhere,
  type ActionResponse 
} from "@/lib/auth-security";

// Types for listing actions
export interface ListingFormData {
  id?: string;
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  propertyType?: string;
  address?: string;
  addressAr?: string;
  logo?: string; // Merchant logo
  logoUrl?: string;
  subdomain?: string; // Merchant subdomain
  phone?: string; // Merchant phone
  location?: string; // Merchant location
  ownerName?: string; // Merchant owner name
  type?: string; // Merchant type (restaurant/cafe)
  maxStudents?: number;
  maxTeachers?: number;
  planType?: string;
  website?: string;
  pricePerNight?: number;
  domain?: string;
  // Branding fields
  primaryColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  // Capacity fields
  maxClasses?: number;
  maxFacilities?: number;
  // School fields
  schoolLevel?: 'primary' | 'secondary' | 'both';
  schoolType?: 'private' | 'public' | 'international' | 'technical' | 'special';
  // Pricing fields
  tuitionFee?: number;
  registrationFee?: number;
  applicationFee?: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  paymentSchedule?: 'monthly' | 'quarterly' | 'semester' | 'annual';
  // Listing fields
  title?: string;
  city?: string;
  state?: string;
  guestCount?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  // Status fields
  draft?: boolean;
  isPublished?: boolean;
}

// Listing CRUD actions
export async function createListing(data: ListingFormData): Promise<ActionResponse> {
  try {
    // Authentication is now handled at middleware level - just get the context for user ID
    const authContext = await getAuthContext();

    // Sanitize and validate input data
    const sanitizedData = {
      ...data,
      name: data.name?.trim() || "New Merchant",
      domain: data.domain?.toLowerCase().trim() || `merchant-${Date.now()}`,
      updatedAt: new Date(),
      // Link to the authenticated user (ensure this field exists in your schema)
      // ownerId: authContext.userId, // Uncomment if you have this field
    };

    // Create merchant with minimal required fields  
    const listing = await db.merchant.create({
      data: {
        name: sanitizedData.name,
        phone: "",  // Required field
        address: "",  // Required field
        city: "",  // Required field
        description: sanitizedData.description,
        website: sanitizedData.website,
        owner: {
          connect: { id: authContext.userId }
        },
      },
    });

    revalidatePath("/onboarding");
    return createActionResponse(listing);
  } catch (error) {
    logger.error("Failed to create merchant listing", error, { action: 'createListing' });
    return createActionResponse(undefined, error);
  }
}

export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(id);

    // Build update data with only valid Merchant fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Map ListingFormData fields to Merchant fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.addressAr !== undefined) updateData.addressAr = data.addressAr;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.type !== undefined) {
      // Convert string type to MerchantType enum
      const merchantType = data.type.toUpperCase().replace('-', '_');
      updateData.type = merchantType;
    }

    const listing = await db.merchant.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/onboarding");
    return createActionResponse(listing);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getListing(id: string): Promise<ActionResponse> {
  try {
    logger.debug('getListing called', { merchantId: id });
    
    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(id);

    const merchant = await db.merchant.findUnique({
      where: { id },
    });
    
    if (!merchant) {
      return createActionResponse(undefined, {
        message: "Merchant not found",
        name: "NotFoundError"
      });
    }
    
    return createActionResponse(merchant);
  } catch (error) {
    logger.error('Failed to get listing', error, { merchantId: id });
    return createActionResponse(undefined, error);
  }
}

export async function getCurrentUserMerchant(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();
    logger.debug('Getting current user merchant', {
      userId: authContext.userId,
      hasSessionMerchantId: !!authContext.merchantId
    });

    // If user has a merchantId in session, return it
    if (authContext.merchantId) {
      logger.debug('Returning session merchantId', { merchantId: authContext.merchantId });
      return createActionResponse({ merchantId: authContext.merchantId });
    }

    // Otherwise check database for user's merchant
    const user = await db.user.findUnique({
      where: { id: authContext.userId },
      select: { id: true, merchantId: true, email: true }
    });

    logger.debug('Database user lookup', {
      userId: authContext.userId,
      hasMerchantId: !!user?.merchantId
    });

    if (user?.merchantId) {
      logger.debug('Returning database merchantId', { merchantId: user.merchantId });
      return createActionResponse({ merchantId: user.merchantId });
    }

    logger.debug('No merchantId found for user', { userId: authContext.userId });
    return createActionResponse(null, { message: "No merchant found for user", code: "NO_MERCHANT" });
  } catch (error) {
    logger.error('Failed to get current user merchant', error, { action: 'getCurrentUserMerchant' });
    return createActionResponse(undefined, error);
  }
}

export async function getUserMerchants(): Promise<ActionResponse> {
  let authContext: any;
  try {
    authContext = await getAuthContext();

    // Get merchants associated with this user
    const merchants = await db.merchant.findMany({
      where: {
        // Filter by user's merchantId if they belong to a specific merchant
        // For PLATFORM_ADMIN role, they might see all merchants, but for others filter by merchantId
        ...(authContext.merchantId && { id: authContext.merchantId }),
        // If user has no merchantId (like PLATFORM_ADMIN), show merchants where they are owner
        ...(!authContext.merchantId && {
          ownerId: authContext.userId
        })
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        website: true,
        logo: true,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 2 // Limit to 2 merchants
    });

    // Get total count for "more" indicator
    const totalCount = await db.merchant.count({
      where: {
        // Same filter as above
        ...(authContext.merchantId && { id: authContext.merchantId }),
        ...(!authContext.merchantId && {
          ownerId: authContext.userId
        })
      }
    });

    return createActionResponse({ merchants, totalCount });
  } catch (error) {
    logger.error("Failed to get user merchants", error, { userId: authContext?.userId });
    return createActionResponse(undefined, error);
  }
}

export async function initializeMerchantSetup(): Promise<ActionResponse> {
  const timestamp = new Date().toISOString();
  logger.debug('initializeMerchantSetup started', { timestamp });
  
  try {
    logger.debug('Getting auth context');
    const authContext = await getAuthContext();
    logger.debug('Auth context received', {
      userId: authContext.userId,
      email: authContext.email,
      hasSessionMerchantId: !!authContext.merchantId
    });

    // Use the new merchant access system
    const { ensureUserMerchant } = await import('@/lib/merchant-access');
    const merchantResult = await ensureUserMerchant(authContext.userId);
    
    if (!merchantResult.success) {
      logger.error('Failed to ensure user merchant:', merchantResult.error);
      return createActionResponse(undefined, {
        message: merchantResult.error || 'Failed to initialize merchant',
        code: 'MERCHANT_INIT_FAILED'
      });
    }
    
    logger.debug('Merchant ensured successfully:', {
      merchantId: merchantResult.merchantId,
      merchantName: merchantResult.merchant?.name
    });
    
    // Revalidate the onboarding path
    revalidatePath("/onboarding");
    
    return createActionResponse(merchantResult.merchant);
  } catch (error) {
    logger.error("initializeMerchantSetup FAILED at some step:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      errorStack: error instanceof Error ? error.stack : undefined,
      failureTimestamp: new Date().toISOString()
    });
    return createActionResponse(undefined, error);
  }
}

/**
 * Reserve a subdomain for a merchant during onboarding
 */
export async function reserveSubdomainForMerchant(
  merchantId: string,
  subdomain: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(merchantId);

    // Import the subdomain actions
    const { reserveSubdomain } = await import('@/components/platform/dashboard/actions');
    
    // Reserve the subdomain
    const result = await reserveSubdomain(subdomain, merchantId);
    
    if (result.success) {
      revalidatePath("/onboarding");
    }
    
    return createActionResponse(result);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getMerchantSetupStatus(merchantId: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(merchantId);

    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        address: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Calculate setup completion percentage (simplified for merchant)
    const checks = [
      !!merchant.name && merchant.name !== "New Merchant",
      !!merchant.address,
      !!merchant.website,
    ];
    
    const completionPercentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return createActionResponse({
      ...merchant,
      completionPercentage,
      nextStep: getNextStep(merchant),
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

function getNextStep(merchant: any) {
  // Simplified to 3 steps only
  if (!merchant.name || merchant.name === "New Merchant") {
    return "title";
  }
  // Check if subdomain has been reserved (will be implemented)
  return "subdomain";
}

export async function proceedToTitle(merchantId: string) {
  try {
    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(merchantId);

    revalidatePath(`/onboarding/${merchantId}`);
  } catch (error) {
    logger.error("Error proceeding to information:", error);
    throw error;
  }

  redirect(`/onboarding/${merchantId}/title`);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use initializeMerchantSetup instead
 */
export async function initializeSchoolSetup(): Promise<ActionResponse> {
  return initializeMerchantSetup();
}

/**
 * Complete the merchant onboarding process
 * This is called when the user finishes the subdomain step
 */
export async function completeOnboarding(
  merchantId: string,
  subdomain: string
): Promise<ActionResponse> {
  try {
    logger.debug('completeOnboarding started', { merchantId, subdomain });

    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(merchantId);

    const authContext = await getAuthContext();

    // Update merchant: activate and set subdomain
    const merchant = await db.merchant.update({
      where: { id: merchantId },
      data: {
        subdomain: subdomain,
        updatedAt: new Date(),
      },
    });

    logger.debug('Merchant updated successfully', {
      merchantId,
      subdomain,
      merchantName: merchant.name
    });

    // Update user: set merchantId and role to OWNER
    await db.user.update({
      where: { id: authContext.userId },
      data: {
        merchantId: merchantId,
        role: 'OWNER',
      },
    });

    logger.debug('User updated to OWNER role', {
      userId: authContext.userId,
      merchantId
    });

    // Revalidate paths
    revalidatePath('/onboarding');
    revalidatePath('/dashboard');

    return createActionResponse({
      success: true,
      merchant,
      subdomain,
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    logger.error('Failed to complete onboarding', error, {
      merchantId,
      subdomain
    });
    return createActionResponse(undefined, error);
  }
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getUserMerchants instead
 */
export async function getUserSchools(): Promise<ActionResponse> {
  return getUserMerchants();
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getMerchantSetupStatus instead
 */
export async function getSchoolSetupStatus(merchantId: string): Promise<ActionResponse> {
  return getMerchantSetupStatus(merchantId);
}