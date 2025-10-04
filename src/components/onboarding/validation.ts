import { z } from "zod";
import type { 
  OnboardingStep, 
  SchoolType, 
  SchoolCategory, 
  Currency, 
  PaymentSchedule,
  BorderRadius,
  ShadowSize 
} from "./type";

// Base validation schemas
export const schoolTypeSchema = z.enum(['primary', 'secondary', 'both']);
export const schoolCategorySchema = z.enum(['private', 'public', 'international', 'technical', 'special']);
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);
export const paymentScheduleSchema = z.enum(['monthly', 'quarterly', 'semester', 'annual']);
export const borderRadiusSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']);
export const shadowSizeSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl']);

// Domain validation
export const domainSchema = z
  .string()
  .min(3, "Domain must be at least 3 characters")
  .max(63, "Domain must be less than 63 characters")
  .regex(/^[a-z0-9-]+$/, "Domain can only contain lowercase letters, numbers, and hyphens")
  .regex(/^[a-z0-9]/, "Domain must start with a letter or number")
  .regex(/[a-z0-9]$/, "Domain must end with a letter or number")
  .refine(val => !val.includes('--'), "Domain cannot contain consecutive hyphens");

// Email validation
export const emailSchema = z
  .string()
  .email("Please enter a valid email address");

// URL validation
export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .optional()
  .or(z.literal(""));

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number")
  .optional()
  .or(z.literal(""));

// Main onboarding validation schema
export const onboardingValidation = z.object({
  // Basic information
  name: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name must be less than 100 characters")
    .trim()
    .optional(),
    
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
    
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters")
    .trim()
    .optional(),
    
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters")
    .trim()
    .optional(),
    
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State must be less than 50 characters")
    .trim()
    .optional(),
    
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be less than 50 characters")
    .trim()
    .optional(),
    
  domain: domainSchema.optional(),
  website: urlSchema,
  
  // Contact information
  email: emailSchema.optional(),
  phone: phoneSchema,
  
  // Capacity
  maxStudents: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 student")
    .max(10000, "Cannot exceed 10,000 students")
    .optional(),
    
  maxTeachers: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 teacher")
    .max(1000, "Cannot exceed 1,000 teachers")
    .optional(),
    
  maxClasses: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 class")
    .max(500, "Cannot exceed 500 classes")
    .optional(),
    
  maxFacilities: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(100, "Cannot exceed 100 facilities")
    .optional(),
    
  // School details
  schoolLevel: schoolTypeSchema.optional(),
  schoolType: schoolCategorySchema.optional(),
  planType: z.string().optional(),
  
  // Pricing
  tuitionFee: z
    .number()
    .min(0, "Tuition fee cannot be negative")
    .max(100000, "Tuition fee seems too high")
    .optional(),
    
  registrationFee: z
    .number()
    .min(0, "Registration fee cannot be negative")
    .max(10000, "Registration fee seems too high")
    .optional(),
    
  applicationFee: z
    .number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee seems too high")
    .optional(),
    
  currency: currencySchema.optional(),
  paymentSchedule: paymentScheduleSchema.optional(),
  
  // Branding
  logo: z
    .string()
    .url("Logo must be a valid URL")
    .optional()
    .or(z.literal("")),
    
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Primary color must be a valid hex color")
    .optional(),
    
  borderRadius: borderRadiusSchema.optional(),
  shadow: shadowSizeSchema.optional(),
  
  // Status fields
  draft: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isComplete: z.boolean().optional(),
  
  // Metadata
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Step-specific validation schemas
export const titleStepValidation = onboardingValidation.pick({
  name: true,
}).partial(); // Make all fields optional

export const descriptionStepValidation = onboardingValidation.pick({
  description: true,
  schoolLevel: true,
  schoolType: true,
}).partial(); // Make all fields optional

export const locationStepValidation = onboardingValidation.pick({
  address: true,
  city: true,
  state: true,
  country: true,
}).partial(); // Make all fields optional

export const capacityStepValidation = onboardingValidation.pick({
  maxStudents: true,
  maxTeachers: true,
  maxClasses: true,
}).partial(); // Make all fields optional

export const brandingStepValidation = onboardingValidation.pick({
  logo: true,
  primaryColor: true,
  borderRadius: true,
  shadow: true,
}).partial(); // Make all fields optional

export const priceStepValidation = onboardingValidation.pick({
  tuitionFee: true,
  registrationFee: true,
  applicationFee: true,
}).partial(); // Make all fields optional

// Validation helper functions
export function validateStep(step: OnboardingStep, data: any): { isValid: boolean; errors: Record<string, string> } {
  // Always return valid for now
  return { isValid: true, errors: {} };
}

export function getRequiredFieldsForStep(step: OnboardingStep): string[] {
  // SIMPLIFIED: Only 3 active steps
  switch (step) {
    case 'title':
      return ['name'];
    case 'subdomain':
      return ['domain'];
    case 'finish-setup':
      return [];
    default:
      return [];
  }
}

// Export types inferred from schemas
export type OnboardingValidationData = z.infer<typeof onboardingValidation>;
export type DescriptionStepData = z.infer<typeof descriptionStepValidation>;
export type LocationStepData = z.infer<typeof locationStepValidation>;
export type CapacityStepData = z.infer<typeof capacityStepValidation>;
export type BrandingStepData = z.infer<typeof brandingStepValidation>;
export type PriceStepData = z.infer<typeof priceStepValidation>;
export type LegalStepData = z.infer<typeof legalStepValidation>;