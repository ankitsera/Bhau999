import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_SELECTED_KEY = 'language_selected_v1';

export async function markLanguageSelected(langCode) {
  try {
    await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, langCode);
  } catch (e) {
    console.log('Failed to save language selection:', e?.message);
  }
}

export async function getSelectedLanguage() {
  try {
    return await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
  } catch (e) {
    console.log('Failed to read language selection:', e?.message);
    return null;
  }
}

export async function hasSelectedLanguage() {
  const lang = await getSelectedLanguage();
  return !!lang;
}