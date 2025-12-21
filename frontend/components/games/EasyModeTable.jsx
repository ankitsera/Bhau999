import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#3FA16C";
const DELETE_COL_W = 44; // keep header + rows aligned

const EasyModeTable = ({ bets, onDelete, digitHeaderLabel = "Ank" }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>{digitHeaderLabel}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>Point</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>Type</Text>
        </View>

        {/* Fixed-width delete header cell (matches rows) */}
        <View style={styles.deleteCol}>
          <Text style={styles.headerText}>Delete</Text>
        </View>
      </View>

      {/* scrollable body */}
      <View style={styles.body}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {!bets || bets.length === 0 ? (
            <Text style={styles.emptyText}>No entries</Text>
          ) : (
            bets.map((item) => (
              <View key={String(item.id)} style={styles.row}>
                <CellText>{item.digit}</CellText>
                <CellText>{item.points}</CellText>
                <CellText>{item.type}</CellText>

                {/* Fixed-width delete column (matches header) */}
                <View style={styles.deleteCol}>
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
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const CellText = ({ children }) => <Text style={styles.cellText}>{children}</Text>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: GREEN,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: "center",
  },
  headerCell: {
    flex: 1,
    alignItems: "center",
  },
  deleteCol: {
    width: DELETE_COL_W,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  body: {
    flex: 1,
    marginTop: 8,
    marginHorizontal: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    paddingVertical: 16,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
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

export default EasyModeTable;