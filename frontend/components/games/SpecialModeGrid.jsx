import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { FONT } from '../../contexts/Themes';

const SpecialModeGrid = ({ digits, pointsByDigit, onChangePoint }) => {
  const { colors } = useTheme();

  const leftDigits = digits.filter((_, idx) => idx % 2 === 0);
  const rightDigits = digits.filter((_, idx) => idx % 2 === 1);

  const renderColumn = (arr) => (
    <View style={styles.column}>
      {arr.map((d) => (
        <View key={d} style={styles.row}>
          <View style={[styles.digitBox, { backgroundColor: colors.primary }]}>
            <Text style={styles.digitText}>{d}</Text>
          </View>
          <TextInput
            style={[styles.pointInput, { backgroundColor: colors.surface, color: colors.text }]}
            keyboardType="number-pad"
            value={pointsByDigit[d]}
            onChangeText={(value) => onChangePoint(d, value)}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderColumn(leftDigits)}
      {renderColumn(rightDigits)}
    </View>
  );
};

export default SpecialModeGrid;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
    marginRight: 10,
  },
  digitBox: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  digitText: {
    color: "#FFF",
    fontSize: FONT.title,
    fontWeight: "700",
  },
  pointInput: {
    flex: 1,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 10,
    fontSize: FONT.body,
  },
});