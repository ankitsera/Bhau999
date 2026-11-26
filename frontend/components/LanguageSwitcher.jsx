import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import ThemeHeader from './ThemeHeader';
import { markLanguageSelected } from '../utils/LanguagePreference';
import { useTheme } from '../contexts/ThemeContext';
import { FONT } from '../contexts/Themes';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', icon: 'E' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: 'ह' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: 'म' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: 'ব' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: 'ગ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: 'த' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: 'త' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: 'ಕ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', icon: 'മ' },
];

const LanguageCard = ({ language, isSelected, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.text,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isSelected ? (
        <View style={styles.checkIcon}>
          <MaterialIcons name="check-circle" size={22} color={colors.primary} />
        </View>
      ) : null}

      <View style={[styles.circle, { backgroundColor: colors.primary }]}>
        <Text style={[styles.circleText, { color: colors.onPrimary }]}>{language.icon}</Text>
      </View>

      <Text style={[styles.langText, { color: colors.text }]} numberOfLines={1}>
        {language.nativeName}
      </Text>

      {/* tiny extra polish: show english name only when different */}
      {language.nativeName !== language.name ? (
        <Text style={[styles.langSubText, { color: colors.textSecondary }]} numberOfLines={1}>
          {language.name}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation('common');
  const { colors, isDarkMode } = useTheme();

  const currentLanguage = i18n.language;

  const changeLanguage = async (langCode) => {
    await i18n.changeLanguage(langCode);
    await markLanguageSelected(langCode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('language')} />

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        numColumns={3}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LanguageCard
            language={item}
            isSelected={currentLanguage === item.code}
            onPress={() => changeLanguage(item.code)}
          />
        )}
      />
    </View>
  );
};

export default LanguageSwitcher;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    padding: 12,
    paddingBottom: 20,
  },

  card: {
    flex: 1,
    margin: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,

    borderWidth: 1,

    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  circleText: {
    fontSize: FONT.h3,
    fontWeight: '800',
  },

  langText: {
    fontSize: FONT.label,
    fontWeight: '800',
    textAlign: 'center',
  },

  langSubText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});