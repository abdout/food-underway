"use client";

import React, { useState, useEffect } from 'react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

export default function LogoContent() {
  const { enableNext, disableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  // Load existing logo from listing
  useEffect(() => {
    if (listing?.logo) {
      setLogoUrl(listing.logo);
    }
    // Always enable next - logo is optional
    enableNext();
  }, [listing, enableNext]);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return 'الرجاء رفع ملف PNG أو JPG فقط';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'حجم الملف يجب أن يكون أقل من 5 ميجابايت';
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!listing?.id) {
      toast.error('معرف المطعم غير موجود');
      return;
    }

    setError('');
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
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

  // Handle file selection
  const handleFileSelect = (file: File) => {
    handleFileUpload(file);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle remove logo
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
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">شعار المطعم</h2>
        <p className="text-muted-foreground">
          ارفع شعار مطعمك لتمييزه عن الآخرين
        </p>
      </div>

      {/* Upload Area */}
      <div className="flex justify-center">
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {/* Logo Upload Circle */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative w-32 h-32 rounded-full border-2 border-dashed transition-colors cursor-pointer group",
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              isUploading && "opacity-50 pointer-events-none"
            )}
          >
            <input
              type="file"
              id="logo-upload"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
              disabled={isUploading}
            />

            {logoUrl ? (
              <div className="w-full h-full rounded-full overflow-hidden relative group">
                <Image
                  src={logoUrl}
                  alt="Merchant Logo"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full h-full rounded-full flex flex-col items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cover Image Upload Circle */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative w-32 h-32 rounded-full border-2 border-dashed transition-colors cursor-pointer group",
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              isUploading && "opacity-50 pointer-events-none"
            )}
          >
            <input
              type="file"
              id="cover-upload"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
              disabled={isUploading}
            />

            <div className="w-full h-full rounded-full flex flex-col items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* File Info */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span>PNG, JPG (حد أقصى 5 ميجابايت)</span>
        </div>
      </div>
    </div>
  );
}
