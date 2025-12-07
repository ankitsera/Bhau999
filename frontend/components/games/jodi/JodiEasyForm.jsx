// components/games/singlePana/JodiEasyForm.jsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const GREEN = "#3FA16C";

// precompute firstDigit -> [d0d0, d0d1, ...]
const FIRST_DIGIT_MAP = Array.from({ length: 10 }, (_, d) => {
  const key = String(d);
  const values = Array.from({ length: 10 }, (_, i) => `${d}${i}`);
  return [key, values];
}).reduce((acc, [k, v]) => {
  acc[k] = v;
  return acc;
}, {});

const JodiEasyForm = ({
  jodi,
  onChangeJodi,
  points,
  onChangePoints,
  onPressAdd,
}) => {
  const suggestions = useMemo(() => {
    if (!jodi || jodi.length !== 1) return [];
    return FIRST_DIGIT_MAP[jodi] || [];
  }, [jodi]);

  return (
    <View style={styles.container}>
      {/* Jodi input + dropdown */}
      <View style={styles.pointInputRow}>
        <Text style={styles.label}>Enter Jodi Digit:</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
            value={jodi}
            onChangeText={onChangeJodi}
            placeholder="Jodi"
          />

          {suggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionItem}
                    onPress={() => onChangeJodi(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Points row */}
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

export default JodiEasyForm;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  pointInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  inputWrapper: {
    width: 180,
    position: "relative",
  },
  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    fontSize: 16,
    textAlign: "center",
  },
  suggestionBox: {
    position: "absolute",
    top: 44 + 4, // just below the input
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    maxHeight: 160,
    zIndex: 10,
    elevation: 5,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
  addButton: {
    marginTop: 4,
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