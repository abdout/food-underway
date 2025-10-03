// Information step types

export interface InformationData {
  viewed: boolean;
  viewedAt?: Date;
}

export interface WelcomeData {
  totalSteps: number;
  estimatedTime: string;
  completionRate: number;
}

export interface OnboardingStats {
  averageCompletionTime: number;
  mostCommonSchoolTypes: string[];
  successfulCompletions: number;
}

export interface InformationProps {
  schoolId?: string;
  onContinue?: () => void;
  showProgress?: boolean;
}