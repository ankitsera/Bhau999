import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../contexts/ThemeContext";

const Footer = ({ navigation, active = "Home", onSupportPress }) => {
  const { t } = useTranslation(['common']);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const isActive = (tab) => tab === active;
  const GAP = 2;

  return (
    <View style={[styles.footerWrap, { paddingBottom: insets.bottom, backgroundColor: colors.background, shadowColor: colors.text }]}>
      {/* Footer bar background */}
      <View style={[styles.footerBar, { marginBottom: insets.bottom ? GAP : 0, backgroundColor: colors.background, shadowColor: colors.text }]}>
        {/* Left section */}
        <View style={styles.sideTabs}>
          <TabItem
            label={t('common:myBids')}
            icon={<Image source={require("../assets/Images/MyBids.webp")} style={{ width: 32, height: 32}} />}
            onPress={() => navigation.navigate("My Bids")}
            colors={colors}
          />
          <TabItem
            label={t('common:passbook')}
            icon={<Image source={require("../assets/Images/Passbook.webp")} style={{ width: 32, height: 32, resizeMode: "contain"}} />}
            onPress={() => navigation.navigate("Passbook")}
            colors={colors}
          />
        </View>

        {/* Right section */}
        <View style={styles.sideTabs}>
          <TabItem
            label={t('common:funds')}
            icon={<Image source={require("../assets/Images/Funds.webp")} style={{ width: 32, height: 32}} />}
            onPress={() => navigation.navigate("Funds")}
            colors={colors}
          />
          <TabItem
            label={t('common:support')}
            icon={<Image source={require("../assets/Images/Support.webp")} style={{ width: 32, height: 32}} />}
            onPress={onSupportPress ? onSupportPress : (() => navigation.navigate("Support"))}
            colors={colors}
          />
        </View>
      </View>

      {/* Floating Home button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.text }]}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.85}
      >
        <Image source={require("../assets/Images/home.webp")} style={{ width: 32, height: 32}} />
      </TouchableOpacity>
    </View>
  );
};

const TabItem = ({ icon, label, onPress, colors }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
    {icon}
    <Text style={[styles.tabLabel, { color: colors.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

export default Footer;

const styles = StyleSheet.create({
  footerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footerBar: {
    width: "100%",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
    elevation: 10,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sideTabs: {
    flexDirection: "row",
    gap: 24,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 13,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
    width: 68,
    height: 68,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});