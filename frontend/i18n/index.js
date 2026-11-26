import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// English translations
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enAuth from './locales/en/auth.json';
import enFunds from './locales/en/funds.json';
import enGames from './locales/en/games.json';
import enScreens from './locales/en/screens.json';
import enValidation from './locales/en/validation.json';
import enLibrary from './locales/en/library.json';

// Hindi translations
import hiCommon from './locales/hi/common.json';
import hiNavigation from './locales/hi/navigation.json';
import hiAuth from './locales/hi/auth.json';
import hiFunds from './locales/hi/funds.json';
import hiGames from './locales/hi/games.json';
import hiScreens from './locales/hi/screens.json';
import hiValidation from './locales/hi/validation.json';

// Marathi translations
import mrCommon from './locales/mr/common.json';
import mrNavigation from './locales/mr/navigation.json';
import mrAuth from './locales/mr/auth.json';
import mrFunds from './locales/mr/funds.json';
import mrGames from './locales/mr/games.json';
import mrScreens from './locales/mr/screens.json';
import mrValidation from './locales/mr/validation.json';

// Kannada translations
import knCommon from './locales/kn/common.json';
import knNavigation from './locales/kn/navigation.json';
import knAuth from './locales/kn/auth.json';
import knFunds from './locales/kn/funds.json';
import knGames from './locales/kn/games.json';
import knScreens from './locales/kn/screens.json';
import knValidation from './locales/kn/validation.json';

// Telugu translations
import teCommon from './locales/te/common.json';
import teNavigation from './locales/te/navigation.json';
import teAuth from './locales/te/auth.json';
import teFunds from './locales/te/funds.json';
import teGames from './locales/te/games.json';
import teScreens from './locales/te/screens.json';
import teValidation from './locales/te/validation.json';

// Tamil translations
import taCommon from './locales/ta/common.json';
import taNavigation from './locales/ta/navigation.json';
import taAuth from './locales/ta/auth.json';
import taFunds from './locales/ta/funds.json';
import taGames from './locales/ta/games.json';
import taScreens from './locales/ta/screens.json';
import taValidation from './locales/ta/validation.json';

// Gujarati translations
import guCommon from './locales/gu/common.json';
import guNavigation from './locales/gu/navigation.json';
import guAuth from './locales/gu/auth.json';
import guFunds from './locales/gu/funds.json';
import guGames from './locales/gu/games.json';
import guScreens from './locales/gu/screens.json';
import guValidation from './locales/gu/validation.json';

// Bengali translations
import bnCommon from './locales/bn/common.json';
import bnNavigation from './locales/bn/navigation.json';
import bnAuth from './locales/bn/auth.json';
import bnFunds from './locales/bn/funds.json';
import bnGames from './locales/bn/games.json';
import bnScreens from './locales/bn/screens.json';
import bnValidation from './locales/bn/validation.json';

// Malayalam translations
import mlCommon from './locales/ml/common.json';
import mlNavigation from './locales/ml/navigation.json';
import mlAuth from './locales/ml/auth.json';
import mlFunds from './locales/ml/funds.json';
import mlGames from './locales/ml/games.json';
import mlScreens from './locales/ml/screens.json';
import mlValidation from './locales/ml/validation.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Language detector plugin
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Check if user has previously selected a language
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      
      // Fall back to device language
      const deviceLanguages = RNLocalize.getLocales();
      const deviceLanguage = deviceLanguages[0]?.languageCode || 'en';
      
      // Map device language to supported languages
      const supportedLanguages = ['en', 'hi', 'mr', 'kn', 'te', 'ta', 'gu', 'bn', 'ml'];
      const languageToUse = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      
      callback(languageToUse);
    } catch (error) {
      callback('en'); // Default to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  },
};

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    funds: enFunds,
    games: enGames,
    screens: enScreens,
    // English only for now; other languages fall back to it
    library: enLibrary,
    validation: enValidation,
  },
  hi: {
    common: hiCommon,
    navigation: hiNavigation,
    auth: hiAuth,
    funds: hiFunds,
    games: hiGames,
    screens: hiScreens,
    validation: hiValidation,
  },
  mr: {
    common: mrCommon,
    navigation: mrNavigation,
    auth: mrAuth,
    funds: mrFunds,
    games: mrGames,
    screens: mrScreens,
    validation: mrValidation,
  },
  kn: {
    common: knCommon,
    navigation: knNavigation,
    auth: knAuth,
    funds: knFunds,
    games: knGames,
    screens: knScreens,
    validation: knValidation,
  },
  te: {
    common: teCommon,
    navigation: teNavigation,
    auth: teAuth,
    funds: teFunds,
    games: teGames,
    screens: teScreens,
    validation: teValidation,
  },
  ta: {
    common: taCommon,
    navigation: taNavigation,
    auth: taAuth,
    funds: taFunds,
    games: taGames,
    screens: taScreens,
    validation: taValidation,
  },
  gu: {
    common: guCommon,
    navigation: guNavigation,
    auth: guAuth,
    funds: guFunds,
    games: guGames,
    screens: guScreens,
    validation: guValidation,
  },
  bn: {
    common: bnCommon,
    navigation: bnNavigation,
    auth: bnAuth,
    funds: bnFunds,
    games: bnGames,
    screens: bnScreens,
    validation: bnValidation,
  },
  ml: {
    common: mlCommon,
    navigation: mlNavigation,
    auth: mlAuth,
    funds: mlFunds,
    games: mlGames,
    screens: mlScreens,
    validation: mlValidation,
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React Native already escapes values
    },
    compatibilityJSON: 'v3', // Important for proper pluralization support
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = async (languageCode) => {
  await i18n.changeLanguage(languageCode);
};

// Helper to get current language
export const getCurrentLanguage = () => i18n.language;
