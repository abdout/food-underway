// Subdomain step types

export interface SubdomainFormData {
  subdomain: string;
}

export interface SubdomainData {
  subdomain?: string;
  isCustom?: boolean;
}

export interface SubdomainAvailability {
  subdomain: string;
  available: boolean;
  message: string;
}

export interface SubdomainSuggestions {
  suggestions: string[];
  baseName: string;
}

export interface SubdomainProps {
  merchantId: string;
  merchantName?: string;
  initialData?: SubdomainData;
  onSubmit?: (data: SubdomainFormData) => Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export interface SubdomainValidationResult {
  isValid: boolean;
  available?: boolean;
  message: string;
}