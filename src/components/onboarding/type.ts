// Core onboarding types following standardized patterns

export type OnboardingStep = 
  | 'title'
  | 'description'
  | 'location'
  | 'capacity'
  | 'branding'
  | 'import'
  | 'join'
  | 'visibility'
  | 'price'
  | 'discount'
  | 'legal'
  | 'about-school'
  | 'stand-out'
  | 'finish-setup'
  | 'subdomain';

export type OnboardingStepGroup = 'basic' | 'setup' | 'business';

export type SchoolType = 'primary' | 'secondary' | 'both';
export type SchoolCategory = 'private' | 'public' | 'international' | 'technical' | 'special';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type PaymentSchedule = 'monthly' | 'quarterly' | 'semester' | 'annual';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ShadowSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// School onboarding data structure
export interface OnboardingSchoolData {
  id?: string;
  name?: string;
  description?: string;
  address?: string;
  domain?: string;
  website?: string;
  logo?: string;
  
  // Capacity
  maxStudents?: number;
  maxTeachers?: number;
  maxClasses?: number;
  maxFacilities?: number;
  
  // School details
  schoolLevel?: SchoolType;
  schoolType?: SchoolCategory;
  planType?: string;
  
  // Pricing
  tuitionFee?: number;
  registrationFee?: number;
  applicationFee?: number;
  currency?: Currency;
  paymentSchedule?: PaymentSchedule;
  
  // Branding
  primaryColor?: string;
  borderRadius?: BorderRadius;
  shadow?: ShadowSize;
  
  // Location details
  city?: string;
  state?: string;
  country?: string;
  
  // Status
  draft?: boolean;
  isPublished?: boolean;
  isComplete?: boolean;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

// Progress tracking
export interface OnboardingProgress {
  schoolId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  completionPercentage: number;
  nextStep?: OnboardingStep;
  canProceed: boolean;
}

// Step configuration
export interface StepConfig {
  step: OnboardingStep;
  title: string;
  description: string;
  group: OnboardingStepGroup;
  isRequired: boolean;
  order: number;
  dependencies?: OnboardingStep[];
}

// Form state management
export interface OnboardingFormState {
  isLoading: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
}

// API response types
export interface OnboardingApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    name: string;
    code?: string;
  };
}

// School with setup status
export interface SchoolWithStatus extends OnboardingSchoolData {
  completionPercentage: number;
  nextStep: OnboardingStep;
  missingFields: string[];
}

// Step validation result
export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  canProceed: boolean;
}

// Onboarding context type
export interface OnboardingContextType {
  school: OnboardingSchoolData | null;
  progress: OnboardingProgress | null;
  isLoading: boolean;
  updateSchool: (data: Partial<OnboardingSchoolData>) => Promise<void>;
  proceedToNextStep: () => Promise<void>;
  goToStep: (step: OnboardingStep) => void;
  refreshProgress: () => Promise<void>;
}

// Template types
export interface SchoolTemplate {
  id: string;
  name: string;
  description: string;
  category: SchoolCategory;
  level: SchoolType;
  data: Partial<OnboardingSchoolData>;
  preview?: string;
}

// Export legacy types for backward compatibility
export interface ListingFormData extends OnboardingSchoolData {
  // Legacy fields that might be used in existing code
  propertyType?: string;
  pricePerNight?: number;
  guestCount?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}