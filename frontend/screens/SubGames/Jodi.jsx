// screens/SubGames/Jodi.jsx
import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import BottomBetBar from '../../components/games/BottomBetBar';
import GameDateTypeRow from '../../components/games/GameDateTypeRow';

import EasyModeTable from '../../components/games/EasyModeTable';
import SpecialModeGrid from '../../components/games/SpecialModeGrid';

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';
import { validateAndAlertBetAmount, fetchBetLimits } from '../../utils/BetValidationService';

import { useTheme } from '../../contexts/ThemeContext';
import { FONT } from '../../contexts/Themes';

const BLACK = '#000';

// 00..99 once
const JODI_NUMBERS = Array.from({ length: 100 }, (_, i) =>
  i.toString().padStart(2, '0'),
);

// firstDigit -> ["d0","d1"...]
const FIRST_DIGIT_MAP = Array.from({ length: 10 }, (_, d) => {
  const key = String(d);
  const values = Array.from({ length: 10 }, (_, i) => `${d}${i}`);
  return [key, values];
}).reduce((acc, [k, v]) => {
  acc[k] = v;
  return acc;
}, {});

const Jodi = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || t('games:defaultGameName');

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [mode, setMode] = useState('EASY'); // EASY | SPECIAL
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  const { showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
  });

  // easy mode
  const [jodiDigit, setJodiDigit] = useState('');
  const [easyPoints, setEasyPoints] = useState('');
  const [easyBets, setEasyBets] = useState([]); // {id, digit, points, type}

  // special mode
  const [specialPointsByJodi, setSpecialPointsByJodi] = useState(() =>
    JODI_NUMBERS.reduce((acc, n) => {
      acc[n] = '';
      return acc;
    }, {}),
  );

  // totals
  const easyTotals = useMemo(() => {
    const bids = easyBets.length;
    const points = easyBets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points };
  }, [easyBets]);

  const specialTotals = useMemo(() => {
    let bids = 0;
    let points = 0;
    JODI_NUMBERS.forEach(n => {
      const p = Number(specialPointsByJodi[n] || 0);
      if (p > 0) {
        bids += 1;
        points += p;
      }
    });
    return { bids, points };
  }, [specialPointsByJodi]);

  const activeTotals = mode === 'EASY' ? easyTotals : specialTotals;

  // handlers
  const handleAddEasyBet = () => {
    const clean = String(jodiDigit || '').replace(/[^0-9]/g, '');

    if (!/^\d{2}$/.test(clean)) {
      Alert.alert(t('validation:validation'), t('validation:pleaseEnterValidJodi'));
      return;
    }

    const pts = Number(easyPoints);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      digit: clean,
      points: pts,
      type: 'CLOSE',
    };

    setEasyBets(prev => [...prev, newBet]);
    setJodiDigit('');
    setEasyPoints('');
  };

  const handleDeleteEasyBet = id => {
    setEasyBets(prev => prev.filter(b => b.id !== id));
  };

  const handleChangeSpecialPoint = (jodi, value) => {
    setSpecialPointsByJodi(prev => ({
      ...prev,
      [jodi]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    const { bids, points } = activeTotals;

    if (bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseAddBet'));
      return;
    }

    if (!mobileNumber) {
      Alert.alert(t('validation:loginRequired'), t('validation:mobileNumberMissing'));
      return;
    }

    if (points > balance) {
      Alert.alert(t('validation:insufficientBalance'), t('validation:walletBalanceTooLow'));
      return;
    }

    let betsToSend = [];

    if (mode === 'EASY') {
      betsToSend = easyBets.map(b =>
        makeBet({
          mobileNumber,
          gameName,
          type: 'Jodi',
          openClose: 'CLOSE',
          amount: Number(b.points) || 0,
          betValue: b.digit,
        }),
      );
    } else {
      const list = [];

      for (let i = 0; i < JODI_NUMBERS.length; i++) {
        const n = JODI_NUMBERS[i];
        const raw = String(specialPointsByJodi[n] || "").trim();

        if (!raw) continue;

        const p = Number(raw);

        if (!Number.isFinite(p) || p <= 0) {
          Alert.alert(t('validation:validation'), t('validation:invalidPointsFor', { digit: n }));
          return;
        }

        if (p < minAmount || p > maxAmount) {
          Alert.alert(
            t('validation:validation'),
            t('validation:betAmountMustBeBetween', { digit: n, min: minAmount, max: maxAmount })
          );
          return;
        }

        list.push({ jodi: n, points: p });
      }

      betsToSend = list.map((x) =>
        makeBet({
          mobileNumber,
          gameName,
          type: 'Jodi',
          openClose: 'CLOSE',
          amount: Number(x.points) || 0,
          betValue: x.jodi,
        }),
      );
    }

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      const spent = Number(activeTotals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setEasyBets([]);
      setSpecialPointsByJodi(
        JODI_NUMBERS.reduce((acc, n) => {
          acc[n] = '';
          return acc;
        }, {}),
      );
      setJodiDigit('');
      setEasyPoints('');
    } catch (e) {
      console.error(e);
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - JODI`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          {/* mode toggle */}
          <View style={styles.modeRow}>
            <ModeButton
              label="EASY MODE"
              active={mode === 'EASY'}
              onPress={() => setMode('EASY')}
              primary={colors.primary}
            />
            <ModeButton
              label="SPECIAL MODE"
              active={mode === 'SPECIAL'}
              onPress={() => setMode('SPECIAL')}
              primary={colors.primary}
            />
          </View>

          {mode === 'EASY' && (
            <>
              <JodiEasyForm
                jodi={jodiDigit}
                onChangeJodi={setJodiDigit}
                points={easyPoints}
                onChangePoints={setEasyPoints}
                onPressAdd={() => {
                  Keyboard.dismiss();
                  handleAddEasyBet();
                }}
                colors={colors}
                t={t}
              />

              <View style={styles.tableArea}>
                <EasyModeTable
                  bets={easyBets}
                  onDelete={handleDeleteEasyBet}
                  digitHeaderLabel={t('games:jodi')}
                />
              </View>
            </>
          )}

          {mode === 'SPECIAL' && (
            <View style={styles.specialArea}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                contentContainerStyle={styles.specialScrollContent}
              >
                <SpecialModeGrid
                  digits={JODI_NUMBERS}
                  pointsByDigit={specialPointsByJodi}
                  onChangePoint={handleChangeSpecialPoint}
                />
              </ScrollView>
            </View>
          )}
        </View>

        {mode === 'EASY' ? (
          <BottomBetBar
            bids={activeTotals.bids}
            points={activeTotals.points}
            onSubmit={handleSubmit}
          />
        ) : (
          <View style={[styles.specialBottom, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
            <TouchableOpacity
              style={[styles.specialSubmitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.specialSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Jodi;

/* ----------------- inline easy form ----------------- */

const JodiEasyForm = ({
  jodi,
  onChangeJodi,
  points,
  onChangePoints,
  onPressAdd,
  colors,
  t,
}) => {
  const suggestions = useMemo(() => {
    const clean = String(jodi || '').replace(/[^0-9]/g, '');
    if (clean.length !== 1) return [];
    return FIRST_DIGIT_MAP[clean] || [];
  }, [jodi]);

  return (
    <View style={formStyles.container}>
      <View style={formStyles.pointInputRow}>
        <Text style={[formStyles.label, { color: colors.text }]}>{t('games:enterJodiDigit')}</Text>

        <View style={formStyles.inputWrapper}>
          <TextInput
            style={[formStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            maxLength={2}
            value={jodi}
            onChangeText={onChangeJodi}
            placeholder={t('games:jodi')}
            placeholderTextColor={colors.textTertiary}
          />

          {suggestions.length > 0 && (
            <View style={[formStyles.suggestionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <ScrollView
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {suggestions.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={formStyles.suggestionItem}
                    onPress={() => onChangeJodi(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[formStyles.suggestionText, { color: colors.text }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={formStyles.pointInputRow}>
        <Text style={[formStyles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
        <TextInput
          style={[formStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          keyboardType="number-pad"
          value={points}
          onChangeText={onChangePoints}
          placeholder={t('games:point')}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <TouchableOpacity
        style={[formStyles.addButton, { backgroundColor: colors.primary }]}
        onPress={onPressAdd}
        activeOpacity={0.85}
      >
        <Text style={formStyles.addText}>{t('common:add')}</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ----------------- mode button ----------------- */

const ModeButton = ({ label, active, onPress, primary }) => (
  <TouchableOpacity
    style={[modeStyles.button, { backgroundColor: active ? BLACK : primary }]}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <Text style={modeStyles.text}>{label}</Text>
  </TouchableOpacity>
);

const modeStyles = StyleSheet.create({
  button: {
    flex: 1,
    height: 46,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FONT.label,
    fontWeight: '700',
  },
});

/* ----------------- screen styles ----------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },

  specialArea: {
    flex: 1,
    paddingBottom: 10,
  },
  specialScrollContent: {
    paddingBottom: 12,
  },

  specialBottom: {
    height: 64,
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  specialSubmitButton: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  specialSubmitText: {
    color: '#FFFFFF',
    fontSize: FONT.body,
    fontWeight: '700',
  },
});

/* ----------------- form styles ----------------- */

const formStyles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  pointInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FONT.body,
    fontWeight: '500',
  },

  inputWrapper: {
    width: 150,
    position: 'relative',
  },

  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: FONT.body,
    marginBottom: 12,
    textAlign: 'center',
  },

  suggestionBox: {
    position: 'absolute',
    top: 44 + 4,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 160,
    zIndex: 50,
    elevation: 8,
    overflow: 'hidden',
  },

  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestionText: {
    fontSize: FONT.label,
  },

  addButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180,
    alignSelf: 'flex-end',
  },
  addText: {
    color: '#FFF',
    fontSize: FONT.body,
    fontWeight: '700',
  },
});
