import React, { createContext, useState, useContext } from 'react';
import CustomLoader from '../components/CustomLoader';

const LoaderContext = createContext();

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within LoaderProvider');
  }
  return context;
};

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, loading }}>
      {children}
      <CustomLoader visible={loading} />
    </LoaderContext.Provider>
  );
};