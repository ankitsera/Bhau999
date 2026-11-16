import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../contexts/ThemeContext";

const EmptyState = ({
  message = "NO DATA FOUND",
}) => {
  const { t } = useTranslation(['common']);
  const { colors } = useTheme();
  const navigation = useNavigation();

  const displayMessage = message === "NO DATA FOUND" ? t('common:noDataFound') : message;

  const handleGoBack = () => {
    navigation?.goBack?.();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface || "#fff" },
      ]}
    >
      {/* Red cross icon */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="close" size={64} color="#EF4B3E" />
      </View>

      {/* Message text */}
      <Text
        style={[styles.message, { color: colors.text }]}
        numberOfLines={3}
      >
        {displayMessage}
      </Text>

      {/* Go back button */}
      <Pressable
        onPress={handleGoBack}
        style={[
          styles.button,
          { backgroundColor: colors.primary },
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {t('common:goBack')}
        </Text>
      </Pressable>
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFE5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  button: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});