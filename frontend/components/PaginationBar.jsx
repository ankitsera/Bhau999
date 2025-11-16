import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const GREEN = "#3FA16C";

const PaginationBar = ({
  page = 1,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
}) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: bottom ? bottom - 2 : 8 }]}>
      <TouchableOpacity
        style={[styles.sideBtn, !hasPrev && styles.disabled]}
        onPress={onPrev}
        disabled={!hasPrev}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chevron-left" size={22} color="#111" />
        <Text style={styles.sideText}>PREV</Text>
      </TouchableOpacity>

      <View style={styles.pageDot}>
        <Text style={styles.pageText}>{page}</Text>
      </View>

      <TouchableOpacity
        style={[styles.sideBtn, !hasNext && styles.disabled]}
        onPress={onNext}
        disabled={!hasNext}
        activeOpacity={0.8}
      >
        <Text style={styles.sideText}>NEXT</Text>
        <MaterialIcons name="chevron-right" size={22} color="#111" />
      </TouchableOpacity>
    </View>
  );
};

export default PaginationBar;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  sideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  disabled: { opacity: 0.35 },
  sideText: { 
    color: "#111", 
    fontSize: 15, 
    fontWeight: "700",
  },

  pageDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  pageText: { 
    color: "#12D279", 
    fontWeight: "800", 
    fontSize: 16 
 },

});