"use client";

import React, { useState, useEffect } from 'react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import LogoUploader from './logo-uploader';
import { Card } from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function BrandingContent() {
  const { enableNext, disableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Load existing logo from listing
  useEffect(() => {
    if (listing?.logo) {
      setLogoUrl(listing.logo);
      enableNext(); // Enable next if logo already exists
    } else {
      // Allow skipping this step - branding is optional
      enableNext();
    }
  }, [listing, enableNext]);

  const handleLogoUpload = async (file: File) => {
    if (!listing?.id) {
      toast.error('معرف المطعم غير موجود');
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('merchantId', listing.id);

      // Upload to your image storage service
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('فشل رفع الشعار');
      }

      const data = await response.json();

      if (data.success && data.logoUrl) {
        setLogoUrl(data.logoUrl);

        // Update listing with logo URL
        await updateListingData({
          logo: data.logoUrl
        });

        enableNext();
        toast.success('تم رفع الشعار بنجاح');
      } else {
        throw new Error(data.error || 'فشل رفع الشعار');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!listing?.id) return;

    try {
      setLogoUrl('');
      await updateListingData({
        logo: undefined
      });
      toast.success('تم إزالة الشعار');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('حدث خطأ أثناء إزالة الشعار');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center">
        <h2>شعار المطعم بالوضع الليلي</h2>
        <p className="text-muted-foreground mt-2">
          قم برفع شعار مطعمك بالوضع النهاري والليلي
        </p>
      </div>

      {/* Preview Cards - Light and Dark Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Light Mode Preview */}
        <Card className="p-8 bg-white border-2">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sun className="w-4 h-4" />
              <span>الوضع النهاري</span>
            </div>
            <div className="w-32 h-32 flex items-center justify-center rounded-lg bg-gray-50 border-2 border-dashed border-gray-300">
              {logoUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={logoUrl}
                    alt="Restaurant Logo Light"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-400">شعار المطعم</span>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              شعار المطعم بالوضع النهاري
            </p>
          </div>
        </Card>

        {/* Dark Mode Preview */}
        <Card className="p-8 bg-gray-900 border-2 border-gray-700">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Moon className="w-4 h-4" />
              <span>الوضع الليلي</span>
            </div>
            <div className="w-32 h-32 flex items-center justify-center rounded-lg bg-gray-800 border-2 border-dashed border-gray-600">
              {logoUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={logoUrl}
                    alt="Restaurant Logo Dark"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-500">شعار المطعم</span>
              )}
            </div>
            <p className="text-xs text-center text-gray-400">
              شعار المطعم بالوضع الليلي
            </p>
          </div>
        </Card>
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto">
        <LogoUploader
          onUpload={handleLogoUpload}
          onRemove={handleRemoveLogo}
          currentLogoUrl={logoUrl}
          isUploading={isUploading}
        />
      </div>

      {/* Optional Note */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          يمكنك تخطي هذه الخطوة وإضافة الشعار لاحقاً من إعدادات المطعم
        </p>
      </div>
    </div>
  );
}
