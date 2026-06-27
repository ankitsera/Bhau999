import React, { createContext, useState, useContext, useCallback } from 'react';
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

  const showLoader = useCallback(() => {
      setLoading(prev => prev || true);
  }, []);

  const hideLoader = useCallback(() => {
      setLoading(prev => prev ? false : prev);
  }, []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, loading }}>
      {children}
      <CustomLoader visible={loading} />
    </LoaderContext.Provider>
  );
};