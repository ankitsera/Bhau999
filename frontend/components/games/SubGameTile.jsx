import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";

const GREEN = "#3FA16C";

const SubGameTile = ({ label, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.circle}>
        {image ? (
          <Image source={image} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
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
  image: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  placeholderImage: {
    width: 50,
    height: 50,
    backgroundColor: "#e0e0e0",
    borderRadius: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
});