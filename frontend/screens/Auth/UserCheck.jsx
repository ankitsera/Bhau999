import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Snackbar from "react-native-snackbar";
import { useTranslation } from 'react-i18next';
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const UserCheck = ({ navigation }) => {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { userCheck } = useContext(AuthContext);
  const { colors, isDarkMode } = useTheme();

  const [mobileNumber, setMobileNumber] = useState("");

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
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["bottom", "top"]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollGrow}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Title Row like screenshot */}
          <View style={styles.titleRow}>
            <View
              style={[styles.primaryBar, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.title, { color: colors.heading }]}>
              {t('auth:enterMobileNumber')}
            </Text>
          </View>

          {/* Big Illustration */}
          <Image
            source={require("../../assets/Images/UserCheck.webp")}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Input pill */}
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons
                name="cellphone"
                size={24}
                color={colors.onPrimary || "#fff"}
              />
            </View>

            <Text style={[styles.prefix, { color: colors.text }]}>+91</Text>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth:phoneNumber')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              value={mobileNumber}
              maxLength={10}
              onChangeText={(t) => {
                const digits = String(t || "").replace(/[^0-9]/g, "");

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

          {/* Next button */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.dark }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextText, { color: colors.onDark || "#fff" }]}>
              {t('common:next')}
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 18,
    paddingTop: 10,
    alignItems: "center",
  },

  titleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 10,
  },
  primaryBar: {
    width: 10,
    height: 50,
    borderRadius: 2,
    marginTop: 6,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  image: {
    width: "92%",
    height: 300,
    marginTop: 10,
    marginBottom: 10,
  },

  inputPill: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 18,
    marginTop: 12,
  },

  prefix: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
  },

  nextBtn: {
    width: "100%",
    marginTop: 26,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  nextText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});