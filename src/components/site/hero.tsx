"use client";

import { Button } from "@/components/ui/button";

export function Hero() {
  const handleGetStarted = () => {
    // Detect locale from current pathname
    const locale = typeof window !== 'undefined'
      ? (window.location.pathname.match(/^\/(ar|en)(\/|$)/)?.[1] || 'ar')
      : 'ar';

    const targetUrl = `/${locale}/login?callbackUrl=/${locale}/onboarding`;

    console.log('🎯 [HERO] Get Started clicked:', {
      currentPathname: window.location.pathname,
      detectedLocale: locale,
      targetUrl,
      callbackUrl: `/${locale}/onboarding`
    });

    // Redirect to login with callbackUrl pointing to onboarding
    // This ensures OAuth flow knows to redirect to onboarding after login
    window.location.href = targetUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h3>Merchant marketing page</h3>
      <Button onClick={handleGetStarted} size="lg">
        Get Started
      </Button>
    </div>
  );
}