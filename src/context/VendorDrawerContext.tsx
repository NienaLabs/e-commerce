import React, { createContext, useContext, useMemo, useState } from 'react';

interface VendorDrawerContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Drawer state that belongs to the VENDOR dashboard only.
 *
 * The vendor dashboard deliberately does NOT use the global SidebarContext:
 * the customer `<Sidebar />` is mounted at the app root and listens to that
 * same state, so sharing it made one tap open two drawers at once.
 */
const VendorDrawerContext = createContext<VendorDrawerContextType | undefined>(undefined);

export const VendorDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen(prev => !prev),
    }),
    [isOpen],
  );
  return <VendorDrawerContext.Provider value={value}>{children}</VendorDrawerContext.Provider>;
};

const NOOP_DRAWER: VendorDrawerContextType = { isOpen: false, open: () => {}, close: () => {}, toggle: () => {} };

/**
 * Safe to call outside the provider — returns an inert drawer instead of
 * throwing, so shared kit components can render anywhere.
 */
export const useVendorDrawer = () => useContext(VendorDrawerContext) ?? NOOP_DRAWER;
