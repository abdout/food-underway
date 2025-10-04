"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/internationalization/use-locale';
import { type Locale } from '@/components/internationalization/config';
import { type Dictionary } from '@/components/internationalization/dictionaries';
import { UtensilsCrossed, ListPlus, Rocket, LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface StepsOverviewClientProps {
  dictionary: Dictionary['school']['onboarding']['overview'];
  lang: Locale;
}

const StepsOverviewClient: React.FC<StepsOverviewClientProps> = ({ dictionary, lang }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = React.useState(false);
  const { isRTL } = useLocale();

  const steps: Step[] = [
    {
      number: 1,
      title: dictionary.steps.step1.title,
      description: dictionary.steps.step1.description,
      icon: UtensilsCrossed
    },
    {
      number: 2,
      title: dictionary.steps.step2.title,
      description: dictionary.steps.step2.description,
      icon: ListPlus
    },
    {
      number: 3,
      title: dictionary.steps.step3.title,
      description: dictionary.steps.step3.description,
      icon: Rocket
    }
  ];

  const handleGetStarted = async () => {
    const startTimestamp = new Date().toISOString();
    console.log('🚀 [DEBUG] handleGetStarted called', {
      startTimestamp,
      currentIsCreating: isCreating,
      location: 'overview-page'
    });

    if (isCreating) {
      console.log('⚠️ [DEBUG] Already creating, ignoring click', {
        isCreating,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('🔄 [DEBUG] Setting isCreating to true', {
      previousState: isCreating,
      timestamp: new Date().toISOString()
    });
    setIsCreating(true);

    // Check if we have a real school ID from query params or sessionStorage
    const schoolIdFromParams = searchParams.get('schoolId');
    const schoolIdFromSession = sessionStorage.getItem('currentSchoolId');
    const schoolId = schoolIdFromParams || schoolIdFromSession;
    console.log('🔍 [DEBUG] School ID sources:', {
      fromParams: schoolIdFromParams,
      fromSession: schoolIdFromSession,
      final: schoolId
    });

    if (schoolId) {
      console.log('✅ [DEBUG] Using existing schoolId, redirecting...');
      // Use the real school ID that was just created
      router.push(`/${lang}/onboarding/${schoolId}/information`);
    } else {
      console.log('🏗️ [DEBUG] No schoolId, creating new school...');
      // Create a new school record first
      try {
        console.log('📦 [DEBUG] Importing initializeSchoolSetup...');
        const { initializeSchoolSetup } = await import('@/components/onboarding/actions');

        console.log('🏗️ [DEBUG] Calling initializeSchoolSetup...');
        const result = await initializeSchoolSetup();

        console.log('📋 [DEBUG] initializeSchoolSetup result:', {
          success: result.success,
          hasData: !!result.data,
          schoolId: result.data?.id,
          schoolName: result.data?.name,
          error: result.error,
          resultTimestamp: new Date().toISOString()
        });

        if (result.success && result.data) {
          console.log('✅ [DEBUG] School created successfully, preparing redirect:', {
            schoolId: result.data.id,
            schoolName: result.data.name,
            redirectTarget: `/${lang}/onboarding/${result.data.id}/information`,
            waitingBeforeRedirect: true,
            waitTime: '2000ms'
          });

          // Wait longer for the database update and session refresh to propagate
          await new Promise(resolve => setTimeout(resolve, 2000));

          console.log('🔄 [DEBUG] Executing redirect to information page:', {
            targetUrl: `/${lang}/onboarding/${result.data.id}/information`,
            redirectMethod: 'window.location.href',
            redirectTimestamp: new Date().toISOString()
          });

          // Force a full page refresh to ensure session is updated
          window.location.href = `/${lang}/onboarding/${result.data.id}/information`;
        } else {
          console.error('❌ [DEBUG] Failed to create school:', {
            error: result.error,
            success: result.success,
            hasData: !!result.data,
            errorTimestamp: new Date().toISOString()
          });

          // Fallback to temporary ID if school creation fails
          const tempId = `draft-${Date.now()}`;
          console.log('🔄 [DEBUG] Using fallback draft redirect:', {
            tempId,
            redirectTarget: `/${lang}/onboarding/${tempId}/information`,
            fallbackTimestamp: new Date().toISOString()
          });
          router.push(`/${lang}/onboarding/${tempId}/information`);
        }
      } catch (error) {
        console.error('❌ [DEBUG] Exception in handleGetStarted:', error);
        // Fallback to temporary ID if there's an error
        const tempId = `draft-${Date.now()}`;
        console.log('🔄 [DEBUG] Exception fallback redirect to draft:', tempId);
        router.push(`/${lang}/onboarding/${tempId}/information`);
      } finally {
        console.log('🏁 [DEBUG] Setting isCreating to false');
        setIsCreating(false);
      }
    }
  };

  return (
    <div className={`h-full flex flex-col px-40 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex-1">
        <div className="h-full max-w-7xl mx-auto flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-start py-12">
            {/* Left Side - Title */}
            <div>
              <h2 className={`text-4xl font-bold ${isRTL ? 'text-right' : 'text-left'} whitespace-pre-line`}>
                {dictionary.title}
              </h2>
            </div>

            {/* Right Side - Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className={`flex gap-6 items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">
                        {step.number}
                      </h4>
                    </div>
                    <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1`}>
                      <h4 className="mb-1">
                        {step.title}
                      </h4>
                      <p className={isRTL ? 'text-right' : 'text-left'}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section with HR and Button */}
          <div className="">
            <Separator className="w-full" />
            <div className={`flex py-4 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <Button onClick={handleGetStarted} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Skeleton className="w-4 h-4 mr-2" />
                    {dictionary.creatingSchool}
                  </>
                ) : (
                  dictionary.getStarted
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsOverviewClient;