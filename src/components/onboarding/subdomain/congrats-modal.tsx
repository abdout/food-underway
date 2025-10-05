"use client";

import React, { useEffect } from 'react';
import { Modal } from '@/components/atom/modal';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CongratsModalProps {
  subdomain: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CongratsModal({ 
  subdomain, 
  isOpen, 
  onClose, 
  onComplete 
}: CongratsModalProps) {
  console.log('🎉 [CONGRATS MODAL] Initializing with props:', {
    subdomain,
    isOpen,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (isOpen) {
      console.log('🌟 [CONGRATS MODAL] Modal opened, subdomain:', subdomain);
    }
  }, [isOpen, subdomain]);

  const handleClose = () => {
    console.log('🔒 [CONGRATS MODAL] Closing modal');
    onClose();
  };

  const handleComplete = () => {
    console.log('🎯 [CONGRATS MODAL] Completing onboarding, navigating to dashboard');
    onComplete();
  };

  console.log('🎨 [CONGRATS MODAL] Rendering modal, state:', { isOpen });

  return (
    <Modal
      showModal={isOpen}
      setShowModal={handleClose}
      className="max-w-4xl w-full h-full max-h-screen"
      desktopOnly={false}
    >
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8">
        {/* Accessibility components - hidden but required */}
        <DialogTitle className="sr-only">Congratulations! Your restaurant has been created successfully.</DialogTitle>
        <DialogDescription className="sr-only">
          Your restaurant {subdomain} is now ready to use. You can start managing your menu and orders.
        </DialogDescription>
        
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Congratulations Image */}
        <div className="mb-8">
          <Image
            src="/Frame 1000009378.png"
            alt="Congratulations"
            width={400}
            height={300}
            className="rounded-2xl shadow-lg"
          />
        </div>

        {/* Content */}
        <div className="text-center space-y-6 max-w-2xl">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            مبروك! 🎉
          </h2>
          
          <p className="text-xl text-muted-foreground">
            تم إنشاء مطعمك بنجاح وهو جاهز للاستخدام
          </p>

          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              رابط مطعمك الجديد:
            </p>
            <p className="text-lg font-mono mt-2">
              https://{subdomain}.{window.location.host}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              onClick={handleComplete}
              size="lg"
              className="rounded-2xl px-8 py-3 text-lg font-semibold"
            >
              <ExternalLink className="w-5 h-5 ml-2" />
              الانتقال إلى لوحة التحكم
            </Button>
            
            <Button
              onClick={handleClose}
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 py-3 text-lg"
            >
              إغلاق
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            يمكنك العودة إلى هذه الصفحة في أي وقت لتعديل إعدادات مطعمك
          </p>
        </div>
      </div>
    </Modal>
  );
}
