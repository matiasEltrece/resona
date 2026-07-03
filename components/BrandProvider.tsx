"use client";

import { createContext, useContext } from "react";

interface BrandContextValue {
  logoCompactUrl: string;
  logoStudioUrl: string;
}

const DEFAULTS: BrandContextValue = {
  logoCompactUrl: "/kyma-logo.png",
  logoStudioUrl: "/kyma-studio-logo.png",
};

const BrandContext = createContext<BrandContextValue>(DEFAULTS);

/** Expone las URLs de logo vigentes (admin-editables o el fallback estático de /public). */
export function BrandProvider({
  logoCompactUrl,
  logoStudioUrl,
  children,
}: {
  logoCompactUrl: string | null;
  logoStudioUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <BrandContext.Provider
      value={{
        logoCompactUrl: logoCompactUrl || DEFAULTS.logoCompactUrl,
        logoStudioUrl: logoStudioUrl || DEFAULTS.logoStudioUrl,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
