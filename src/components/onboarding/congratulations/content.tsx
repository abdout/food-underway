"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import HostStepHeader from '@/components/onboarding/step-header';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface CongratulationsContentProps {
  dictionary?: any;
}

export default function CongratulationsContent({ dictionary }: CongratulationsContentProps) {
  const dict = dictionary?.onboarding || {};
  const router = useRouter();
  const { enableNext } = useHostValidation();

  // Enable next button for this step
  useEffect(() => {
    enableNext();
  }, [enableNext]);

  const illustration = (
    <div className="w-full sm:w-3/4 max-w-xl mx-auto bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[300px] sm:aspect-video">
      <CheckCircle2 className="w-32 h-32 text-green-600" />
    </div>
  );

  return (
    <div className="">
      <div className="w-full">
        <HostStepHeader
          stepNumber={3}
          title={dict.congratulations || "Congratulations! 🎉"}
          description={dict.congratulationsDescription || "Your merchant setup is complete. You're ready to start using the platform."}
          illustration={illustration}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
