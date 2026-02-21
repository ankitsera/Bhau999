import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GameTypePicker from "./GameTypePicker";
import { useTheme } from "../../contexts/ThemeContext";

const GameDateTypeRow = ({
  dateLabel,        // e.g. "29-11-2025"
  gameTypeValue,    // "OPEN" | "CLOSE"
  gameTypeOptions,  // ["OPEN","CLOSE"] or ["CLOSE"]
  onChangeGameType,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateLabel}</Text>
      </View>

      <View style={{ width: 10 }} />

      <GameTypePicker
        label={null}
        value={gameTypeValue}
        options={gameTypeOptions}
        onChange={onChangeGameType}
      />
    </View>
  );
};

export default GameDateTypeRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  dateBox: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
});