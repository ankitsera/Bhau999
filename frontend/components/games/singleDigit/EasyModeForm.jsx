import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const GREEN = "#3FA16C";

const EasyModeForm = ({
  digit,
  onChangeDigit,
  points,
  onChangePoints,
  onPressAdd,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.pointInputRow}>
        <Text style={styles.label}>Enter Single Digit:</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={onChangeDigit}
          placeholder="Ank"
        />
      </View>

      <View style={styles.pointInputRow}>
        <Text style={styles.label}>Enter Points:</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={points}
          onChangeText={onChangePoints}
          placeholder="Point"
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={onPressAdd}>
        <Text style={styles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EasyModeForm;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  pointInputRow:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  addButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});