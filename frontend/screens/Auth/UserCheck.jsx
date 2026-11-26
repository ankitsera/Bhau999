import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Svg, { Circle, Rect } from "react-native-svg";
import Snackbar from "react-native-snackbar";
import { useTranslation } from 'react-i18next';
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import LoginIllustration from "../../components/LoginIllustration";
import BrandLogo from "../../components/BrandLogo";

const APP_NAME = "Bhau999";

const IndiaFlag = () => (
  <Svg width={30} height={20} viewBox="0 0 30 20">
    <Rect x="0" y="0" width="30" height="6.67" fill="#FF9933" />
    <Rect x="0" y="6.67" width="30" height="6.66" fill="#FFFFFF" />
    <Rect x="0" y="13.33" width="30" height="6.67" fill="#138808" />
    <Circle cx="15" cy="10" r="2.6" stroke="#000080" strokeWidth="0.8" fill="none" />
    <Circle cx="15" cy="10" r="0.6" fill="#000080" />
  </Svg>
);

const UserCheck = ({ navigation }) => {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { userCheck } = useContext(AuthContext);
  const { colors, isDarkMode } = useTheme();

  const [mobileNumber, setMobileNumber] = useState("");

  const fieldBorder = isDarkMode ? colors.cardBorder : colors.divider;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.replace("Language Select");
  };

  const handleNext = () => {
    const phoneRegex = /^[0-9]{10}$/;
    const val = String(mobileNumber || "").trim();

    if (!val) {
      Snackbar.show({
        text: t('validation:pleaseEnterMobileNumber'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.error || "#d32f2f",
      });
      return;
    }

    if (!phoneRegex.test(val)) {
      Snackbar.show({
        text: t('validation:pleaseEnterValidMobileNumber'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.error || "#d32f2f",
      });
      return;
    }

    userCheck(val, navigation);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.surface }]}
      edges={["bottom", "top"]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <ScrollView
        contentContainerStyle={styles.scrollGrow}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header: back button + brand */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: fieldBorder, backgroundColor: colors.surface }]}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common:goBack')}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
            </TouchableOpacity>

            <BrandLogo size={48} />
          </View>

          {/* Illustration */}
          <LoginIllustration style={styles.illustration} />

          {/* Welcome copy */}
          <Text style={[styles.title, { color: colors.heading }]}>
            {t('auth:welcomeTo', { appName: APP_NAME })} 💚
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('auth:welcomeSubtitle')}
          </Text>

          {/* Country + phone */}
          <View style={styles.phoneRow}>
            <View style={[styles.countryBox, { borderColor: fieldBorder }]}>
              <IndiaFlag />
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.text} />
            </View>

            <View style={[styles.inputBox, { borderColor: fieldBorder }]}>
              <Text style={[styles.prefix, { color: colors.text }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="9876543210"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                value={mobileNumber}
                maxLength={10}
                accessibilityLabel={t('auth:phoneNumber')}
                returnKeyType="done"
                onSubmitEditing={handleNext}
                onChangeText={(text) => {
                  const digits = String(text || "").replace(/[^0-9]/g, "");

                  // handle common paste formats: +91XXXXXXXXXX / 91XXXXXXXXXX / 0XXXXXXXXXX
                  if (digits.length === 12 && digits.startsWith("91")) {
                    setMobileNumber(digits.slice(2));
                    return;
                  }
                  if (digits.length === 11 && digits.startsWith("0")) {
                    setMobileNumber(digits.slice(1));
                    return;
                  }

                  setMobileNumber(digits.slice(0, 10));
                }}
              />
            </View>
          </View>

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.dark }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.continueText, { color: colors.onDark || "#fff" }]}>
              {t('common:continue')}
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <Text style={[styles.footer, { color: colors.text }]}>
            {t('auth:welcomeFooter')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserCheck;

const styles = StyleSheet.create({
  safe: { flex: 1 },

  scrollGrow: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    alignSelf: "center",
    width: "68%",
    marginTop: 20,
  },

  title: {
    marginTop: 28,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 25,
  },

  phoneRow: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  countryBox: {
    width: 70,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  inputBox: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  prefix: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },

  continueBtn: {
    marginTop: 32,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  spacer: {
    flexGrow: 1,
    minHeight: 36,
    maxHeight: 64,
  },

  footer: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});
