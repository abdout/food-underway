"use client";

import React, { useState, useEffect } from 'react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MapPin, Phone, User, Utensils } from 'lucide-react';
import { toast } from 'sonner';

export default function TitleContent() {
  const { enableNext, disableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [merchantNameAr, setMerchantNameAr] = useState<string>('');
  const [merchantNameEn, setMerchantNameEn] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [restaurantType, setRestaurantType] = useState('restaurant');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Load existing data from listing
  useEffect(() => {
    if (listing) {
      setMerchantNameAr(listing.name || '');
      setMerchantNameEn(listing.name || '');
      setLocation(listing.location || '');
      setOwnerName(listing.ownerName || '');
      setPhone(listing.phone || '');
      setRestaurantType(listing.type || 'restaurant');
      validateForm();
    }
  }, [listing]);

  // Save data when form is valid and user navigates
  // Removed automatic save on isValid change to prevent multiple saves
  // The save functionality should be triggered by explicit user action
  // or when the component unmounts (cleanup function)

  // Bypass validation and enable next button
  useEffect(() => {
    setIsValid(true);
    enableNext();
  }, []);

  const validateForm = () => {
    // Always return true to bypass validation
    const isValidForm = true;
    setIsValid(isValidForm);
    
    if (isValidForm) {
      enableNext();
    } else {
      disableNext();
    }
  };

  const handleSave = async () => {
    if (isValid && listing?.id) {
      try {
        await updateListingData({
          name: merchantNameAr.trim(),
          nameAr: merchantNameEn.trim(),
          location: location.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          type: restaurantType
        });
        toast.success('تم حفظ البيانات بنجاح');
      } catch (error) {
        console.error('Error saving data:', error);
        toast.error('حدث خطأ أثناء حفظ البيانات');
      }
    }
  };

  return (
    <div className="">
      <div className="flex justify-start mb-8">
        <ToggleGroup 
          type="single" 
          value={restaurantType} 
          onValueChange={(value) => setRestaurantType(value)} 
          className=" bg-muted rounded-full"
        >
          <ToggleGroupItem value="cafe" className=" rounded-full data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:rounded-full px-4 onhover:rounded-full">
            مقهى
          </ToggleGroupItem>
          <ToggleGroupItem value="restaurant" className="rounded-full data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:rounded-full px-4 onhover:rounded-full">
            مطعم
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right Column */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="merchantNameAr"
              value={merchantNameAr}
              onChange={(e) => setMerchantNameAr(e.target.value)}
              placeholder="اسم المطعم بالعربية"
              className="pr-10 text-right h-12"
            />
            <Utensils className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="موقع المطعم"
              className="pr-10 text-right h-12"
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="اسم المالك"
              className="pr-10 text-right h-12"
            />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Left Column */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="merchantNameEn"
              value={merchantNameEn}
              onChange={(e) => setMerchantNameEn(e.target.value)}
              placeholder="اسم المطعم بالانجليزية"
              className="pr-10 text-right h-12"
            />
            <Utensils className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              id="siteCoordinates"
              placeholder="احداثيات الموقع"
              className="pr-10 text-right h-12"
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="رقم جوال المالك"
              className="pr-10 text-right h-12"
              dir="ltr"
              maxLength={9}
            />
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+966</span>
          </div>
        </div>
      </div>
    </div>
  );
}
