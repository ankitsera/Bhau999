import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const EmptyState = ({
  icon = "folder-alert-outline",
  message = "NO DATA FOUND",
}) => {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={150} color="#202020" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  text: {
    color: "#111",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});