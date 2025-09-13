"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getSchoolWithOnboardingFallback } from "@/lib/onboarding-auth";
import { 
  getAuthContext, 
  requireSchoolAccess,
  requireSchoolOwnership,
  requireRole,
  createActionResponse,
  createTenantSafeWhere,
  type ActionResponse 
} from "@/lib/auth-security";

// Types for listing actions
export interface ListingFormData {
  id?: string;
  name?: string;
  description?: string;
  propertyType?: string;
  address?: string;
  logoUrl?: string;
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
      name: data.name?.trim() || "New School",
      domain: data.domain?.toLowerCase().trim() || `school-${Date.now()}`,
      updatedAt: new Date(),
      // Link to the authenticated user (ensure this field exists in your schema)
      // ownerId: authContext.userId, // Uncomment if you have this field
    };

    // Validate domain uniqueness
    if (sanitizedData.domain !== `school-${Date.now()}`) {
      const existingDomain = await db.school.findFirst({
        where: { domain: sanitizedData.domain },
        select: { id: true }
      });

      if (existingDomain) {
        return createActionResponse(undefined, {
          message: "Domain already exists",
          name: "ValidationError"
        });
      }
    }

    const listing = await db.school.create({
      data: sanitizedData,
    });

    revalidatePath("/onboarding");
    return createActionResponse(listing);
  } catch (error) {
    logger.error("Failed to create school listing", error, { action: 'createListing' });
    return createActionResponse(undefined, error);
  }
}

export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(id);

    const listing = await db.school.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    return createActionResponse(listing);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getListing(id: string): Promise<ActionResponse> {
  try {
    logger.debug('getListing called', { schoolId: id });
    
    // Create a wrapper that returns void
    const requireOwnership = async (schoolId: string): Promise<void> => {
      await requireSchoolOwnership(schoolId);
    };

    // Use the new helper that handles onboarding fallback cleanly
    const { school, fallbackUsed } = await getSchoolWithOnboardingFallback(
      id,
      requireOwnership
    );
    
    if (fallbackUsed) {
      logger.info('Using onboarding fallback for school access', { schoolId: id });
    }
    
    return createActionResponse(school);
  } catch (error) {
    logger.error('Failed to get listing', error, { schoolId: id });
    return createActionResponse(undefined, error);
  }
}

export async function getCurrentUserSchool(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();
    logger.debug('Getting current user school', {
      userId: authContext.userId,
      hasSessionSchoolId: !!authContext.schoolId
    });

    // If user has a schoolId in session, return it
    if (authContext.schoolId) {
      logger.debug('Returning session schoolId', { schoolId: authContext.schoolId });
      return createActionResponse({ schoolId: authContext.schoolId });
    }

    // Otherwise check database for user's school
    const user = await db.user.findUnique({
      where: { id: authContext.userId },
      select: { id: true, schoolId: true, email: true }
    });

    logger.debug('Database user lookup', {
      userId: authContext.userId,
      hasSchoolId: !!user?.schoolId
    });

    if (user?.schoolId) {
      logger.debug('Returning database schoolId', { schoolId: user.schoolId });
      return createActionResponse({ schoolId: user.schoolId });
    }

    logger.debug('No schoolId found for user', { userId: authContext.userId });
    return createActionResponse(null, { message: "No school found for user", code: "NO_SCHOOL" });
  } catch (error) {
    logger.error('Failed to get current user school', error, { action: 'getCurrentUserSchool' });
    return createActionResponse(undefined, error);
  }
}

export async function getUserSchools(): Promise<ActionResponse> {
  let authContext: any;
  try {
    authContext = await getAuthContext();

    // Get schools associated with this user
    const schools = await db.school.findMany({
      where: {
        // Filter by user's schoolId if they belong to a specific school
        // For DEVELOPER role, they might see all schools, but for others filter by schoolId
        ...(authContext.schoolId && { id: authContext.schoolId }),
        // If user has no schoolId (like DEVELOPER), we could show schools they have access to
        // For now, if no schoolId, show schools where they have user record
        ...(!authContext.schoolId && {
          users: {
            some: {
              id: authContext.userId
            }
          }
        })
      },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
        updatedAt: true,
        maxStudents: true,
        maxTeachers: true,
        planType: true, // This contains school level/type info
        address: true,
        website: true, // This contains pricing info
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 2 // Limit to 2 schools
    });

    // Get total count for "more" indicator
    const totalCount = await db.school.count({
      where: {
        // Same filter as above
        ...(authContext.schoolId && { id: authContext.schoolId }),
        ...(!authContext.schoolId && {
          users: {
            some: {
              id: authContext.userId
            }
          }
        })
      }
    });

    return createActionResponse({ schools, totalCount });
  } catch (error) {
    logger.error("Failed to get user schools", error, { userId: authContext?.userId });
    return createActionResponse(undefined, error);
  }
}

export async function initializeSchoolSetup(): Promise<ActionResponse> {
  const timestamp = new Date().toISOString();
  logger.debug('initializeSchoolSetup started', { timestamp });
  
  try {
    logger.debug('Getting auth context');
    const authContext = await getAuthContext();
    logger.debug('Auth context received', {
      userId: authContext.userId,
      email: authContext.email,
      hasSessionSchoolId: !!authContext.schoolId
    });

    // Use the new school access system
    const { ensureUserSchool } = await import('@/lib/school-access');
    const schoolResult = await ensureUserSchool(authContext.userId);
    
    if (!schoolResult.success) {
      logger.error('Failed to ensure user school:', schoolResult.error);
      return createActionResponse(undefined, {
        message: schoolResult.error || 'Failed to initialize school',
        code: 'SCHOOL_INIT_FAILED'
      });
    }
    
    logger.debug('School ensured successfully:', {
      schoolId: schoolResult.schoolId,
      schoolName: schoolResult.school?.name
    });
    
    // Revalidate the onboarding path
    revalidatePath("/onboarding");
    
    return createActionResponse(schoolResult.school);
  } catch (error) {
    logger.error("initializeSchoolSetup FAILED at some step:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      errorStack: error instanceof Error ? error.stack : undefined,
      failureTimestamp: new Date().toISOString()
    });
    return createActionResponse(undefined, error);
  }
}

/**
 * Reserve a subdomain for a school during onboarding
 */
export async function reserveSubdomainForSchool(
  schoolId: string,
  subdomain: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    // Import the subdomain actions
    const { reserveSubdomain } = await import('@/lib/subdomain-actions');
    
    // Reserve the subdomain
    const result = await reserveSubdomain(subdomain, schoolId);
    
    if (result.success) {
      revalidatePath("/onboarding");
    }
    
    return createActionResponse(result);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolSetupStatus(schoolId: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        address: true,
        maxStudents: true,
        maxTeachers: true,
        planType: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Calculate setup completion percentage
    const checks = [
      !!school.name && school.name !== "New School",
      !!school.address,
      !!school.planType?.includes('-'), // Has school description
      !!school.website?.startsWith('pricing-set-'), // Has pricing
      !!school.maxStudents,
      !!school.maxTeachers,
    ];
    
    const completionPercentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return createActionResponse({
      ...school,
      completionPercentage,
      nextStep: getNextStep(school),
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

function getNextStep(school: any) {
  if (!school.name || school.name === "New School") {
    return "title";
  }
  if (!school.planType?.includes('-')) {
    return "description";
  }
  if (!school.address) {
    return "location";
  }
  if (!school.maxStudents || !school.maxTeachers) {
    return "capacity";
  }
  if (!school.website?.startsWith('pricing-set-')) {
    return "price";
  }
  return "finish-setup";
}

export async function proceedToTitle(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    logger.error("Error proceeding to about-school:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/about-school`);
}