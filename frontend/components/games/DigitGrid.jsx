import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const GREEN = "#3FA16C";

const DigitGrid = ({ digits, pointsByDigit, onPressDigit }) => {
  return (
    <View style={styles.grid}>
      {digits.map((d) => (
        <TouchableOpacity
          key={d}
          style={styles.tile}
          activeOpacity={0.85}
          onPress={() => onPressDigit(d)}
        >
          <Text style={styles.digitText}>{d}</Text>
          {pointsByDigit[d] ? (
            <Text style={styles.pointsText}>{pointsByDigit[d]}</Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default DigitGrid;

const styles = StyleSheet.create({
  grid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tile: {
    width: 90,
    height: 90,
    margin: 6,
    borderRadius: 12,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  digitText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
  },
  pointsText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
    position: "absolute",
    top: 8,
    right: 8,
  },
});