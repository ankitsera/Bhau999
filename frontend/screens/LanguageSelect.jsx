import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { markLanguageSelected } from '../utils/LanguagePreference';
import { useTheme } from '../contexts/ThemeContext';

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

const LanguageCard = ({ item, selectedCode, onPress }) => {
  const { colors } = useTheme();
  const isSelected = selectedCode === item.code;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          shadowColor: colors.text,
        },
        isSelected && styles.selectedCard,
      ]}
      onPress={() => onPress(item.code)}
    >
      {isSelected ? (
        <View style={[styles.checkWrap, { backgroundColor: colors.background }]}>
          <MaterialIcons name="check-circle" size={20} color={colors.primary} />
        </View>
      ) : null}

      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isSelected ? colors.primary : colors.primaryTile },
        ]}
      >
        <Text style={[styles.iconText, { color: isSelected ? colors.onPrimary : colors.text }]}>{item.icon}</Text>
      </View>

      <Text style={[styles.nativeName, { color: colors.text }]} numberOfLines={1}>
        {item.nativeName}
      </Text>

      {item.nativeName !== item.name ? (
        <Text
          style={[styles.englishName, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default function LanguageSelect({ navigation }) {
  const { i18n, t } = useTranslation('common');
  const { user } = useContext(AuthContext);
  const { colors, isDarkMode } = useTheme();

  const [selectedCode, setSelectedCode] = useState(i18n.language || 'en');
  const [busy, setBusy] = useState(false);

  const handleSelect = async langCode => {
    if (busy) return;

    setBusy(true);
    setSelectedCode(langCode);

    try {
      await i18n.changeLanguage(langCode);
      await markLanguageSelected(langCode);
    } catch (e) {
      console.log('Language selection error:', e?.message);
    }

    navigation.replace(user ? 'Home' : 'UserCheck');
    setBusy(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.primary }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'light-content'}
        backgroundColor={colors.primary}
      />

      <View style={styles.topArea} />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            shadowColor: colors.text,
            borderColor: colors.border,
          },
        ]}
      >
        <FlatList
          data={LANGUAGES}
          keyExtractor={item => item.code}
          numColumns={3}
          showsVerticalScrollIndicator
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <>
              <View style={[styles.logoWrap,]}>
                <Image
                  source={require('../assets/Images/logo.webp')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                {t('chooseYourLanguage')}
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('selectPreferredLanguage')}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            </>
          }
          renderItem={({ item }) => (
            <LanguageCard
              item={item}
              selectedCode={selectedCode}
              onPress={handleSelect}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  topArea: {
    flex: 0.05,
  },

  sheet: {
    flex: 0.92,
    borderRadius: 34,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,

    elevation: 12,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },

    borderWidth: 1,
  },

  listContent: {
    paddingBottom: 20,
  },

  logoWrap: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  logo: {
    width: 150,
    height: 150,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    marginBottom: 16,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  card: {
    width: '31%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: 128,
    position: 'relative',

    borderWidth: 1,

    elevation: 6,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  selectedCard: {
    transform: [{ translateY: -2 }],
  },

  checkWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    padding: 2,
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  iconText: {
    fontSize: 28,
    fontWeight: '900',
  },

  nativeName: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  englishName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
});