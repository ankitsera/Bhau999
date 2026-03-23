import { Alert } from 'react-native';
import { getMinBetAmount, getMaxBetAmount } from './AppConfigService';

/**
 * Validates if a bet amount is within the min/max limits
 * @param {number} amount - The bet amount to validate
 * @param {number} minAmount - Minimum bet amount
 * @param {number} maxAmount - Maximum bet amount
 * @returns {boolean} - true if valid, false otherwise
 */
export const isValidBetAmount = (amount, minAmount, maxAmount) => {
  const parsedAmount = Number(amount);
  
  if (!parsedAmount || parsedAmount <= 0) {
    return false;
  }
  
  if (parsedAmount < minAmount) {
    return false;
  }
  
  if (parsedAmount > maxAmount) {
    return false;
  }
  
  return true;
};

/**
 * Shows alert if bet amount is outside limits
 * @param {number} amount - The bet amount to validate
 * @param {number} minAmount - Minimum bet amount
 * @param {number} maxAmount - Maximum bet amount
 * @param {function} t - Translation function (required)
 * @returns {boolean} - true if valid, false otherwise
 */
export const validateAndAlertBetAmount = (amount, minAmount, maxAmount, t) => {
  const parsedAmount = Number(amount);
  
  if (!parsedAmount || parsedAmount <= 0) {
    Alert.alert(
      t('validation:validationMessage'),
      t('validation:pleaseEnterValidAmountGreaterThan0')
    );
    return false;
  }
  
  if (parsedAmount < minAmount) {
    Alert.alert(
      t('validation:validationMessage'),
      t('validation:minimumBetAmountIs', { minAmount })
    );
    return false;
  }
  
  if (parsedAmount > maxAmount) {
    Alert.alert(
      t('validation:validationMessage'),
      t('validation:maximumBetAmountIs', { maxAmount })
    );
    return false;
  }
  
  return true;
}

/**
 * Hook to fetch and cache min/max bet amounts
 * Usage in component:
 * const { minAmount, maxAmount, loading } = useBetLimits();
 */
export const fetchBetLimits = async () => {
  try {
    const min = await getMinBetAmount();
    const max = await getMaxBetAmount();
    return { minAmount: min, maxAmount: max };
  } catch (error) {
    console.error('Error fetching bet limits:', error);
    // Return safe defaults if fetch fails
    return { minAmount: 10, maxAmount: 10000 };
  }
};
