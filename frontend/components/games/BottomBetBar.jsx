import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const GREEN = "#3FA16C";

const BottomBetBar = ({
  bids,
  points,
  onSubmit,
  submitLabel = "Submit",
  disabled = false,
  loading = false,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    onSubmit && onSubmit();
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.item}>
          <Text style={styles.label}>Bids</Text>
          <Text style={styles.value}>{bids ?? 0}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Points</Text>
          <Text style={styles.value}>{points ?? 0}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (disabled || loading) && { opacity: 0.6 },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {loading ? "..." : submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomBetBar;

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "#D9D9D9",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  left: {
    flexDirection: "row",
    flex: 1,
  },
  item: {
    marginRight: 28,
  },
  label: {
    fontSize: 13,
    color: "#444",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  button: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingHorizontal: 22,
    paddingVertical: 9,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 90,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});