import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

const MARK = require('../assets/Images/bhau999-mark.webp');

// Base layout is designed at size 48 (mark height); everything scales from it.
const BASE = 48;

/**
 * Bhau999 brand logo: round "B" mark + italic BHAU999 wordmark with a swoosh.
 *
 * size: height of the round mark in dp.
 * tone: "default" for normal surfaces, "onPrimary" for the green brand color.
 */
const BrandLogo = ({ size = BASE, tone = 'default', style }) => {
  const { colors } = useTheme();
  const s = size / BASE;

  const onPrimary = tone === 'onPrimary';
  const nameColor = onPrimary ? colors.onPrimary : colors.heading;
  const numberColor = onPrimary ? colors.primaryTile : colors.primary;
  const swooshColor = onPrimary ? colors.onPrimary : colors.primary;
  const accentColor = onPrimary ? colors.primaryTile : colors.heading;

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Bhau999"
    >
      <Image
        source={MARK}
        style={{ width: size, height: size, marginRight: 6 * s }}
        resizeMode="contain"
      />
      <View>
        <Text
          style={[styles.text, { fontSize: 30 * s, letterSpacing: 0.5 * s }]}
          allowFontScaling={false}
        >
          <Text style={{ color: nameColor }}>BHAU</Text>
          <Text style={{ color: numberColor }}>999</Text>
        </Text>
        <Svg
          width={150 * s}
          height={12 * s}
          viewBox="0 0 150 12"
          style={{ marginTop: -2 * s, marginLeft: -8 * s }}
        >
          <Path
            d="M2 10 C45 2 100 0 148 3"
            stroke={swooshColor}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M14 11.5 C55 6 105 4 140 6"
            stroke={accentColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
};

export default BrandLogo;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '900',
    fontStyle: 'italic',
    includeFontPadding: false,
  },
});
