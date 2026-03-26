import React, { useEffect } from 'react';
import { useLoader } from '../contexts/LoaderContext';

const LoadingView = ({ loading, children }) => {
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    if (loading) {
      showLoader();
    } else {
      hideLoader();
    }
  }, [loading, showLoader, hideLoader]);

  if (loading) {
    return null;
  }

  return children;
};

export default LoadingView;