import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";

const ThemeHeader = ({ title = "" }) => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={[styles.bg, { backgroundColor: colors.primary }]} />
      <View style={styles.row}>
        <Pressable
          onPress={() => navigation?.goBack?.()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ paddingRight: 8, marginBottom: 15, }}
        >
          <MaterialIcons name="arrow-back" size={26} color={colors.text} />
        </Pressable>

        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        <View style={{ width: 26 }} />
      </View>
    </View>
  );
};

export default ThemeHeader;

const styles = StyleSheet.create({
  root: { 
    width: "100%",
  },
  bg: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 90,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  row: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: { 
    flex: 1, 
    fontSize: 22, 
    fontWeight: "500", 
    marginLeft: 6,
    marginBottom: 15,
  },
});