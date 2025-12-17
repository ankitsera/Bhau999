// screens/SubGames/DoublePana.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import BottomBetBar from '../../components/games/BottomBetBar';

import GameTypePicker from '../../components/games/GameTypePicker';
import GameDateTypeRow from '../../components/games/GameDateTypeRow';

import EasyModeTable from '../../components/games/EasyModeTable';
import SpecialModeGrid from '../../components/games/SpecialModeGrid';

import {
  ALL_DOUBLE_PANA,
  DOUBLE_PANA_BY_RESULT_DIGIT,
  getDoublePanaSuggestions,
} from '../../data/doublePanaMap';

const GREEN = '#3FA16C';
const BLACK = '#000';

const GROUP_KEYS = Object.keys(DOUBLE_PANA_BY_RESULT_DIGIT).sort(
  (a, b) => Number(a) - Number(b),
);

const DoublePana = ({ route }) => {
  const gameId = route?.params?.gameId;
  const gameName = route?.params?.gameName || 'GAME';

  const allowedTypes = ['OPEN', 'CLOSE']; // replace later
  const balance = 0; // replace later

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
  const [easyPana, setEasyPana] = useState('');
  const [easyPoints, setEasyPoints] = useState('');
  const [easyBets, setEasyBets] = useState([]); // { id, pana, points, type }

  // Special mode
  const [specialPointsByPana, setSpecialPointsByPana] = useState(() =>
    ALL_DOUBLE_PANA.reduce((acc, p) => {
      acc[p] = '';
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
    ALL_DOUBLE_PANA.forEach(pana => {
      const p = Number(specialPointsByPana[pana] || 0);
      if (p > 0) {
        bids += 1;
        points += p;
      }
    });
    return { bids, points };
  }, [specialPointsByPana]);

  const activeTotals = mode === 'EASY' ? easyTotals : specialTotals;

  // -------- HANDLERS --------
  const handleAddEasyBet = () => {
    const clean = String(easyPana || '').replace(/[^0-9]/g, '');

    if (clean.length !== 3) {
      Alert.alert('Validation', 'Double Pana must be a 3-digit number.');
      return;
    }

    const pts = Number(easyPoints);
    if (!pts || pts <= 0) {
      Alert.alert('Validation', 'Please enter a valid point amount.');
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      pana: clean,
      points: pts,
      type: selectedType.toLowerCase(),
    };

    setEasyBets(prev => [...prev, newBet]);
    setEasyPana('');
    setEasyPoints('');
  };

  const handleDeleteEasyBet = id => {
    setEasyBets(prev => prev.filter(b => b.id !== id));
  };

  const handleChangeSpecialPoint = (pana, value) => {
    setSpecialPointsByPana(prev => ({
      ...prev,
      [pana]: value,
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
        subGame: 'DOUBLE_PANA',
        mode: 'EASY',
        type: selectedType,
        bets: easyBets.map(b => ({
          pana: b.pana,
          points: b.points,
          type: b.type,
        })),
      };
    } else {
      const bets = [];
      ALL_DOUBLE_PANA.forEach(pana => {
        const p = Number(specialPointsByPana[pana] || 0);
        if (p > 0) {
          bets.push({
            pana,
            points: p,
            type: selectedType.toLowerCase(),
          });
        }
      });

      payload = {
        gameId,
        subGame: 'DOUBLE_PANA',
        mode: 'SPECIAL',
        type: selectedType,
        bets,
      };
    }

    try {
      console.log('Submitting Double Pana payload:', payload);
      Alert.alert('Success', 'Bets submitted (mock).');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - DOUBLE PANA`} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

            {/* EASY: dropdown */}
            {mode === 'EASY' && (
              <GameTypePicker
                label="Select Game Type:"
                value={selectedType}
                options={allowedTypes}
                onChange={setSelectedType}
                containerStyle={{ marginBottom: 12 }}
              />
            )}

            {/* SPECIAL: date + dropdown */}
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
                <DoublePanaEasyForm
                  pana={easyPana}
                  onChangePana={setEasyPana}
                  points={easyPoints}
                  onChangePoints={setEasyPoints}
                  onPressAdd={handleAddEasyBet}
                />

                <EasyModeTable
                  bets={easyBets.map(b => ({
                    id: b.id,
                    digit: b.pana,
                    points: b.points,
                    type: b.type,
                  }))}
                  onDelete={handleDeleteEasyBet}
                  digitHeaderLabel="Pana"
                />
              </>
            ) : (
              <>
                {/* grouped list like screenshot */}
                <View style={styles.groupsWrapper}>
                  {GROUP_KEYS.map(key => {
                    const panas = DOUBLE_PANA_BY_RESULT_DIGIT[key] || [];
                    return (
                      <View key={key} style={styles.groupSection}>
                        <View style={styles.groupHeaderPill}>
                          <Text style={styles.groupHeaderText}>{key}</Text>
                        </View>

                        <SpecialModeGrid
                          digits={panas.map(String)}
                          pointsByDigit={specialPointsByPana}
                          onChangePoint={handleChangeSpecialPoint}
                        />
                      </View>
                    );
                  })}
                </View>

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

        {/* Bottom bar only for EASY */}
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

export default DoublePana;

// ---------- inline easy form with suggestions ----------
const DoublePanaEasyForm = ({
  pana,
  onChangePana,
  points,
  onChangePoints,
  onPressAdd,
}) => {
  const suggestions = useMemo(() => getDoublePanaSuggestions(pana), [pana]);

  return (
    <View style={formStyles.container}>
      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Double Pana:</Text>

        <View style={formStyles.inputWrapper}>
          <TextInput
            style={formStyles.input}
            keyboardType="number-pad"
            maxLength={3}
            value={pana}
            onChangeText={onChangePana}
            placeholder="Pana"
          />

          {suggestions.length > 0 && pana.length > 0 && pana.length < 3 && (
            <View style={formStyles.dropdown}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {suggestions.map(val => (
                  <TouchableOpacity
                    key={val}
                    style={formStyles.item}
                    onPress={() => onChangePana(String(val))}
                  >
                    <Text style={formStyles.itemText}>{val}</Text>
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

// ---------- mode button ----------
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

  groupsWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  groupSection: {
    marginBottom: 18,
  },
  groupHeaderPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#002010',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  groupHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  specialSubmitWrapper: {
    marginTop: 8,
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
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    textAlign: 'center',
    writingDirection: 'ltr',
    paddingHorizontal: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    maxHeight: 180,
    zIndex: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    marginTop: 4,
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
