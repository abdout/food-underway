"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { generateSubdomain, generateSubdomainSuggestions, isValidSubdomain, normalizeSubdomain } from '@/components/platform/dashboard/subdomain';
import { checkSubdomainAvailability } from '@/components/platform/dashboard/actions';
import { reserveSubdomainForMerchant, completeOnboarding } from '@/components/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, RefreshCw, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CongratsDialog from './congrats-dialog';

export default function SubdomainContent() {
  const router = useRouter();
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [subdomain, setSubdomain] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [showCongratsDialog, setShowCongratsDialog] = useState<boolean>(false);

  // Load existing subdomain from listing
  useEffect(() => {
    if (listing?.domain) {
      setSubdomain(listing.domain);
      validateSubdomain(listing.domain);
    }
  }, [listing]);

  // Generate suggestions when school name changes
  useEffect(() => {
    if (listing?.name) {
      const newSuggestions = generateSubdomainSuggestions(listing.name);
      setSuggestions(newSuggestions);
      
      // Auto-generate subdomain if none exists
      if (!subdomain) {
        const generated = generateSubdomain(listing.name);
        setSubdomain(generated);
        validateSubdomain(generated);
      }
    }
  }, [listing?.name, subdomain]);

  // Enable/disable next button and set custom navigation
  useEffect(() => {
    if (isValid && subdomain.trim().length > 0) {
      enableNext();
      // Set custom navigation to handle completion
      setCustomNavigation({
        onNext: handleCompleteSetup,
        nextDisabled: isCompleting
      });
    } else {
      disableNext();
    }
  }, [isValid, subdomain, isCompleting, enableNext, disableNext, setCustomNavigation]);

  const validateSubdomain = async (value: string) => {
    const normalized = normalizeSubdomain(value);
    const valid = isValidSubdomain(normalized);
    
    if (valid) {
      setIsChecking(true);
      try {
        const result = await checkSubdomainAvailability(normalized);
        setIsValid(result.available);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking subdomain availability:', error);
        setIsValid(false);
        setIsChecking(false);
      }
    } else {
      setIsValid(false);
    }
  };

  const handleSubdomainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSubdomain(newValue);
    validateSubdomain(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSubdomain(suggestion);
    validateSubdomain(suggestion);
    setShowSuggestions(false);
  };

  const handleRegenerate = () => {
    if (listing?.name) {
      const generated = generateSubdomain(listing.name);
      setSubdomain(generated);
      validateSubdomain(generated);
    }
  };

  const handleSave = async () => {
    if (isValid && subdomain.trim().length > 0 && listing?.id) {
      try {
        const result = await reserveSubdomainForMerchant(
          listing.id,
          normalizeSubdomain(subdomain)
        );

        if (result.success) {
          // Update local state
          await updateListingData({
            subdomain: normalizeSubdomain(subdomain)
          });
          toast.success('تم حجز الرابط بنجاح!');
        } else {
          toast.error(result.error || 'فشل حجز الرابط');
        }
      } catch (error) {
        console.error('Error reserving subdomain:', error);
        toast.error('فشل حجز الرابط');
      }
    }
  };

  const handleCompleteSetup = async () => {
    if (!isValid || !subdomain.trim() || !listing?.id || isCompleting) {
      return;
    }

    setIsCompleting(true);

    try {
      // First, reserve the subdomain
      const normalizedSubdomain = normalizeSubdomain(subdomain);
      const reserveResult = await reserveSubdomainForMerchant(listing.id, normalizedSubdomain);

      if (!reserveResult.success) {
        toast.error(reserveResult.error || 'فشل حجز الرابط');
        setIsCompleting(false);
        return;
      }

      // Update local state
      await updateListingData({
        subdomain: normalizedSubdomain
      });

      // Complete the onboarding process
      const completeResult = await completeOnboarding(listing.id, normalizedSubdomain);

      if (completeResult.success) {
        // Show congratulations dialog
        setShowCongratsDialog(true);
      } else {
        toast.error(completeResult.error || 'فشل إكمال الإعداد');
        setIsCompleting(false);
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('حدث خطأ أثناء إكمال الإعداد');
      setIsCompleting(false);
    }
  };

  const getValidationMessage = () => {
    if (!subdomain.trim()) return '';
    if (isValid) return 'Subdomain is available!';
    if (subdomain.length < 3) return 'Subdomain must be at least 3 characters';
    if (subdomain.length > 63) return 'Subdomain must be no more than 63 characters';
    if (!/^[a-z0-9-]+$/.test(subdomain)) return 'Only letters, numbers, and hyphens allowed';
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) return 'Cannot start or end with hyphen';
    return 'Invalid subdomain format';
  };

  const getValidationIcon = () => {
    if (!subdomain.trim()) return null;
    if (isValid) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <>
      <div className="">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
            {/* Left side - Text content */}
            <div className="space-y-3 sm:space-y-4">
              <h3>
                اختر رابط مطعمك
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-right">
                سيكون هذا هو عنوان الويب الفريد لمطعمك. سيتمكن عملاؤك من الوصول إلى مطعمك عبر{' '}
              </p>

              {/* Full URL preview */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-3 text-base font-mono" dir="ltr">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-muted-foreground">https://</span>
                    <span className="text-primary font-bold truncate">
                      {subdomain || 'yourrestaurant'}
                    </span>
                    <span className="text-muted-foreground">.databayt.org</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right side - Input and suggestions */}
            <div className="space-y-4">
              {/* Subdomain input */}
              <div className="space-y-2">
                <label htmlFor="subdomain" className="text-sm font-medium text-right block">
                  اسم الرابط
                </label>
                <div className="relative">
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={handleSubdomainChange}
                    placeholder="yourrestaurant"
                    className="text-left pl-10"
                    dir="ltr"
                    disabled={isCompleting}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {isChecking ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      getValidationIcon()
                    )}
                  </div>
                </div>

                {/* Validation message */}
                {subdomain.trim() && (
                  <p className={`text-xs text-right ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isValid ? '✓ الرابط متاح' : getValidationMessage()}
                  </p>
                )}

                {/* Character count */}
                <div className="text-xs text-muted-foreground text-right">
                  {subdomain.length}/63 حرف
                </div>
              </div>

              {/* Regenerate button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="w-full"
                disabled={isCompleting}
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إنشاء تلقائي من اسم المطعم
              </Button>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-right block">اقتراحات</label>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Congratulations Dialog */}
      {showCongratsDialog && (
        <CongratsDialog
          subdomain={subdomain}
          onComplete={() => {
            // Redirect to subdomain dashboard
            const subdomainUrl = process.env.NODE_ENV === 'production'
              ? `https://${subdomain}.databayt.org/dashboard`
              : `http://${subdomain}.localhost:3000/dashboard`;
            window.location.href = subdomainUrl;
          }}
        />
      )}
    </>
  );
}
