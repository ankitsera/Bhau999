import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from 'src/services';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await userService.getAllUsers();
      
      // Map users with all necessary fields
      const mappedUsers = data.map(user => ({
        mobileNumber: user.mobileNumber,
        username: user.username,
        dateSignup: user.dateSignup,
        balance: user.balance,
        accountNumber: user.accountNumber,
        accountHolderName: user.accountHolderName,
        ifscCode: user.ifscCode,
        ifscRedFlagged: Boolean(user.ifscRedFlagged),
        upiId: user.upiId,
        approvalStatus: user.approvalStatus,
        viewMode: user.viewMode || 'FULL',
        is_subscriber: user.approvalStatus?.toUpperCase() === 'APPROVED'
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const value = {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};
