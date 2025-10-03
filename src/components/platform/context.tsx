"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { School } from "@/components/site/types";

interface SchoolContextValue {
  school: School;
}

const Context = createContext<SchoolContextValue | undefined>(undefined);

interface SchoolProviderProps {
  children: ReactNode;
  school: School;
}

export function SchoolProvider({ children, school }: SchoolProviderProps) {
  const value: SchoolContextValue = {
    school,
  };

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

export function useSchool() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}
