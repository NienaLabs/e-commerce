import React, { createContext, useContext } from 'react';

// For web, this will hold the maplibregl.Map instance
// For native, it might not be needed but we provide it for API parity if needed
export const MapContext = createContext<any>(null);

export const useMapContext = () => useContext(MapContext);
