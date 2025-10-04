"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { Merchant } from "@/components/site/types";

interface MerchantContextValue {
  merchant: Merchant;
}

const Context = createContext<MerchantContextValue | undefined>(undefined);

interface MerchantProviderProps {
  children: ReactNode;
  merchant: Merchant;
}

export function MerchantProvider({ children, merchant }: MerchantProviderProps) {
  const value: MerchantContextValue = {
    merchant,
  };

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

export function useMerchant() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useMerchant must be used within a MerchantProvider");
  }
  return context;
}
