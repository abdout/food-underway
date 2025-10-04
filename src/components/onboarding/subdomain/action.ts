"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";
import { subdomainValidation } from './validation';
import type { SubdomainFormData } from './type';

export async function updateSchoolSubdomain(
  schoolId: string, 
  data: SubdomainFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // Validate input data
    const validatedData = subdomainValidation.parse(data);
    
    // Check subdomain availability
    if (validatedData.domain) {
      const existingMerchant = await db.merchant.findFirst({
        where: { 
          subdomain: validatedData.domain,
          id: { not: schoolId }
        },
        select: { id: true }
      });

      if (existingMerchant) {
        return createActionResponse(undefined, {
          message: "This subdomain is already taken",
          name: "ValidationError"
        });
      }
    }
    
    // Update merchant subdomain
    const merchant = await db.merchant.update({
      where: { id: schoolId },
      data: {
        subdomain: validatedData.domain,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}`);
    return createActionResponse(merchant);
  } catch (error) {
    console.error("Failed to update school subdomain:", error);
    return createActionResponse(undefined, error);
  }
}

export async function checkSubdomainAvailability(subdomain: string): Promise<ActionResponse> {
  try {
    const existingMerchant = await db.merchant.findFirst({
      where: { subdomain: subdomain },
      select: { id: true }
    });

    const isAvailable = !existingMerchant;
    
    return createActionResponse({
      subdomain,
      available: isAvailable,
      message: isAvailable ? 'Subdomain is available' : 'Subdomain is already taken'
    });
  } catch (error) {
    console.error("Failed to check subdomain availability:", error);
    return createActionResponse(undefined, error);
  }
}

export async function generateSubdomainSuggestions(
  schoolName: string
): Promise<ActionResponse> {
  try {
    // Generate suggestions based on school name
    const baseName = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    const suggestions = [
      baseName,
      `${baseName}restaurant`,
      `${baseName}cafe`,
      `${baseName}menu`,
    ];

    // Check availability for each suggestion
    const availableSuggestions = [];
    
    for (const suggestion of suggestions) {
      const existing = await db.merchant.findFirst({
        where: { subdomain: suggestion },
        select: { id: true }
      });
      
      if (!existing) {
        availableSuggestions.push(suggestion);
      }
    }

    // If none available, add numbered suggestions
    if (availableSuggestions.length === 0) {
      for (let i = 1; i <= 10; i++) {
        const numberedSuggestion = `${baseName}${i}`;
        const existing = await db.merchant.findFirst({
          where: { subdomain: numberedSuggestion },
          select: { id: true }
        });
        
        if (!existing) {
          availableSuggestions.push(numberedSuggestion);
          if (availableSuggestions.length >= 5) break;
        }
      }
    }

    return createActionResponse({
      suggestions: availableSuggestions.slice(0, 5),
      baseName
    });
  } catch (error) {
    console.error("Failed to generate subdomain suggestions:", error);
    return createActionResponse(undefined, error);
  }
}