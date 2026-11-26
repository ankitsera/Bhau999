import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { FONT } from '../../contexts/Themes';

// Drawn cover (no image assets): coloured board, spine shadow, icon, title and author.
const BookCover = ({ book, size = "medium", style }) => {
  const large = size === "large";

  return (
    <View
      style={[
        styles.cover,
        large ? styles.coverLarge : styles.coverMedium,
        { backgroundColor: book.cover },
        style,
      ]}
    >
      <View style={styles.spine} />
      <View style={styles.frame}>
        <MaterialCommunityIcons
          name={book.icon || "book-open-page-variant"}
          size={large ? 40 : 28}
          color="rgba(255,255,255,0.9)"
        />
        <Text
          style={[styles.title, large && styles.titleLarge]}
          numberOfLines={3}
        >
          {book.title}
        </Text>
        <View style={styles.rule} />
        <Text style={[styles.author, large && styles.authorLarge]} numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </View>
  );
};

export default BookCover;

const styles = StyleSheet.create({
  cover: {
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  coverMedium: {
    width: "100%",
    aspectRatio: 0.68,
  },
  coverLarge: {
    width: 170,
    height: 250,
  },
  spine: {
    width: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  frame: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  title: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: FONT.label,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 17,
  },
  titleLarge: {
    fontSize: FONT.title,
    lineHeight: 20,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginVertical: 8,
  },
  author: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600",
  },
  authorLarge: {
    fontSize: FONT.caption,
  },
});
