"use client";

import React from 'react';
import SchoolCard from './school-card';
import NewMerchantOptions from './new-merchant-options';

interface Merchant {
  id: string;
  name: string;
  startDate: string;
  status: 'draft' | 'pending' | 'active';
  subdomain?: string;
}

interface SchoolOnboardingDashboardProps {
  userName?: string;
  schools?: Merchant[];
  onSchoolClick?: (id: string) => void;
  onCreateNew?: () => void;
  onCreateFromTemplate?: () => void;
  totalSchools?: number; // Total number of schools available
  dictionary?: any;
  locale?: string;
}

const SchoolOnboardingDashboard: React.FC<SchoolOnboardingDashboardProps> = ({
  userName = "Admin",
  schools = [],
  onSchoolClick,
  onCreateNew,
  onCreateFromTemplate,
  totalSchools,
  dictionary,
  locale
}) => {
  const dict = dictionary?.onboarding || {};
  const isRTL = locale === 'ar';
  const draftSchools = schools.filter(merchant => merchant.status === 'draft');
  const hasInProgressSchools = draftSchools.length > 0;
  const hasMoreSchools = totalSchools && totalSchools > schools.length;

  return (
    <div className={`w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4 ${isRTL ? 'rtl' : ''}`}>
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
          {isRTL ? dict.welcomeBack : `${dict.welcomeBack || 'Welcome back'}, ${userName}`}
        </h3>
      </div>

      {/* Finish school setup section */}
      {hasInProgressSchools && (
        <div className="space-y-2 sm:space-y-3">
          <h5 className="text-base sm:text-lg font-semibold">
            {dict.completeSetup || 'Complete your school setup'}
          </h5>
          
          <div className="space-y-2">
            {draftSchools.map((merchant) => (
              <SchoolCard
                key={merchant.id}
                id={merchant.id}
                name={merchant.name}
                startDate={merchant.startDate}
                status={merchant.status}
                subdomain={merchant.subdomain}
                onClick={onSchoolClick}
                dictionary={dictionary}
              />
            ))}
            {hasMoreSchools && (
              <div className="text-center py-2">
                <p className="muted">
                  +{totalSchools! - schools.length} {totalSchools! - schools.length > 1 ? (dict.moreMerchantsPlural || 'more merchants') : (dict.moreMerchants || 'more merchant')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start a new merchant section */}
      <NewMerchantOptions
        onCreateNew={onCreateNew}
        onCreateFromTemplate={onCreateFromTemplate}
        dictionary={dictionary}
        isRTL={isRTL}
      />
    </div>
  );
};

export default SchoolOnboardingDashboard; 