import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";

const Footer = ({ navigation, active = "Home", onSupportPress }) => {
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
            label="My Bids"
            icon={<MaterialCommunityIcons name="gavel" size={26} color={colors.textSecondary} />}
            onPress={() => navigation.navigate("My Bids")}
            colors={colors}
          />
          <TabItem
            label="Passbook"
            icon={<MaterialCommunityIcons name="checkbook" size={26} color={colors.textSecondary} />}
            onPress={() => navigation.navigate("Passbook")}
            colors={colors}
          />
        </View>

        {/* Right section */}
        <View style={styles.sideTabs}>
          <TabItem
            label="Funds"
            icon={<MaterialCommunityIcons name="bank-outline" size={26} color={colors.textSecondary} />}
            onPress={() => navigation.navigate("Funds")}
            colors={colors}
          />
          <TabItem
            label="Support"
            icon={<MaterialCommunityIcons name="chat-processing-outline" size={26} color={colors.textSecondary} />}
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
        <MaterialCommunityIcons
          name="home-variant-outline"
          size={28}
          color={colors.text}
        />
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
    marginTop: 4,
    fontSize: 13,
  },
  fab: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});