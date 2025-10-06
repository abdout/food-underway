"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function Hero() {
  // Log when Hero component mounts
  useEffect(() => {
    console.log('=====================================');
    console.log('🏠 [HERO] Component Mounted');
    console.log('=====================================');
    console.log('📍 Current Location:', {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString()
    });
    console.log('=====================================\n');
  }, []);

  const handleGetStarted = () => {
    console.log('\n\n=====================================');
    console.log('🚀 [HERO] GET STARTED BUTTON CLICKED!');
    console.log('=====================================');

    // Detect locale from current pathname
    const locale = typeof window !== 'undefined'
      ? (window.location.pathname.match(/^\/(ar|en)(\/|$)/)?.[1] || 'ar')
      : 'ar';

    const targetUrl = `/${locale}/login?callbackUrl=/${locale}/onboarding`;

    console.log('📍 [HERO] Current State:', {
      currentPathname: window.location.pathname,
      currentHref: window.location.href,
      currentSearch: window.location.search,
      pathnameMatch: window.location.pathname.match(/^\/(ar|en)(\/|$)/),
      detectedLocale: locale,
      timestamp: new Date().toISOString()
    });

    console.log('🎯 [HERO] Redirect Details:', {
      targetUrl,
      callbackUrl: `/${locale}/onboarding`,
      urlEncoded: encodeURIComponent(`/${locale}/onboarding`),
      fullTargetUrl: `${window.location.origin}${targetUrl}`
    });

    console.log('⏳ [HERO] Redirecting in 100ms...');
    console.log('=====================================\n');

    // Redirect to login with callbackUrl pointing to onboarding
    setTimeout(() => {
      console.log('🔄 [HERO] Executing redirect NOW to:', targetUrl);
      window.location.href = targetUrl;
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h3>Merchant marketing page</h3>
      <Button
        onClick={handleGetStarted}
        size="lg"
        onMouseEnter={() => console.log('🖱️ [HERO] Get Started button hovered')}
      >
        Get Started
      </Button>
    </div>
  );
}