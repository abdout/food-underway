"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2, Mail } from 'lucide-react';

interface CongratsDialogProps {
  subdomain: string;
  onComplete: () => void;
}

export default function CongratsDialog({ subdomain, onComplete }: CongratsDialogProps) {
  const [countdown, setCountdown] = useState(3);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsOpen(false);
          // Trigger redirect after dialog closes
          setTimeout(onComplete, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          {/* Success Icon - Envelope with Checkmark */}
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center">
              <Mail className="w-16 h-16 text-green-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center border-4 border-white">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-green-600">
              تم إضافة القائمة بنجاح
            </h3>
            <p className="text-muted-foreground text-base">
              سيتم تحويلك لصفحة القوائم تلقائياً
            </p>
          </div>

          {/* Subdomain Display */}
          <div className="w-full p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">رابط مطعمك</p>
              <p className="font-mono text-sm text-primary font-medium" dir="ltr">
                {subdomain}.databayt.org
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{countdown}</span>
            </div>
            <span>ثواني...</span>
          </div>

          {/* Loading Indicator */}
          <div className="w-full">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-linear"
                style={{
                  width: `${((3 - countdown) / 3) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
