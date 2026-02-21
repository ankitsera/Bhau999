import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

const BottomBetBar = ({
  bids,
  points,
  onSubmit,
  submitLabel = "Submit",
  disabled = false,
  loading = false,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    onSubmit && onSubmit();
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.divider, backgroundColor: colors.surface }]}>
      <View style={styles.left}>
        <View style={styles.item}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Bids</Text>
          <Text style={[styles.value, { color: colors.text }]}>{bids ?? 0}</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Points</Text>
          <Text style={[styles.value, { color: colors.text }]}>{points ?? 0}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
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
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
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
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
  },
  button: {
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