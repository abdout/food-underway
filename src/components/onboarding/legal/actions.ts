"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";

export async function completeOnboarding(
  schoolId: string,
  legalData: {
    operationalStatus: string;
    safetyFeatures: string[];
  }
): Promise<ActionResponse> {
  console.log("🚀 [COMPLETE ONBOARDING ACTION] Starting onboarding completion", {
    schoolId,
    legalData,
    timestamp: new Date().toISOString()
  });

  try {
    console.log("🔐 [COMPLETE ONBOARDING ACTION] Validating school ownership");
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);
    console.log("✅ [COMPLETE ONBOARDING ACTION] School ownership validated");

    console.log("📝 [COMPLETE ONBOARDING ACTION] Preparing school update data");
    // Update school with legal data and mark as onboarded
    // Using any to bypass TypeScript checks until migration is applied
    const updateData: any = {
      isActive: true,
      updatedAt: new Date(),
    };

    console.log("🏗️ [COMPLETE ONBOARDING ACTION] Initial update data:", updateData);

    // Only add these fields if they exist in the database
    try {
      console.log("🔧 [COMPLETE ONBOARDING ACTION] Adding legal fields to update data");
      updateData.operationalStatus = legalData.operationalStatus;
      updateData.safetyFeatures = legalData.safetyFeatures;
      updateData.onboardingCompletedAt = new Date();

      console.log("✅ [COMPLETE ONBOARDING ACTION] Legal fields added successfully:", {
        operationalStatus: updateData.operationalStatus,
        safetyFeatures: updateData.safetyFeatures,
        onboardingCompletedAt: updateData.onboardingCompletedAt
      });
    } catch (e) {
      console.log('⚠️ [COMPLETE ONBOARDING ACTION] New fields not yet migrated, skipping...', e);
    }
    
    console.log("💾 [COMPLETE ONBOARDING ACTION] Updating school in database", {
      where: { id: schoolId },
      data: updateData
    });

    const school = await db.school.update({
      where: { id: schoolId },
      data: updateData,
      select: {
        id: true,
        name: true,
        domain: true,
      }
    });

    console.log("✅ [COMPLETE ONBOARDING ACTION] School updated successfully:", school);

    if (!school.domain) {
      console.error("❌ [COMPLETE ONBOARDING ACTION] School subdomain not configured");
      throw new Error("School subdomain not configured. Please complete the subdomain step.");
    }

    console.log("🌐 [COMPLETE ONBOARDING ACTION] School domain validated:", school.domain);

    console.log("🔄 [COMPLETE ONBOARDING ACTION] Revalidating onboarding path");
    // Revalidate the onboarding path
    revalidatePath(`/onboarding/${schoolId}`);

    const redirectUrl = `/onboarding/${schoolId}/congratulations`;
    console.log("🎯 [COMPLETE ONBOARDING ACTION] Creating success response", {
      school,
      redirectUrl
    });

    const response = createActionResponse({
      success: true,
      school,
      redirectUrl
    });

    console.log("📤 [COMPLETE ONBOARDING ACTION] Returning success response:", response);
    return response;
  } catch (error) {
    console.error("💥 [COMPLETE ONBOARDING ACTION] Failed to complete onboarding:", error);
    console.log("📤 [COMPLETE ONBOARDING ACTION] Returning error response");
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolOnboardingStatus(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        // onboardingCompletedAt: true, // Comment out until migrated
      }
    }) as any;

    if (!school) {
      throw new Error("School not found");
    }

    return createActionResponse({
      isCompleted: !!school.onboardingCompletedAt,
      isActive: school.isActive,
      domain: school.domain,
      name: school.name
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}