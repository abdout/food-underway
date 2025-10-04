"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { 
  getAuthContext, 
  requireMerchantAccess,
  requireMerchantOwnership,
  requireRole,
  createActionResponse,
  createTenantSafeWhere,
  type ActionResponse 
} from "@/lib/auth-security";
import type { OnboardingSchoolData, OnboardingStep } from './type';
import { onboardingValidation } from './validation';

// Legacy interface for backward compatibility
export interface ListingFormData {
  id?: string;
  name?: string;
  description?: string;
  propertyType?: string;
  address?: string;
  maxStudents?: number;
  maxTeachers?: number;
  planType?: string;
  website?: string;
  pricePerNight?: number;
  domain?: string;
  // Branding fields
  logo?: string;
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
  draft?: boolean;
  isPublished?: boolean;
}

// Main onboarding school actions
export async function createSchool(data: OnboardingSchoolData): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();
    
    // Validate input data (partial validation for now)
    const validationResult = onboardingValidation.partial().parse(data);
    
    // Create merchant with minimal required fields
    const merchant = await db.merchant.create({
      data: {
        name: validationResult.name?.trim() || "New Merchant",
        phone: "",  // Required field
        address: validationResult.address?.trim() || "",
        city: validationResult.city?.trim() || "",
        description: validationResult.description,
        website: validationResult.website,
        owner: {
          connect: { id: authContext.userId }
        },
      },
    });

    revalidatePath("/onboarding");
    return createActionResponse(merchant);
  } catch (error) {
    console.error("Failed to create merchant:", error);
    return createActionResponse(undefined, error);
  }
}

// Legacy function for backward compatibility
export async function createListing(data: ListingFormData): Promise<ActionResponse> {
  return createSchool(data as OnboardingSchoolData);
}

export async function updateSchool(id: string, data: Partial<OnboardingSchoolData>): Promise<ActionResponse> {
  try {
    await requireMerchantOwnership(id);

    // Validate partial data if provided
    if (Object.keys(data).length > 0) {
      try {
        onboardingValidation.partial().parse(data);
      } catch (validationError) {
        return createActionResponse(undefined, {
          message: "Invalid data provided",
          name: "ValidationError"
        });
      }
    }

    const merchant = await db.merchant.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    revalidatePath(`/onboarding/${id}`);
    return createActionResponse(merchant);
  } catch (error) {
    console.error(`Failed to update merchant ${id}:`, error);
    return createActionResponse(undefined, error);
  }
}

// Legacy function for backward compatibility
export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<ActionResponse> {
  return updateSchool(id, data as Partial<OnboardingSchoolData>);
}

export async function getMerchant(id: string): Promise<ActionResponse> {
  try {
    await requireMerchantOwnership(id);

    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        // Include any related data needed for onboarding
        // users: true,
        // subscriptions: true,
      },
    });

    if (!merchant) {
      return createActionResponse(undefined, {
        message: "Merchant not found",
        name: "NotFoundError"
      });
    }

    return createActionResponse(merchant);
  } catch (error) {
    console.error(`Failed to get merchant ${id}:`, error);
    return createActionResponse(undefined, error);
  }
}

// Legacy function for backward compatibility
export async function getListing(id: string): Promise<ActionResponse> {
  return getMerchant(id);
}

export async function getUserMerchants(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();

    // Get all merchants associated with this user (drafts and completed)
    const merchants = await db.merchant.findMany({
      where: {
        // Add user filtering when user-merchant relationship is available
        // ownerId: authContext.userId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // Additional fields for better UX
        logo: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return createActionResponse(merchants);
  } catch (error) {
    console.error("Failed to get user merchants:", error);
    return createActionResponse(undefined, error);
  }
}

export async function initializeMerchantSetup(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();

    // Create a new merchant draft for the authenticated user
    const merchant = await db.merchant.create({
      data: {
        name: "New Merchant",
        phone: "",  // Required field
        address: "",  // Required field
        city: "",  // Required field
        owner: {
          connect: { id: authContext.userId }
        },
      },
    });

    revalidatePath("/onboarding");
    
    return createActionResponse(merchant);
  } catch (error) {
    console.error("Failed to initialize merchant setup:", error);
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
        createdAt: true,
        updatedAt: true,
        logo: true,
      },
    });

    if (!merchant) {
      return createActionResponse(undefined, {
        message: "Merchant not found",
        name: "NotFoundError"
      });
    }

    // Calculate setup completion percentage (simplified for merchant refactor)
    const checks = [
      !!merchant.name && merchant.name !== "New Merchant",
      // More checks will be added when we activate additional steps
    ];
    
    const completionPercentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return createActionResponse({
      ...merchant,
      completionPercentage,
      nextStep: getNextStep(merchant),
    });
  } catch (error) {
    console.error(`Failed to get merchant setup status for ${merchantId}:`, error);
    return createActionResponse(undefined, error);
  }
}

function getNextStep(merchant: any): OnboardingStep {
  // Simplified to 3 steps only
  if (!merchant.name || merchant.name === "New Merchant") {
    return "title";
  }
  // Check if subdomain has been reserved (will be implemented)
  // For now, just move to finish-setup after title
  return "subdomain";
}

export async function proceedToNextStep(merchantId: string): Promise<void> {
  try {
    // Validate user has ownership/access to this merchant
    await requireMerchantOwnership(merchantId);

    const statusResponse = await getMerchantSetupStatus(merchantId);
    if (!statusResponse.success || !statusResponse.data) {
      throw new Error("Failed to get merchant status");
    }

    const nextStep = statusResponse.data.nextStep;
    revalidatePath(`/onboarding/${merchantId}`);
    redirect(`/onboarding/${merchantId}/${nextStep}`);
  } catch (error) {
    console.error("Error proceeding to next step:", error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function proceedToTitle(merchantId: string): Promise<void> {
  return proceedToNextStep(merchantId);
}