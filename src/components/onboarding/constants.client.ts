// Client-safe onboarding constants (no Prisma imports)

// Form field limits
export const FORM_LIMITS = {
  TITLE_MAX_LENGTH: 40, // Reduced to 40 characters
  TITLE_MIN_LENGTH: 2,  // Reduced to 2 characters
  DESCRIPTION_MAX_LENGTH: 500,
  DESCRIPTION_MIN_LENGTH: 50,
  MIN_PHOTOS: 1,
  MAX_PHOTOS: 10,
  MIN_STUDENTS: 10,
  MAX_STUDENTS: 10000,
  MIN_TEACHERS: 1,
  MAX_TEACHERS: 500,
  MIN_CLASSES: 1,
  MAX_CLASSES: 100
} as const;

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  TITLE_TOO_SHORT: `School name must be at least ${FORM_LIMITS.TITLE_MIN_LENGTH} characters`,
  TITLE_TOO_LONG: `School name must be no more than ${FORM_LIMITS.TITLE_MAX_LENGTH} characters`,
  DESCRIPTION_TOO_SHORT: `Description must be at least ${FORM_LIMITS.DESCRIPTION_MIN_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be no more than ${FORM_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
  NOT_ENOUGH_PHOTOS: `You need at least ${FORM_LIMITS.MIN_PHOTOS} photo`,
  TOO_MANY_PHOTOS: `You can upload a maximum of ${FORM_LIMITS.MAX_PHOTOS} photos`,
  INVALID_NUMBER: 'Please enter a valid number'
} as const;

// Step navigation mapping - 3 STEPS
export const STEP_NAVIGATION: Record<string, { next?: string; previous?: string }> = {
  'title': { next: 'subdomain' },
  'subdomain': { next: 'finish-setup', previous: 'title' },
  'finish-setup': { previous: 'subdomain' }
};