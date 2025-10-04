"use client";

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoUploaderProps {
  onUpload: (file: File) => void;
  onRemove: () => void;
  currentLogoUrl?: string;
  isUploading?: boolean;
}

export default function LogoUploader({
  onUpload,
  onRemove,
  currentLogoUrl,
  isUploading = false
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

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

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onUpload(file);
  }, [onUpload]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!currentLogoUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-12 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            id="logo-upload"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isUploading ? 'جارٍ رفع الشعار...' : 'اسحب وأفلت الشعار هنا'}
              </p>
              <p className="text-sm text-muted-foreground">
                أو انقر للاختيار من جهازك
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>PNG, JPG (حد أقصى 5 ميجابايت)</span>
            </div>
          </div>
        </div>
      ) : (
        /* Logo Preview with Remove Button */
        <div className="relative border-2 rounded-lg p-8 text-center bg-gray-50">
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-4 right-4 rounded-full"
            onClick={onRemove}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex flex-col items-center gap-4">
            <div className="text-green-600 text-sm font-medium">
              ✓ تم رفع الشعار بنجاح
            </div>
            <p className="text-xs text-muted-foreground">
              يمكنك النقر على زر "إزالة" أعلاه لتغيير الشعار
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          الشعار سيظهر في جميع صفحات مطعمك والقوائم الرقمية
        </p>
      </div>
    </div>
  );
}
