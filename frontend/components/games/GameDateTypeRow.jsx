import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GameTypePicker from "./GameTypePicker";

const GameDateTypeRow = ({
  dateLabel,        // e.g. "29-11-2025"
  gameTypeValue,    // "OPEN" | "CLOSE"
  gameTypeOptions,  // ["OPEN","CLOSE"] or ["CLOSE"]
  onChangeGameType,
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.dateBox}>
        <Text style={styles.dateText}>{dateLabel}</Text>
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
});