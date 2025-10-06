"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Hero() {
  const params = useParams();
  const locale = params?.lang || 'ar';

  const handleGetStarted = () => {
    // Redirect to login with callbackUrl pointing to onboarding
    // This ensures OAuth flow knows to redirect to onboarding after login
    window.location.href = `/${locale}/login?callbackUrl=/${locale}/onboarding`;
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