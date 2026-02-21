import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

const DELETE_COL_W = 44; // keep header + rows aligned

const EasyModeTable = ({ bets, onDelete, digitHeaderLabel = "Ank" }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { backgroundColor: colors.primary }]}>
        <View style={styles.headerCell}>
          <Text style={[styles.headerText, { color: colors.text }]}>{digitHeaderLabel}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={[styles.headerText, { color: colors.text }]}>Point</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={[styles.headerText, { color: colors.text }]}>Type</Text>
        </View>

        {/* Fixed-width delete header cell (matches rows) */}
        <View style={styles.deleteCol}>
          <Text style={[styles.headerText, { color: colors.text }]}>Delete</Text>
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
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No entries</Text>
          ) : (
            bets.map((item) => (
              <View key={String(item.id)} style={[styles.row, { backgroundColor: colors.surface }]}>
                <CellText colors={colors}>{item.digit}</CellText>
                <CellText colors={colors}>{item.points}</CellText>
                <CellText colors={colors}>{item.type}</CellText>

                {/* Fixed-width delete column (matches header) */}
                <View style={styles.deleteCol}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: colors.primary }]}
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

const CellText = ({ children, colors }) => <Text style={[styles.cellText, { color: colors.textSecondary }]}>{children}</Text>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: "row",
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
    paddingVertical: 16,
  },
  row: {
    flexDirection: "row",
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
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EasyModeTable;