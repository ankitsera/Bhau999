// screens/SubGames/SingleDigit.jsx
import React, { useMemo, useState } from 'react';
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

const GREEN = '#3FA16C';
const BLACK = '#000';
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const SingleDigit = ({ route }) => {
  const gameId = route?.params?.gameId;
  const gameName = route?.params?.gameName || 'GAME';

  const allowedTypes = ['OPEN', 'CLOSE']; // temp
  const balance = 0; // temp

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  // -------- STATE --------
  const [mode, setMode] = useState('EASY'); // "EASY" | "SPECIAL"
  const [selectedType, setSelectedType] = useState(allowedTypes[0] || 'OPEN');

  // Easy mode
  const [easyDigit, setEasyDigit] = useState('');
  const [easyPoints, setEasyPoints] = useState('');
  const [easyBets, setEasyBets] = useState([]); // { id, digit, points, type }

  // Special mode
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
    if (!pts || pts <= 0) {
      Alert.alert('Validation', 'Please enter a valid point amount.');
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
    const { bids, points } = activeTotals;

    if (bids === 0) {
      Alert.alert('No bets', 'Please add at least one bet.');
      return;
    }

    if (points > balance) {
      Alert.alert('Insufficient balance', 'Your wallet balance is too low.');
      return;
    }

    let payload;

    if (mode === 'EASY') {
      payload = {
        gameId,
        subGame: 'SINGLE_DIGIT',
        mode: 'EASY',
        type: selectedType,
        bets: easyBets.map(b => ({
          digit: b.digit,
          points: b.points,
          type: b.type,
        })),
      };
    } else {
      const bets = [];
      DIGITS.forEach(d => {
        const p = Number(specialPointsByDigit[d] || 0);
        if (p > 0) {
          bets.push({
            digit: d,
            points: p,
            type: selectedType.toLowerCase(),
          });
        }
      });

      payload = {
        gameId,
        subGame: 'SINGLE_DIGIT',
        mode: 'SPECIAL',
        type: selectedType,
        bets,
      };
    }

    try {
      console.log('Submitting payload:', payload);
      Alert.alert('Success', 'Bets submitted (mock).');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit bets.');
    }
  };

  // -------- RENDER --------
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SINGLE DIGIT`} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* Mode toggle */}
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

            {/* EASY MODE: label + dropdown */}
            {mode === 'EASY' && (
              <GameTypePicker
                label="Select Game Type:"
                value={selectedType}
                options={allowedTypes}
                onChange={setSelectedType}
                containerStyle={{ marginBottom: 12 }}
              />
            )}

            {/* SPECIAL MODE: date + dropdown row */}
            {mode === 'SPECIAL' && (
              <GameDateTypeRow
                dateLabel={todayLabel}
                gameTypeValue={selectedType}
                gameTypeOptions={allowedTypes}
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
                    Keyboard.dismiss(); // fixes “need to tap twice” vibe
                    handleAddEasyBet();
                  }}
                />

                <EasyModeTable bets={easyBets} onDelete={handleDeleteEasyBet} />
              </>
            ) : (
              <>
                <SpecialModeGrid
                  digits={DIGITS}
                  pointsByDigit={specialPointsByDigit}
                  onChangePoint={handleChangeSpecialPoint}
                />

                <View style={styles.specialSubmitWrapper}>
                  <TouchableOpacity
                    style={styles.specialSubmitButton}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.specialSubmitText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
}) => {
  return (
    <View style={formStyles.container}>
      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Single Digit:</Text>
        <TextInput
          style={formStyles.input}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={onChangeDigit}
          placeholder="Ank"
        />
      </View>

      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Points:</Text>
        <TextInput
          style={formStyles.input}
          keyboardType="number-pad"
          value={points}
          onChangeText={onChangePoints}
          placeholder="Point"
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

/* ----------------- small UI bits ----------------- */
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

/* ----------------- styles ----------------- */
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  specialSubmitWrapper: {
    marginTop: 24,
    marginBottom: 8,
  },
  specialSubmitButton: {
    backgroundColor: GREEN,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
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
  addButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
