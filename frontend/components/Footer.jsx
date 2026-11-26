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
import { useFeature, FEATURES } from "../utils/Features";
import { FONT } from '../contexts/Themes';

const Footer = ({ navigation, active = "Home", onSupportPress }) => {
  const { t } = useTranslation(['common']);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const isActive = (tab) => tab === active;
  const GAP = 2;
  const canBet = useFeature(FEATURES.BETTING);
  const canPay = useFeature(FEATURES.PAYMENTS);

  return (
    <View style={[styles.footerWrap, { paddingBottom: insets.bottom, backgroundColor: colors.surface, shadowColor: colors.text }]}>
      {/* Footer bar background */}
      <View style={[styles.footerBar, { marginBottom: insets.bottom ? GAP : 0, backgroundColor: colors.surface, shadowColor: colors.text }]}>
        {/* Left section */}
        <View style={styles.sideTabs}>
          {canBet && (
            <TabItem
              label={t('common:myBids')}
              icon={<Image source={require("../assets/Images/MyBids.webp")} style={[styles.tabIcon, { tintColor: colors.textTertiary }]} resizeMode="contain" />}
              onPress={() => navigation.navigate("My Bids")}
              colors={colors}
            />
          )}
          {canPay && (
            <TabItem
              label={t('common:passbook')}
              icon={<Image source={require("../assets/Images/Passbook.webp")} style={[styles.tabIcon, { tintColor: colors.textTertiary }]} resizeMode="contain" />}
              onPress={() => navigation.navigate("Passbook")}
              colors={colors}
            />
          )}
        </View>

        {/* Right section */}
        <View style={styles.sideTabs}>
          {canPay && (
            <TabItem
              label={t('common:funds')}
              icon={<Image source={require("../assets/Images/Funds.webp")} style={[styles.tabIcon, { tintColor: colors.textTertiary }]} resizeMode="contain" />}
              onPress={() => navigation.navigate("Funds")}
              colors={colors}
            />
          )}
          <TabItem
            label={t('common:support')}
            icon={<Image source={require("../assets/Images/Support.webp")} style={[styles.tabIcon, { tintColor: colors.textTertiary }]} resizeMode="contain" />}
            onPress={onSupportPress ? onSupportPress : (() => navigation.navigate("Support"))}
            colors={colors}
          />
        </View>
      </View>

      {/* Floating Home button */}
      <View style={[styles.fabRing, { backgroundColor: colors.primaryIconBg }]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, borderColor: colors.surface, shadowColor: colors.text }]}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.85}
        >
          <Image source={require("../assets/Images/home.webp")} style={[styles.fabIcon, { tintColor: colors.onPrimary }]} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TabItem = ({ icon, label, onPress, colors }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
    {icon}
    <Text style={[styles.tabLabel, { color: colors.textTertiary }]}>{label}</Text>
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 12,
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
  tabIcon: {
    width: 30,
    height: 30,
  },
  tabLabel: {
    fontSize: FONT.caption,
    fontWeight: "500",
    marginTop: 4,
  },
  fabRing: {
    position: "absolute",
    bottom: 22,
    alignSelf: "center",
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: {
    width: 30,
    height: 30,
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});