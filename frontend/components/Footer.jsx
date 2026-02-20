import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColor } from "../contexts/Themes";

const Footer = ({ navigation, active = "Home", onSupportPress }) => {
  const insets = useSafeAreaInsets();
  const isActive = (tab) => tab === active;
  const GAP = 2;

  return (
    <View style={[styles.footerWrap, { paddingBottom: insets.bottom }]}>
      {/* Footer bar background */}
      <View style={[styles.footerBar, { marginBottom: insets.bottom ? GAP : 0 }]}>
        {/* Left section */}
        <View style={styles.sideTabs}>
          <TabItem
            label="My Bids"
            icon={<MaterialCommunityIcons name="gavel" size={26} color="#333" />}
            onPress={() => navigation.navigate("My Bids")}
          />
          <TabItem
            label="Passbook"
            icon={<MaterialCommunityIcons name="credit-card-multiple-outline" size={26} color="#333" />}
            onPress={() => navigation.navigate("Passbook")}
          />
        </View>

        {/* Right section */}
        <View style={styles.sideTabs}>
          <TabItem
            label="Funds"
            icon={<MaterialCommunityIcons name="bank" size={26} color="#333" />}
            onPress={() => navigation.navigate("Funds")}
          />
          <TabItem
            label="Support"
            icon={<MaterialCommunityIcons name="chat-processing-outline" size={26} color="#333" />}
            onPress={onSupportPress ? onSupportPress : (() => navigation.navigate("Support"))}
          />
        </View>
      </View>

      {/* Floating Home button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="home-variant-outline"
          size={28}
          color="#0d0d0d"
        />
      </TouchableOpacity>
    </View>
  );
};

const TabItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
    {icon}
    <Text style={styles.tabLabel}>{label}</Text>
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
    backgroundColor: "#fff",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footerBar: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 10,
    paddingHorizontal: 18,
    elevation: 10,
    shadowColor: "#000",
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
    color: "#333",
  },
  fab: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ThemeColor,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});