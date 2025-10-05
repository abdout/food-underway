import type { OnboardingStep, OnboardingStepGroup, StepConfig, SchoolTemplate } from './type';

// Onboarding step configuration - 3 STEPS (one per stage)
export const ONBOARDING_STEPS: Record<OnboardingStep, StepConfig> = {
  'title': {
    step: 'title',
    title: 'Merchant Name',
    description: 'What\'s the name of your merchant?',
    group: 'basic',
    isRequired: true,
    order: 1,
  },
  'logo': {
    step: 'logo',
    title: 'Merchant Logo',
    description: 'Upload your merchant logo.',
    group: 'basic',
    isRequired: false,
    order: 2,
    dependencies: ['title'],
  },
  'subdomain': {
    step: 'subdomain',
    title: 'Merchant Domain',
    description: 'Choose your merchant\'s web address.',
    group: 'setup',
    isRequired: true,
    order: 3,
    dependencies: ['logo'],
  },
  'finish-setup': {
    step: 'finish-setup',
    title: 'Complete Setup',
    description: 'Your merchant setup is complete!',
    group: 'business',
    isRequired: true,
    order: 4,
    dependencies: ['subdomain'],
  },
};

// Step groups with metadata
export const STEP_GROUPS: Record<OnboardingStepGroup, { title: string; description: string; color: string }> = {
  basic: {
    title: 'Basic Information',
    description: 'Essential details about your merchant',
    color: 'blue',
  },
  setup: {
    title: 'Merchant Setup',
    description: 'Configure your merchant domain',
    color: 'green',
  },
  business: {
    title: 'Complete Setup',
    description: 'Finalize your merchant setup',
    color: 'purple',
  },
};

// Ordered list of steps for navigation
export const STEP_ORDER: OnboardingStep[] = Object.values(ONBOARDING_STEPS)
  .sort((a, b) => a.order - b.order)
  .map(config => config.step);

// Required steps that must be completed
export const REQUIRED_STEPS: OnboardingStep[] = Object.values(ONBOARDING_STEPS)
  .filter(config => config.isRequired)
  .map(config => config.step);

// School type options
export const SCHOOL_TYPES = [
  { value: 'primary', label: 'Primary School', description: 'Ages 5-11' },
  { value: 'secondary', label: 'Secondary School', description: 'Ages 12-18' },
  { value: 'both', label: 'Primary & Secondary', description: 'Ages 5-18' },
] as const;

// School category options
export const SCHOOL_CATEGORIES = [
  { value: 'private', label: 'Private School', description: 'Independently funded' },
  { value: 'public', label: 'Public School', description: 'Government funded' },
  { value: 'international', label: 'International School', description: 'International curriculum' },
  { value: 'technical', label: 'Technical School', description: 'Vocational training' },
  { value: 'special', label: 'Special Needs School', description: 'Specialized education' },
] as const;

// Currency options
export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
] as const;

// Payment schedule options
export const PAYMENT_SCHEDULES = [
  { value: 'monthly', label: 'Monthly', description: '12 payments per year' },
  { value: 'quarterly', label: 'Quarterly', description: '4 payments per year' },
  { value: 'semester', label: 'Per Semester', description: '2 payments per year' },
  { value: 'annual', label: 'Annual', description: '1 payment per year' },
] as const;

// Branding options
export const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'None', preview: 'square corners' },
  { value: 'sm', label: 'Small', preview: 'slightly rounded' },
  { value: 'md', label: 'Medium', preview: 'moderately rounded' },
  { value: 'lg', label: 'Large', preview: 'very rounded' },
  { value: 'xl', label: 'Extra Large', preview: 'extremely rounded' },
  { value: 'full', label: 'Full', preview: 'circular' },
] as const;

export const SHADOW_OPTIONS = [
  { value: 'none', label: 'None', preview: 'no shadow' },
  { value: 'sm', label: 'Small', preview: 'subtle shadow' },
  { value: 'md', label: 'Medium', preview: 'moderate shadow' },
  { value: 'lg', label: 'Large', preview: 'prominent shadow' },
  { value: 'xl', label: 'Extra Large', preview: 'very prominent shadow' },
] as const;

// Default color palette for school branding
export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#6B7280', // Gray
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

// School templates for quick setup
export const SCHOOL_TEMPLATES: SchoolTemplate[] = [
  {
    id: 'elementary',
    name: 'Elementary School',
    description: 'Template for primary education (K-5)',
    category: 'public',
    level: 'primary',
    data: {
      schoolLevel: 'primary',
      schoolType: 'public',
      maxStudents: 300,
      maxTeachers: 15,
      maxClasses: 20,
      currency: 'USD',
      paymentSchedule: 'annual',
    },
  },
  {
    id: 'high-school',
    name: 'High School',
    description: 'Template for secondary education (9-12)',
    category: 'public',
    level: 'secondary',
    data: {
      schoolLevel: 'secondary',
      schoolType: 'public',
      maxStudents: 800,
      maxTeachers: 40,
      maxClasses: 60,
      currency: 'USD',
      paymentSchedule: 'semester',
    },
  },
  {
    id: 'private-academy',
    name: 'Private Academy',
    description: 'Template for private K-12 institution',
    category: 'private',
    level: 'both',
    data: {
      schoolLevel: 'both',
      schoolType: 'private',
      maxStudents: 500,
      maxTeachers: 35,
      maxClasses: 45,
      currency: 'USD',
      paymentSchedule: 'quarterly',
      tuitionFee: 15000,
      registrationFee: 500,
      applicationFee: 100,
    },
  },
  {
    id: 'international',
    name: 'International School',
    description: 'Template for international curriculum school',
    category: 'international',
    level: 'both',
    data: {
      schoolLevel: 'both',
      schoolType: 'international',
      maxStudents: 600,
      maxTeachers: 45,
      maxClasses: 50,
      currency: 'USD',
      paymentSchedule: 'semester',
      tuitionFee: 25000,
      registrationFee: 1000,
      applicationFee: 200,
    },
  },
];

// Capacity presets
export const CAPACITY_PRESETS = [
  { label: 'Small School', students: 200, teachers: 12, classes: 15 },
  { label: 'Medium School', students: 500, teachers: 30, classes: 35 },
  { label: 'Large School', students: 1000, teachers: 60, classes: 70 },
  { label: 'Very Large School', students: 2000, teachers: 120, classes: 140 },
] as const;

// Form validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  invalidPhone: 'Please enter a valid phone number',
  invalidSubdomain: 'Please enter a valid subdomain name',
  subdomainTaken: 'This subdomain is already taken',
  passwordTooWeak: 'Password must be at least 8 characters with letters and numbers',
  passwordMismatch: 'Passwords do not match',
  termsRequired: 'You must accept the terms and conditions',
  privacyRequired: 'You must accept the privacy policy',
} as const;

// Animation and UI constants
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Loading states
export const LOADING_STATES = {
  idle: 'idle',
  loading: 'loading',
  submitting: 'submitting',
  success: 'success',
  error: 'error',
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
} as const;

// API endpoints
export const API_ENDPOINTS = {
  schools: '/api/schools',
  upload: '/api/upload',
  validate: '/api/validate',
  templates: '/api/templates',
} as const;