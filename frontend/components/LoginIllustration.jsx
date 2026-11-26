import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

// Cropped to the drawing's bounds so it fills its box.
const VIEW_X = 34;
const VIEW_Y = 14;
const VIEW_W = 252;
const VIEW_H = 240;

// Phone with a sign-in card, a lock shield and a plant.
const LoginIllustration = ({ style }) => {
  const { colors, isDarkMode } = useTheme();

  const palette = {
    blob: colors.primaryIconBg,
    ground: isDarkMode ? '#242424' : '#E9ECEF',
    frame: '#5B6B7F',
    screen: isDarkMode ? '#1F2329' : '#FFFFFF',
    line: isDarkMode ? '#3A4048' : '#E6EBF0',
    avatarBg: isDarkMode ? '#24364A' : '#DCEBFA',
    avatar: '#2F80ED',
    pot: isDarkMode ? '#2A2F36' : '#FFFFFF',
    potEdge: isDarkMode ? '#3A4048' : '#E1E5EA',
    shieldOuter: '#F2A93B',
    shieldInner: '#FFD36E',
  };

  return (
    <View style={[styles.wrap, style]}>
      <Svg width="100%" height="100%" viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}>
        {/* Backdrop */}
        <Circle cx="165" cy="125" r="105" fill={palette.blob} />
        <Ellipse cx="160" cy="244" rx="122" ry="7" fill={palette.ground} />

        {/* Floating dots */}
        <Circle cx="92" cy="52" r="4" fill={palette.shieldOuter} opacity="0.7" />
        <Circle cx="268" cy="58" r="5" fill={colors.primary} opacity="0.45" />
        <Circle cx="276" cy="196" r="3" fill={palette.avatar} opacity="0.5" />
        <Circle cx="54" cy="104" r="3" fill={colors.primary} opacity="0.5" />

        {/* Phone */}
        <Rect x="110" y="20" width="112" height="214" rx="18" fill={palette.frame} />
        <Rect x="117" y="30" width="98" height="194" rx="12" fill={palette.screen} />
        <Rect x="148" y="34" width="36" height="5" rx="2.5" fill={palette.frame} />
        <Circle cx="166" cy="212" r="5" fill={palette.frame} opacity="0.35" />

        {/* Profile avatar */}
        <Circle cx="166" cy="78" r="20" fill={palette.avatarBg} />
        <Circle cx="166" cy="72" r="7" fill={palette.avatar} />
        <Path
          d="M154 92 C154 84 159 81 166 81 C173 81 178 84 178 92 Z"
          fill={palette.avatar}
        />

        {/* Input lines */}
        <Rect x="130" y="112" width="72" height="9" rx="4.5" fill={palette.line} />
        <Rect x="130" y="128" width="72" height="9" rx="4.5" fill={palette.line} />

        {/* Log In pill */}
        <Rect x="136" y="150" width="60" height="18" rx="9" fill={colors.primary} />
        <SvgText
          x="166"
          y="162.5"
          fontSize="9"
          fontWeight="600"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          Log In
        </SvgText>

        {/* Shield with lock */}
        <Path
          d="M236 92 L263 102 V124 C263 142 251 154 236 161 C221 154 209 142 209 124 V102 Z"
          fill={palette.shieldOuter}
        />
        <Path
          d="M236 100 L256 107.5 V124 C256 138 247 147 236 153 C225 147 216 138 216 124 V107.5 Z"
          fill={palette.shieldInner}
        />
        <Path
          d="M231 122 V117 A5 5 0 0 1 241 117 V122"
          stroke={palette.shieldOuter}
          strokeWidth="2.5"
          fill="none"
        />
        <Rect x="228" y="121" width="16" height="13" rx="2.5" fill={palette.shieldOuter} />
        <Circle cx="236" cy="127.5" r="2" fill={palette.shieldInner} />

        {/* Plant */}
        <Path
          d="M72 202 C64 176 52 160 40 152 C56 160 69 178 75 202 Z"
          fill={colors.primaryDark}
        />
        <Path
          d="M73 202 C70 170 70 146 74 122 C79 148 79 172 76 202 Z"
          fill={colors.primary}
        />
        <Path
          d="M74 202 C80 174 92 158 105 150 C95 162 83 180 77 202 Z"
          fill={colors.primaryDark}
        />
        <Path
          d="M72 202 C66 186 58 176 46 172 C58 178 67 188 74 202 Z"
          fill={colors.primary}
          opacity="0.8"
        />
        <Path
          d="M76 202 C82 186 90 178 101 174 C91 182 83 192 78 202 Z"
          fill={colors.primary}
          opacity="0.8"
        />
        <Path
          d="M59 206 L87 206 L82 238 L64 238 Z"
          fill={palette.pot}
          stroke={palette.potEdge}
          strokeWidth="1.5"
        />
        <Rect
          x="55"
          y="199"
          width="36"
          height="9"
          rx="3"
          fill={palette.pot}
          stroke={palette.potEdge}
          strokeWidth="1.5"
        />
      </Svg>
    </View>
  );
};

export default LoginIllustration;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: VIEW_W / VIEW_H,
  },
});
