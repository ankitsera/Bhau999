import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#3FA16C";

const SubGameTile = ({ label, icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.circle}>
        <MaterialCommunityIcons name={icon} size={50} color={GREEN} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

export default SubGameTile;

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 150,
    backgroundColor: "#f2f2f2ff",
    // borderColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
});