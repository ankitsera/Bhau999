import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Load username from localStorage on mount
    const storedUsername = window.localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const saveUsername = (user) => {
    setUsername(user);
    window.localStorage.setItem('username', user);
  };

  const clearUsername = () => {
    setUsername('');
    window.localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ username, saveUsername, clearUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
