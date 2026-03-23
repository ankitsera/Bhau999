import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../contexts/ThemeContext";

const PaginationBar = ({
  page = 1,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
}) => {
  const { t } = useTranslation(['common']);
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { paddingBottom: bottom ? bottom - 2 : 8, backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <TouchableOpacity
        style={[styles.sideBtn, !hasPrev && styles.disabled]}
        onPress={onPrev}
        disabled={!hasPrev}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chevron-left" size={22} color={colors.text} />
        <Text style={[styles.sideText, { color: colors.text }]} >{t('common:prev')}</Text>
      </TouchableOpacity>

      <View style={[styles.pageDot, { backgroundColor: colors.text }]}>
        <Text style={[styles.pageText, { color: colors.primaryTile }]} numberOfLines={1}>
          {page}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.sideBtn, !hasNext && styles.disabled]}
        onPress={onNext}
        disabled={!hasNext}
        activeOpacity={0.8}
      >
        <Text style={[styles.sideText, { color: colors.text }]}>{t('common:next')}</Text>
        <MaterialIcons name="chevron-right" size={22} color={colors.text} />
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
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    elevation: 8,
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
    fontSize: 15, 
    fontWeight: "700",
  },

  pageDot: {
    minWidth: 46,
    maxWidth: 110,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  pageText: { 
    fontWeight: "800", 
    fontSize: 16 
 },

});