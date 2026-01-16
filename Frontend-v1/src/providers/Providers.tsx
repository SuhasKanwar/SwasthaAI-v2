"use client";

import React, { createContext } from "react";
import { AuthProvider } from "./AuthProvider";
import { Toaster } from "@/components/ui/sonner";

const ProvidersContext = createContext<React.ReactNode>(null);

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ProvidersContext.Provider value={children}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          visibleToasts={4}
        />
      </AuthProvider>
    </ProvidersContext.Provider>
  );
};

export const useProviders = () => React.useContext(ProvidersContext);