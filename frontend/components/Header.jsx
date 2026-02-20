import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { ThemeColor } from "../contexts/Themes";

const ThemeHeader = ({ title = "" }) => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <View style={styles.bg} />
      <View style={styles.row}>
        <Pressable
          onPress={() => navigation?.goBack?.()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ paddingRight: 8, marginBottom: 15, }}
        >
          <MaterialIcons name="arrow-back" size={26} color="#000" />
        </Pressable>

        <Text numberOfLines={1} style={styles.title}>
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
    backgroundColor: ThemeColor,
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
    color: "#000", 
    fontSize: 26, 
    fontWeight: "700", 
    marginLeft: 6,
    marginBottom: 15,
  },
});