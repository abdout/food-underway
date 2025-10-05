"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import SchoolOnboardingDashboard from './overview/host-dashboard';
import { useCurrentUser } from '@/components/auth/use-current-user';
import { ErrorBoundary } from './error-boundary';
import { getUserMerchants, initializeMerchantSetup } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import type { Dictionary } from '@/components/internationalization/dictionaries';

interface OnboardingContentProps {
  dictionary?: Dictionary;
  locale?: string;
}

export default function OnboardingContent({ dictionary, locale }: OnboardingContentProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const [isCreating, setIsCreating] = React.useState(false);
  const [schools, setSchools] = React.useState<any[]>([]);
  const [totalSchools, setTotalSchools] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    console.log('🚀 [ONBOARDING] Initializing onboarding flow', {
      user: user?.email,
      locale,
      timestamp: new Date().toISOString()
    });
    loadUserSchools();
  }, []);

  const loadUserSchools = async () => {
    console.log('📚 [ONBOARDING] Loading user merchants');
    try {
      const response = await getUserMerchants();
      if (response.success) {
        const data = response.data || { schools: [], totalCount: 0 };
        console.log('✅ [ONBOARDING] Successfully loaded merchants', {
          merchantCount: data.schools?.length || 0,
          totalCount: data.totalCount || 0
        });
        setSchools(data.schools || []);
        setTotalSchools(data.totalCount || 0);
      } else {
        console.error('❌ [ONBOARDING] Failed to load merchants:', {
          error: response.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ [ONBOARDING] Error loading merchants:', {
        error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolClick = (id: string) => {
    console.log('🔄 [ONBOARDING] Navigating to existing merchant', {
      merchantId: id,
      timestamp: new Date().toISOString()
    });
    router.push(`/onboarding/${id}/title`);
  };

  const handleCreateNew = async () => {
    if (isCreating) {
      console.log('⏳ [ONBOARDING] Creation already in progress');
      return;
    }
    
    console.log('🆕 [ONBOARDING] Starting new merchant creation');
    setIsCreating(true);
    try {
      const response = await initializeMerchantSetup();
      if (response.success && response.data) {
        console.log('✅ [ONBOARDING] Successfully created new merchant', {
          merchantId: response.data.id,
          timestamp: new Date().toISOString()
        });
        // Store the school ID and navigate to overview page
        sessionStorage.setItem('currentSchoolId', response.data.id);
        router.push(`/onboarding/overview`);
      } else {
        console.error('❌ [ONBOARDING] Failed to create merchant:', {
          error: response.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ [ONBOARDING] Error creating merchant:', {
        error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromTemplate = () => {
    console.log('📋 [ONBOARDING] Creating merchant from template');
    router.push('/onboarding/overview?template=true');
  };

  if (isLoading) {
    console.log('⏳ [ONBOARDING] Loading merchant data...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
          {/* Welcome Header skeleton */}
          <div>
            <Skeleton className="h-8 w-64 mb-3 sm:mb-4" />
          </div>
          
          {/* Schools skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
          
          {/* New school options skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎯 [ONBOARDING] Rendering merchant dashboard', {
    merchantCount: schools.length,
    totalMerchants: totalSchools,
    timestamp: new Date().toISOString()
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center">
        <SchoolOnboardingDashboard 
          userName={user?.name || "Admin"}
          schools={schools.map(merchant => ({
            id: merchant.id!,
            name: merchant.name || 'Unnamed Merchant',
            startDate: merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : 'Unknown',
            status: merchant.isActive ? 'active' : 'draft' as const,
            subdomain: merchant.subdomain,
          }))}
          totalSchools={totalSchools}
          onSchoolClick={handleSchoolClick}
          onCreateNew={handleCreateNew}
          onCreateFromTemplate={handleCreateFromTemplate}
          dictionary={dictionary}
          locale={locale}
        />
      </div>
    </ErrorBoundary>
  );
}


