import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Filter button for a ThemeHeader's `right` slot: a small outlined square with a badge for the
 * number of active filters, plus a "Clear" pill when any filter is active.
 */
const FilterButton = ({ count = 0, onPress, onClear }) => {
  const { t } = useTranslation(['screens']);
  const { colors } = useTheme();
  const active = count > 0;

  return (
    <View style={styles.row}>
      {active && onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          style={({ pressed }) => [
            styles.clear,
            { borderColor: colors.cardBorder, backgroundColor: colors.surface },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.clearText, { color: colors.textSecondary }]}>{t('screens:clear')}</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Filter"
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: active ? colors.primary : colors.cardBorder,
            backgroundColor: active ? colors.primaryIconBg : colors.surface,
          },
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="filter-variant" size={20} color={colors.primary} />
        {active ? (
          <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{count}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};

export default FilterButton;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clear: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
