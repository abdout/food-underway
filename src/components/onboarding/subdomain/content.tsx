"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import CongratsModal from './congrats-modal';

export default function SubdomainContent() {
  const router = useRouter();
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation();
  const { listing, updateListingData } = useListing();
  
  // Force enable the button immediately
  React.useEffect(() => {
    enableNext();
  });

  // Debug listing state
  React.useEffect(() => {
    console.log("📋 [SUBDOMAIN] Listing state:", {
      listing,
      listingId: listing?.id,
      hasListing: !!listing,
      listingKeys: listing ? Object.keys(listing) : []
    });
  }, [listing]);
  const [subdomain, setSubdomain] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [showCongratsModal, setShowCongratsModal] = useState<boolean>(false);
  const handleCompleteSetupRef = useRef<(() => Promise<void>) | null>(null);


  // Load existing subdomain from listing
  useEffect(() => {
    if (listing?.subdomain) {
      setSubdomain(listing.subdomain);
      validateSubdomain(listing.subdomain);
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

  // Handle navigation to dashboard after successful onboarding
  const handleNavigateToDashboard = useCallback(() => {
    if (subdomain) {
      // Close the modal first
      setShowCongratsModal(false);
      
      // Then navigate to the dashboard with the new subdomain
      // Using window.location to ensure full page reload with new subdomain
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const domain = process.env.NODE_ENV === 'production' 
        ? `${subdomain}.databayt.org` 
        : `${subdomain}.localhost:3000`;
      
      window.location.href = `${protocol}://${domain}/dashboard`;
    }
  }, [subdomain]);

  // Define handleCompleteSetup function
  const handleCompleteSetup = useCallback(async () => {
    console.log("🚀 [HANDLE COMPLETE SETUP] Starting...", {
      isCompleting,
      subdomain,
      listingId: listing?.id,
      hasUpdateListingData: !!updateListingData
    });

    if (isCompleting) {
      console.log("⏸️ [HANDLE COMPLETE SETUP] Already completing, skipping");
      return;
    }

    setIsCompleting(true);
    console.log("🔄 [HANDLE COMPLETE SETUP] Set isCompleting to true");

    try {
      // Use a default subdomain if none is provided
      const normalizedSubdomain = subdomain.trim() ? normalizeSubdomain(subdomain) : `restaurant-${Date.now()}`;
      console.log("🔧 [HANDLE COMPLETE SETUP] Normalized subdomain:", normalizedSubdomain);

      if (listing?.id) {
        console.log("📝 [HANDLE COMPLETE SETUP] Updating listing data...");
        // Update local state with the subdomain
        await updateListingData({
          subdomain: normalizedSubdomain
        });

        console.log("🎯 [HANDLE COMPLETE SETUP] Completing onboarding...");
        // Complete the onboarding process
        const completeResult = await completeOnboarding(listing.id, normalizedSubdomain);
        console.log("✅ [HANDLE COMPLETE SETUP] Complete result:", completeResult);

        if (completeResult.success) {
          console.log("🎉 [HANDLE COMPLETE SETUP] Success! Showing congrats modal");
          // Show congratulations modal
          setShowCongratsModal(true);
          // Set the subdomain in local storage for the redirect
          localStorage.setItem('newSubdomain', normalizedSubdomain);
          // Wait at least 2 seconds before redirecting
          setTimeout(() => {
            setShowCongratsModal(false);
            handleNavigateToDashboard();
          }, 2000);
          console.log("🎉 [HANDLE COMPLETE SETUP] Modal state set to true");
        } else {
          console.log("❌ [HANDLE COMPLETE SETUP] Failed:", completeResult.error);
          toast.error(completeResult.error || 'فشل إكمال الإعداد');
          setIsCompleting(false);
        }
      } else {
        console.log("⚠️ [HANDLE COMPLETE SETUP] No listing ID available, trying to get current merchant...");
        
        // Try to get current merchant as fallback
        try {
          const { getCurrentUserMerchant } = await import('@/components/onboarding/actions');
          const merchantResult = await getCurrentUserMerchant();
          
          if (merchantResult.success && merchantResult.data?.merchantId) {
            console.log("✅ [HANDLE COMPLETE SETUP] Found merchant ID:", merchantResult.data.merchantId);
            
            // Complete onboarding with the found merchant ID
            const completeResult = await completeOnboarding(merchantResult.data.merchantId, normalizedSubdomain);
            console.log("✅ [HANDLE COMPLETE SETUP] Complete result:", completeResult);

            if (completeResult.success) {
              console.log("🎉 [HANDLE COMPLETE SETUP] Success! Showing congrats modal");
              setShowCongratsModal(true);
              setTimeout(() => {
                setShowCongratsModal(false);
                handleNavigateToDashboard();
              }, 2000);
            } else {
              console.log("❌ [HANDLE COMPLETE SETUP] Failed:", completeResult.error);
              toast.error(completeResult.error || 'فشل إكمال الإعداد');
              setIsCompleting(false);
            }
          } else {
            console.log("❌ [HANDLE COMPLETE SETUP] No merchant found");
            toast.error('معرف المطعم غير موجود');
            setIsCompleting(false);
          }
        } catch (error) {
          console.error("💥 [HANDLE COMPLETE SETUP] Error getting merchant:", error);
          toast.error('حدث خطأ أثناء الحصول على معرف المطعم');
          setIsCompleting(false);
        }
      }
    } catch (error) {
      console.error('💥 [HANDLE COMPLETE SETUP] Error:', error);
      toast.error('حدث خطأ أثناء إكمال الإعداد');
      setIsCompleting(false);
    }
  }, [isCompleting, subdomain, listing?.id, updateListingData, handleNavigateToDashboard]);

  // Update ref when function changes
  useEffect(() => {
    handleCompleteSetupRef.current = handleCompleteSetup;
    console.log("🔄 [SUBDOMAIN] handleCompleteSetup function updated");
  }, [handleCompleteSetup]);

  // Enable/disable next button and set custom navigation
  useEffect(() => {
    // Always enable next button - subdomain is optional for completion
    console.log("🔧 [SUBDOMAIN] Enabling next button and setting custom navigation");
    enableNext();
    const customNav = {
      onNext: handleCompleteSetup,
      nextDisabled: false // Always allow proceeding
    };
    console.log("🔧 [SUBDOMAIN] Setting custom navigation:", customNav);
    setCustomNavigation(customNav);
    console.log("🔧 [SUBDOMAIN] Button state updated:", {
      isCompleting,
      subdomain,
      hasSubdomain: subdomain.trim().length > 0
    });
  }, [enableNext, setCustomNavigation, handleCompleteSetup]);

  // Debug custom navigation changes
  useEffect(() => {
    console.log("🔧 [SUBDOMAIN] Custom navigation dependency changed:", {
      enableNext: !!enableNext,
      setCustomNavigation: !!setCustomNavigation,
      handleCompleteSetup: !!handleCompleteSetup
    });
  }, [enableNext, setCustomNavigation, handleCompleteSetup]);

  // Ensure button is always enabled on mount and when subdomain changes
  useEffect(() => {
    console.log("🔧 [SUBDOMAIN] Ensuring button is enabled on subdomain change");
    enableNext();
  }, [subdomain, enableNext]);

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
      <div className="max-w-2xl mx-auto">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">اختر رابط مطعمك</h2>
            <p className="text-muted-foreground">
              سيكون هذا هو عنوان الويب الفريد لمطعمك
            </p>
          </div>

          {/* Domain Input Section */}
          <div className="space-y-6">
            {/* URL Preview */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-lg font-mono" dir="ltr">
                <Globe className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="text-muted-foreground">https://</span>
                  <span className="text-primary font-bold truncate">
                    {subdomain || 'yourrestaurant'}
                  </span>
                  <span className="text-muted-foreground">.databayt.org</span>
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-4">
              <div className="relative">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  placeholder="yourrestaurant"
                  className="text-left pl-12 pr-4 h-14 text-lg rounded-2xl border-2 focus:border-primary transition-colors"
                  dir="ltr"
                  disabled={isCompleting}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    getValidationIcon()
                  )}
                </div>
              </div>

              {/* Validation message */}
              {subdomain.trim() && (
                <div className="text-center">
                  <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isValid ? '✓ الرابط متاح' : getValidationMessage()}
                  </p>
                </div>
              )}

              {/* Character count */}
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {subdomain.length}/63 حرف
                </div>
              </div>
            </div>

            {/* Regenerate button */}
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleRegenerate}
                className="rounded-2xl px-8"
                disabled={isCompleting}
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إنشاء تلقائي من اسم المطعم
              </Button>
            </div>

            {/* Test button */}
            <div className="text-center">
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={() => {
                  console.log("🧪 [TEST] Direct function call");
                  handleCompleteSetup();
                }}
                className="rounded-2xl px-8"
              >
                🧪 TEST CREATE
              </Button>
            </div>


            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-center block">اقتراحات</label>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors rounded-full px-4 py-2"
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

      {/* Congratulations Modal */}
      <CongratsModal
        subdomain={subdomain}
        isOpen={showCongratsModal}
        onClose={() => setShowCongratsModal(false)}
        onComplete={handleNavigateToDashboard}
      />
    </>
  );
}
