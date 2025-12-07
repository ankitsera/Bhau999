import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const GameTypePicker = ({
  label = "Select Game Type:",
  value,
  options = [],
  onChange,
  containerStyle,
}) => {
  const handlePress = () => {
    if (!options || options.length === 0) return;
    const idx = options.indexOf(value);
    const next = options[(idx + 1) % options.length];
    onChange && onChange(next);
  };

  return (
    <View style={[styles.row, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.dropdown}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.chevron}>⌵</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GameTypePicker;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginRight: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 40,
    width: 180,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    minWidth: 120,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },
  chevron: {
    fontSize: 18,
    color: "#888888",
    marginLeft: 8,
  },
});