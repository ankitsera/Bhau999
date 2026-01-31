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

const GREEN = '#3FA16C';
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
  const gameName = route?.params?.gameName || 'GAME';

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
      Alert.alert('Validation', 'Please enter a valid 2-digit Jodi.');
      return;
    }

    const pts = Number(easyPoints);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount)) {
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
      Alert.alert('No bets', 'Please add at least one bet.');
      return;
    }

    if (!mobileNumber) {
      Alert.alert('Login required', 'Mobile number missing. Please login again.');
      return;
    }

    if (points > balance) {
      Alert.alert('Insufficient balance', 'Your wallet balance is too low.');
      return;
    }

    let betsToSend = [];

    if (mode === 'EASY') {
      betsToSend = easyBets.map(b =>
        makeBet({
          mobileNumber,
          gameName,
          type: 'JODI',
          openClose: 'CLOSE',
          amount: Number(b.points) || 0,
          betValue: b.digit,
        }),
      );
    } else {
      const list = [];
      JODI_NUMBERS.forEach(n => {
        const p = Number(specialPointsByJodi[n] || 0);
        if (p > 0) list.push({ jodi: n, points: p });
      });

      betsToSend = list.map(x =>
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
      Alert.alert('Success', 'Bets placed successfully!');

      // Update balance safely
      const spent = Number(activeTotals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      // clear placed bets
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
      Alert.alert('Error', e?.message || 'Failed to place bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - JODI`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          {/* mode toggle */}
          <View style={styles.modeRow}>
            <ModeButton
              label="EASY MODE"
              active={mode === 'EASY'}
              onPress={() => setMode('EASY')}
            />
            <ModeButton
              label="SPECIAL MODE"
              active={mode === 'SPECIAL'}
              onPress={() => setMode('SPECIAL')}
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
                  Keyboard.dismiss(); // fixes “tap twice to Add”
                  handleAddEasyBet();
                }}
              />

              <View style={styles.tableArea}>
                <EasyModeTable
                  bets={easyBets}
                  onDelete={handleDeleteEasyBet}
                  digitHeaderLabel="Jodi"
                />
              </View>
            </>
          )}

          {mode === 'SPECIAL' && (
            <>
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
            </>
          )}
        </View>

        {/* bottom bar only in easy mode */}
        {mode === 'EASY' ? (
          <BottomBetBar
            bids={activeTotals.bids}
            points={activeTotals.points}
            onSubmit={handleSubmit}
          />
        ) : (
          <View style={styles.specialBottom}>
            <TouchableOpacity
              style={styles.specialSubmitButton}
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
}) => {
  const suggestions = useMemo(() => {
    const clean = String(jodi || '').replace(/[^0-9]/g, '');
    if (clean.length !== 1) return [];
    return FIRST_DIGIT_MAP[clean] || [];
  }, [jodi]);

  return (
    <View style={formStyles.container}>
      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Jodi Digit:</Text>

        <View style={formStyles.inputWrapper}>
          <TextInput
            style={formStyles.input}
            keyboardType="number-pad"
            maxLength={2}
            value={jodi}
            onChangeText={onChangeJodi}
            placeholder="Jodi"
            placeholderTextColor="#999"
          />

          {suggestions.length > 0 && (
            <View style={formStyles.suggestionBox}>
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
                    <Text style={formStyles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Points:</Text>
        <TextInput
          style={formStyles.input}
          keyboardType="number-pad"
          value={points}
          onChangeText={onChangePoints}
          placeholder="Point"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={formStyles.addButton}
        onPress={onPressAdd}
        activeOpacity={0.85}
      >
        <Text style={formStyles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ----------------- mode button ----------------- */

const ModeButton = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[modeStyles.button, { backgroundColor: active ? BLACK : GREEN }]}
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
    fontSize: 15,
    fontWeight: '700',
  },
});

/* ----------------- screen styles ----------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
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
    borderTopColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
  },
  specialSubmitButton: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  specialSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

/* ----------------- form styles (matches your SingleDigit EasyModeForm) ----------------- */

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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  inputWrapper: {
    width: 180,
    position: 'relative',
  },

  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },

  suggestionBox: {
    position: 'absolute',
    top: 44 + 4,
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
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
    fontSize: 14,
    color: '#333',
  },

  addButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180,
    alignSelf: 'flex-end',
  },
  addText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});