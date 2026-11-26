import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { FONT } from '../../contexts/Themes';

const SubGameTile = ({ label, image, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={[styles.tile, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.circle, { backgroundColor: colors.background }]}>
        {image ? (
          <Image source={image} style={styles.image} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.border }]} />
        )}
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default SubGameTile;

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 150,
    // borderColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  image: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  label: {
    fontSize: FONT.body,
    fontWeight: "600",
  },
});