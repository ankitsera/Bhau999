import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { ThemeColor } from '../../contexts/Themes';

const GREEN = ThemeColor;
const CARD_BORDER = '#D9D9D9';

const LuckyGamesCard = ({
  timeLabel,
  statusLabel,
  statusColor,
  resultLabel,
  canPlay,
  onPressPlay,
}) => {
  const { t } = useTranslation(['games']);
  const playColor = canPlay ? GREEN : '#9E9E9E';

  return (
    <View style={styles.card}>
      {/* left */}
      <View style={styles.leftCol}>
        <Text style={styles.timeText}>{timeLabel}</Text>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusLabel}
        </Text>
      </View>

      {/* middle pill */}
      <View style={styles.resultPill}>
        <Text style={styles.resultText}>{resultLabel}</Text>
      </View>

      {/* right play */}
      <TouchableOpacity
        style={styles.playBtn}
        onPress={onPressPlay}
        activeOpacity={0.85}
      >
        <View style={[styles.playIconCircle, { borderColor: playColor }]}>
          <MaterialCommunityIcons name="play" size={18} color={playColor} />
        </View>
        <Text style={styles.playText}>{t('games:playGame')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LuckyGamesCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftCol: {
    width: 110,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  statusText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },

  resultPill: {
    height: 42,
    minWidth: 90,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  resultText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: CARD_BORDER,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  playIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
});
