"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  requireMerchantOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";
import { subdomainValidation } from './validation';
import type { SubdomainFormData } from './type';

export async function updateMerchantSubdomain(
  merchantId: string, 
  data: SubdomainFormData
): Promise<ActionResponse> {
  try {
    await requireMerchantOwnership(merchantId);

    // Validate input data
    const validatedData = subdomainValidation.parse(data);
    
    // Check subdomain availability
    if (validatedData.subdomain) {
      const existingMerchant = await db.merchant.findFirst({
        where: { 
          subdomain: validatedData.subdomain,
          id: { not: merchantId }
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
      where: { id: merchantId },
      data: {
        subdomain: validatedData.subdomain,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${merchantId}`);
    return createActionResponse(merchant);
  } catch (error) {
    // Handle Prisma unique constraint error (P2002)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return createActionResponse(undefined, {
        message: "This subdomain is already taken",
        name: "ValidationError",
        code: 'P2002',
      });
    }
    console.error("Failed to update merchant subdomain:", error);
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
  merchantName: string
): Promise<ActionResponse> {
  try {
    // Generate suggestions based on merchant name
    const baseName = merchantName
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