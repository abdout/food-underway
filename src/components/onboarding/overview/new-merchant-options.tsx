"use client";

import React from 'react';
import { Utensils, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface NewMerchantOptionsProps {
  onCreateNew?: () => void;
  onCreateFromTemplate?: () => void;
  dictionary?: any;
  isRTL?: boolean;
}

const NewMerchantOptions: React.FC<NewMerchantOptionsProps> = ({
  onCreateNew,
  onCreateFromTemplate,
  dictionary,
  isRTL = false
}) => {
  const dict = dictionary?.onboarding || {};
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const handleCreateNew = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreateNew?.();
  };

  const handleCreateFromTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreateFromTemplate?.();
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <h5>
        {dict.startNewMerchant || 'Start a new merchant'}
      </h5>
      
      <div className="space-y-2">
        {/* Create a new merchant */}
        <Link href="/onboarding/overview" onClick={handleCreateNew} className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="text-start min-w-0 flex-1">
              <h5>
                {dict.createNewMerchant || 'Create a new merchant'}
              </h5>
              <p className="muted mt-0.5">
                {dict.createNewMerchantDescription || 'Start from scratch with basic setup'}
              </p>
            </div>
          </div>
          <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary transition-colors flex-shrink-0" />
        </Link>

        {/* Create from template */}
        <Link href="/onboarding/overview" onClick={handleCreateFromTemplate} className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="text-start min-w-0 flex-1">
              <h5>
                {dict.createFromTemplate || 'Create from template'}
              </h5>
              <p className="muted mt-0.5">
                {dict.createFromTemplateDescription || 'Start with pre-configured settings'}
              </p>
            </div>
          </div>
          <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary transition-colors flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
};

export default NewMerchantOptions;
