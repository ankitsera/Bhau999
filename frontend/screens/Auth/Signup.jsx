import React, { useEffect, useState, useContext, useMemo } from 'react';
import Snackbar from 'react-native-snackbar';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Signup = ({ navigation, route }) => {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { colors, isDarkMode } = useTheme();

  const { signup } = useContext(AuthContext);

  const routemobileNumber = route?.params?.mobileNumber || '';
  const isPhoneFromRoute = !!route?.params?.mobileNumber;

  const [mobileNumber, setMobileNumber] = useState(routemobileNumber);

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  // password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // focus borders
  const [uFocused, setUFocused] = useState(false);
  const [pFocused, setPFocused] = useState(false);

  // inline errors
  const [touched, setTouched] = useState({ username: false, password: false });

  const usernameError = useMemo(() => {
    if (!touched.username) return '';
    return username.trim() ? '' : t('validation:requiredField');
  }, [touched.username, username, t]);

  const passwordError = useMemo(() => {
    if (!touched.password) return '';
    return password.trim() ? '' : t('validation:requiredField');
  }, [touched.password, password, t]);

  const handleRegister = () => {
    // mark touched so errors show
    setTouched({ username: true, password: true });

    if (!username.trim()) {
      Snackbar.show({
        text: t('validation:pleaseEnterUsername'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
      return;
    }

    if (!password.trim()) {
      Snackbar.show({
        text: t('validation:pleaseEnterPassword'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
      return;
    }

    if (password.length < 6) {
      Snackbar.show({
        text: t('validation:passwordMinLength'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
      return;
    }

    signup(mobileNumber, username, password, navigation);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View style={[styles.titleBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.titleText, { color: colors.heading }]}>
            {t('auth:createAccount').toUpperCase()}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Username */}
          <View
            style={[
              styles.pill,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              uFocused && { borderColor: colors.primary },
            ]}
          >
            <View style={[styles.leftCircle, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="account" size={22} color={colors.onPrimary} />
            </View>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth:name')}
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="words"
              onFocus={() => setUFocused(true)}
              onBlur={() => {
                setUFocused(false);
                setTouched((t) => ({ ...t, username: true }));
              }}
            />
          </View>

          {!!usernameError && <Text style={styles.errorText}>{usernameError}</Text>}

          {/* Mobile */}
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={[styles.leftCircle, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="cellphone" size={22} color={colors.onPrimary} />
            </View>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={mobileNumber}
              placeholder={t('auth:phoneNumber')}
              placeholderTextColor={colors.textTertiary}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View
            style={[
              styles.pill,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              pFocused && { borderColor: colors.primary },
            ]}
          >
            <View style={[styles.leftCircle, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="lock" size={22} color={colors.onPrimary} />
            </View>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth:password')}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setPFocused(true)}
              onBlur={() => {
                setPFocused(false);
                setTouched((t) => ({ ...t, password: true }));
              }}
            />

            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color={colors.textTertiary}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>

          {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          {/* Button */}
          <TouchableOpacity
            style={[styles.signupBtn, { backgroundColor: colors.dark }]}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={[styles.signupText, { color: colors.onDark }]}>{t('auth:registerAndLogin').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 26,
  },
  titleBar: {
    width: 12,
    height: 70,
    borderRadius: 4,
    marginRight: 14,
  },
  titleText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },

  form: {
    marginTop: 30,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 12,
  },

  leftCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  input: {
    flex: 1,
    fontSize: 18,
  },

  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontWeight: '600',
  },

  signupBtn: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  signupText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
});