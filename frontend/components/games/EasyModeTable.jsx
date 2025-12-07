import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#3FA16C";

const EasyModeTable = ({ bets, onDelete, digitHeaderLabel = "Ank" }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HeaderCell label={digitHeaderLabel} />
        <HeaderCell label="Point" />
        <HeaderCell label="Type" />
        <HeaderCell label="Delete" />
      </View>

      {bets.map((item) => (
        <View key={item.id} style={styles.row}>
          <CellText>{item.digit}</CellText>
          <CellText>{item.points}</CellText>
          <CellText>{item.type}</CellText>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default EasyModeTable;

const HeaderCell = ({ label }) => (
  <View style={styles.headerCell}>
    <Text style={styles.headerText}>{label}</Text>
  </View>
);

const CellText = ({ children }) => (
  <Text style={styles.cellText}>{children}</Text>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: GREEN,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  headerCell: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cellText: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    color: "#333",
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
});