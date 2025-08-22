"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { normalizeSubdomain, isValidSubdomain } from "./subdomain"

/**
 * Check if a subdomain is available for use
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    // Normalize the subdomain
    const normalized = normalizeSubdomain(subdomain)
    
    // Validate format
    if (!isValidSubdomain(normalized)) {
      return {
        available: false,
        error: "Invalid subdomain format"
      }
    }
    
    // Check if already exists
    const existingSchool = await db.school.findUnique({
      where: { domain: normalized },
      select: { id: true, name: true }
    })
    
    if (existingSchool) {
      return {
        available: false,
        error: `Subdomain already taken by "${existingSchool.name}"`
      }
    }
    
    return { available: true }
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return {
      available: false,
      error: "Database error occurred"
    }
  }
}

/**
 * Reserve a subdomain for a school (during onboarding)
 */
export async function reserveSubdomain(
  subdomain: string, 
  schoolId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check availability first
    const availability = await checkSubdomainAvailability(subdomain)
    if (!availability.available) {
      return {
        success: false,
        error: availability.error
      }
    }
    
    // Update the school with the reserved subdomain
    await db.school.update({
      where: { id: schoolId },
      data: { domain: normalizeSubdomain(subdomain) }
    })
    
    revalidatePath("/onboarding")
    return { success: true }
  } catch (error) {
    console.error('Error reserving subdomain:', error)
    return {
      success: false,
      error: "Failed to reserve subdomain"
    }
  }
}

/**
 * Get all existing subdomains (for admin purposes)
 */
export async function getAllSubdomains(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; domain: string; isActive: boolean }>
  error?: string
}> {
  try {
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return { success: true, data: schools }
  } catch (error) {
    console.error('Error fetching subdomains:', error)
    return {
      success: false,
      error: "Failed to fetch subdomains"
    }
  }
}

/**
 * Update subdomain for an existing school
 */
export async function updateSubdomain(
  schoolId: string,
  newSubdomain: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check if new subdomain is available
    const availability = await checkSubdomainAvailability(newSubdomain)
    if (!availability.available) {
      return {
        success: false,
        error: availability.error
      }
    }
    
    // Update the school
    await db.school.update({
      where: { id: schoolId },
      data: { domain: normalizeSubdomain(newSubdomain) }
    })
    
    revalidatePath("/operator/tenants")
    return { success: true }
  } catch (error) {
    console.error('Error updating subdomain:', error)
    return {
      success: false,
      error: "Failed to update subdomain"
    }
  }
}

/**
 * Get school data by subdomain
 */
export async function getSchoolBySubdomain(subdomain: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const normalized = normalizeSubdomain(subdomain)
    
    const school = await db.school.findUnique({
      where: { domain: normalized },
      select: {
        id: true,
        name: true,
        domain: true,
        logoUrl: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        timezone: true,
        planType: true,
        maxStudents: true,
        maxTeachers: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!school) {
      return {
        success: false,
        error: "School not found"
      }
    }
    
    return { success: true, data: school }
  } catch (error) {
    console.error('Error fetching school by subdomain:', error)
    return {
      success: false,
      error: "Database error occurred"
    }
  }
}
