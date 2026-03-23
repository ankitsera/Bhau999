import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../../contexts/ThemeContext";

const GameTypePicker = ({
  label = "Select Game Type:",
  value,
  options = [],
  onChange,
  containerStyle,
}) => {
  const { t } = useTranslation(['games']);
  const { colors } = useTheme();

  // Only translate the default label, preserve null when explicitly passed
  const displayLabel = label === "Select Game Type:" ? t('games:selectGameType') : label;

  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);

  const { width: screenW, height: screenH } = Dimensions.get("window");

  const menuHeight = useMemo(() => {
    const rowH = 60;
    const titleH = displayLabel ? 36 : 0;
    const padding = 20;
    const h = titleH + padding + (options?.length || 0) * rowH;
    const maxH = Math.floor(screenH * 0.45);
    return Math.min(h, maxH);
  }, [options, screenH, displayLabel]);

  const openDropdown = () => {
    if (!options || options.length === 0) return;

    if (dropdownRef.current && dropdownRef.current.measureInWindow) {
      dropdownRef.current.measureInWindow((x, y, w, h) => {
        const margin = 8;

        const menuW = Math.max(w, 180);
        let left = x;
        if (left + menuW > screenW - margin) left = screenW - margin - menuW;
        if (left < margin) left = margin;

        const belowTop = y + h + 6;
        const aboveTop = y - menuHeight - 6;

        const top = belowTop + menuHeight <= screenH - margin ? belowTop : Math.max(margin, aboveTop);

        setAnchor({ left, top, width: menuW });
        setOpen(true);
      });
      return;
    }

    // fallback (rare)
    setAnchor({ left: 12, top: 100, width: 220 });
    setOpen(true);
  };

  const handlePick = (next) => {
    setOpen(false);
    onChange && onChange(next);
  };

  return (
    <View style={[styles.row, containerStyle]}>
      {displayLabel ? <Text style={[styles.label, { color: colors.text }]}>{displayLabel}</Text> : null}

      <TouchableOpacity
        ref={dropdownRef}
        style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={openDropdown}
      >
        <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>⌵</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          {anchor ? (
            <Pressable
              style={[
                styles.menu,
                {
                  left: anchor.left,
                  top: anchor.top,
                  width: anchor.width,
                  height: menuHeight,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {}}
            >
              {displayLabel ? (
                <Text style={[styles.menuTitle, { color: colors.text }]} numberOfLines={1}>
                  {displayLabel}
                </Text>
              ) : null}

              <ScrollView
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {options.map((opt) => {
                  const selected = opt === value;
                  return (
                    <TouchableOpacity
                      key={String(opt)}
                      style={[
                        styles.optionRow,
                        {
                          borderColor: colors.divider,
                          backgroundColor: selected ? colors.surface : colors.background,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handlePick(opt)}
                    >
                      <Text style={[styles.optionText, { color: selected ? colors.primary : colors.text }]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
};

export default GameTypePicker;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 40,
    width: 150,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 120,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  chevron: {
    fontSize: 18,
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  menu: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});