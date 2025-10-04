"use client";

import React, { useState, useEffect } from 'react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building } from 'lucide-react';
import { toast } from 'sonner';

export default function TitleContent() {
  const { enableNext, disableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [merchantName, setMerchantName] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Load existing name from listing
  useEffect(() => {
    if (listing?.name) {
      setMerchantName(listing.name);
      setIsValid(listing.name.trim().length >= 2);
    }
  }, [listing]);

  // Enable/disable next button based on validation
  useEffect(() => {
    if (isValid && merchantName.trim().length >= 2) {
      enableNext();
    } else {
      disableNext();
    }
  }, [isValid, merchantName, enableNext, disableNext]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setMerchantName(newValue);
    setIsValid(newValue.trim().length >= 2 && newValue.trim().length <= 40);
  };

  const handleSave = async () => {
    if (isValid && merchantName.trim().length >= 2 && listing?.id) {
      try {
        await updateListingData({
          name: merchantName.trim()
        });
        toast.success('Merchant name saved successfully!');
      } catch (error) {
        console.error('Error saving merchant name:', error);
        toast.error('Failed to save merchant name');
      }
    }
  };

  const getValidationMessage = () => {
    if (!merchantName.trim()) return '';
    if (merchantName.trim().length < 2) return 'Name must be at least 2 characters';
    if (merchantName.trim().length > 40) return 'Name must be no more than 40 characters';
    return 'Name is valid!';
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              What's the name of your
              <br />
              merchant?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              This will be the main name displayed throughout your merchant platform. You can always change it later.
            </p>
            
            {/* Name preview */}
            {merchantName && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">
                    {merchantName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Input */}
          <div className="space-y-4">
            {/* Name input */}
            <div className="space-y-2">
              <label htmlFor="merchantName" className="text-sm font-medium">
                Merchant Name *
              </label>
              <Input
                id="merchantName"
                value={merchantName}
                onChange={handleNameChange}
                placeholder="Enter your merchant name"
                className="text-lg"
              />
              
              {/* Validation message */}
              {merchantName.trim() && (
                <p className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {getValidationMessage()}
                </p>
              )}
              
              {/* Character count */}
              <div className="text-xs text-muted-foreground">
                {merchantName.length}/40 characters
              </div>
            </div>

            {/* Save button */}
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className="w-full"
            >
              Save merchant name
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
