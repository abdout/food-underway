"use client";

import React from 'react';
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
  return (
    <Modal
      showModal={isOpen}
      setShowModal={onClose}
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
          <h1 className="text-4xl font-bold text-primary">
            تهانينا! 🎉
          </h1>
          
          <h2 className="text-2xl font-semibold">
            تم إنشاء مطعمك بنجاح
          </h2>
          
          <p className="text-lg text-muted-foreground">
            مطعمك الآن جاهز للاستخدام! يمكنك البدء في إدارة قائمة الطعام والطلبات.
          </p>

          {/* Subdomain Display */}
          <div className="bg-white/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6">
            <p className="text-sm text-muted-foreground mb-2">رابط مطعمك:</p>
            <div className="flex items-center justify-center gap-2 text-lg font-mono">
              <span className="text-muted-foreground">https://</span>
              <span className="text-primary font-bold">{subdomain}</span>
              <span className="text-muted-foreground">.databayt.org</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onComplete}
              size="lg"
              className="rounded-2xl px-8 py-3 text-lg font-semibold"
            >
              <ExternalLink className="w-5 h-5 ml-2" />
              الانتقال إلى لوحة التحكم
            </Button>
            
            <Button
              onClick={onClose}
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
