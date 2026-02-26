import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import BottomBetBar from '../../components/games/BottomBetBar';

import GameTypePicker from '../../components/games/GameTypePicker';
import GameDateTypeRow from '../../components/games/GameDateTypeRow';

import EasyModeTable from '../../components/games/EasyModeTable';
import SpecialModeGrid from '../../components/games/SpecialModeGrid';

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';
import { validateAndAlertBetAmount, fetchBetLimits } from '../../utils/BetValidationService';

import { useTheme } from '../../contexts/ThemeContext';

const BLACK = '#000';
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const SingleDigit = ({ route }) => {
  const { colors } = useTheme();

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

  // -------- STATE --------
  const [mode, setMode] = useState('EASY'); // "EASY" | "SPECIAL"
  const [selectedType, setSelectedType] = useState('OPEN');
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  const { pickerOptions, showClosedModal, closeClosedModal, guard } =
    useBettingGuard({
      gameName,
      selectedType,
      setSelectedType,
    });

  const [easyDigit, setEasyDigit] = useState('');
  const [easyPoints, setEasyPoints] = useState('');
  const [easyBets, setEasyBets] = useState([]);

  const [specialPointsByDigit, setSpecialPointsByDigit] = useState(() =>
    DIGITS.reduce((acc, d) => {
      acc[d] = '';
      return acc;
    }, {}),
  );

  // -------- TOTALS --------
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
    DIGITS.forEach(d => {
      const p = Number(specialPointsByDigit[d] || 0);
      if (p > 0) {
        bids += 1;
        points += p;
      }
    });
    return { bids, points };
  }, [specialPointsByDigit]);

  const activeTotals = mode === 'EASY' ? easyTotals : specialTotals;

  // -------- HANDLERS --------
  const handleAddEasyBet = () => {
    if (!easyDigit || easyDigit.trim() === '') {
      Alert.alert('Validation', 'Please enter a single digit.');
      return;
    }

    const digitNum = Number(easyDigit);
    if (Number.isNaN(digitNum) || digitNum < 0 || digitNum > 9) {
      Alert.alert('Validation', 'Digit must be between 0 and 9.');
      return;
    }

    const pts = Number(easyPoints);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount)) {
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      digit: digitNum.toString(),
      points: pts,
      type: selectedType.toLowerCase(),
    };

    setEasyBets(prev => [...prev, newBet]);
    setEasyDigit('');
    setEasyPoints('');
  };

  const handleDeleteEasyBet = id => {
    setEasyBets(prev => prev.filter(b => b.id !== id));
  };

  const handleChangeSpecialPoint = (digit, value) => {
    setSpecialPointsByDigit(prev => ({
      ...prev,
      [digit]: value,
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
          type: 'Single Digit',
          openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(), // OPEN/CLOSE
          amount: Number(b.points) || 0,
          betValue: String(b.digit),
        }),
      );
    } else {
      const list = [];

      for (let i = 0; i < DIGITS.length; i++) {
        const d = DIGITS[i];
        const raw = String(specialPointsByDigit[d] || '').trim();

        if (!raw) continue; // empty => ignore

        const p = Number(raw);

        // typed something but invalid
        if (!Number.isFinite(p) || p <= 0) {
          Alert.alert('Validation', `Invalid points for Digit ${d}.`);
          return; // stop all (no API call)
        }

        // min/max check (all-or-nothing)
        if (p < minAmount || p > maxAmount) {
          Alert.alert(
            'Validation',
            `Points for Digit ${d} must be between ${minAmount} and ${maxAmount}.`,
          );
          return; // stop all (no API call)
        }

        list.push({ digit: d, points: p });
      }

      betsToSend = list.map(x =>
        makeBet({
          mobileNumber,
          gameName,
          type: 'Single Digit',
          openClose: String(selectedType).toUpperCase(), // OPEN/CLOSE
          amount: Number(x.points) || 0,
          betValue: String(x.digit),
        }),
      );
    }

    try {
      await placeBets(betsToSend);
      Alert.alert('Success', 'Bets placed successfully!');

      // Update balance safely
      const spent = Number(points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      // reset
      setEasyBets([]);
      setEasyDigit('');
      setEasyPoints('');
      setSpecialPointsByDigit(
        DIGITS.reduce((acc, d) => {
          acc[d] = '';
          return acc;
        }, {}),
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err?.message || 'Failed to place bets.');
    }
  };

  // -------- RENDER --------
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - SINGLE DIGIT`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          {/* Mode toggle */}
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

          {/* EASY MODE: label + dropdown */}
          {mode === 'EASY' && (
            <GameTypePicker
              label="Select Game Type:"
              value={selectedType}
              options={pickerOptions}
              onChange={setSelectedType}
              containerStyle={{ marginBottom: 12 }}
            />
          )}

          {/* SPECIAL MODE: date + dropdown row */}
          {mode === 'SPECIAL' && (
            <GameDateTypeRow
              dateLabel={todayLabel}
              gameTypeValue={selectedType}
              gameTypeOptions={pickerOptions}
              onChangeGameType={setSelectedType}
            />
          )}

          {mode === 'EASY' ? (
            <>
              <SingleDigitEasyForm
                digit={easyDigit}
                onChangeDigit={setEasyDigit}
                points={easyPoints}
                onChangePoints={setEasyPoints}
                onPressAdd={() => {
                  Keyboard.dismiss();
                  handleAddEasyBet();
                }}
                colors={colors}
              />

              <View style={styles.tableArea}>
                <EasyModeTable bets={easyBets} onDelete={handleDeleteEasyBet} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.specialArea}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled
                  contentContainerStyle={styles.specialScrollContent}
                >
                  <SpecialModeGrid
                    digits={DIGITS}
                    pointsByDigit={specialPointsByDigit}
                    onChangePoint={handleChangeSpecialPoint}
                  />
                </ScrollView>
              </View>

              <View style={styles.specialSubmitWrapper}>
                <TouchableOpacity
                  style={[styles.specialSubmitButton, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.specialSubmitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Bottom bar ONLY for Easy mode */}
        {mode === 'EASY' && (
          <BottomBetBar
            bids={activeTotals.bids}
            points={activeTotals.points}
            onSubmit={handleSubmit}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default SingleDigit;

/* ----------------- inline easy form (same styling you want) ----------------- */
const SingleDigitEasyForm = ({
  digit,
  onChangeDigit,
  points,
  onChangePoints,
  onPressAdd,
  colors,
}) => {
  return (
    <View style={formStyles.container}>
      <View style={formStyles.pointInputRow}>
        <Text style={[formStyles.label, { color: colors.text }]}>Enter Single Digit:</Text>
        <TextInput
          style={[formStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={onChangeDigit}
          placeholder="Ank"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={formStyles.pointInputRow}>
        <Text style={[formStyles.label, { color: colors.text }]}>Enter Points:</Text>
        <TextInput
          style={[formStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          keyboardType="number-pad"
          value={points}
          onChangeText={onChangePoints}
          placeholder="Point"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <TouchableOpacity
        style={[formStyles.addButton, { backgroundColor: colors.primary }]}
        onPress={onPressAdd}
        activeOpacity={0.85}
      >
        <Text style={formStyles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    fontSize: 15,
    fontWeight: '700',
  },
});

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

  specialSubmitWrapper: {
    marginTop: 24,
    marginBottom: 8,
  },
  specialSubmitButton: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  specialSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

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
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '700',
  },
});