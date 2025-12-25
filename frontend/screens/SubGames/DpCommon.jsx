// screens/SubGames/DpCommon.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import GameTypePicker from '../../components/games/GameTypePicker';
import EasyModeTable from '../../components/games/EasyModeTable';
import BottomBetBar from '../../components/games/BottomBetBar';

import { getDoublePanaCommonDigitPanas } from '../../data/doublePanaMap';

const GREEN = '#3FA16C';

const ROW1 = ['1', '2', '3', '4', '5'];
const ROW2 = ['6', '7', '8', '9', '0'];

const DpCommon = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.gameName || 'GAME';

  const allowedTypes = ['OPEN', 'CLOSE']; // later from context
  const balance = 0; // later from wallet

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || 'OPEN');
  const [points, setPoints] = useState('');
  const [pointsError, setPointsError] = useState(false);

  const [bets, setBets] = useState([]);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const handleDelete = id => setBets(prev => prev.filter(b => b.id !== id));

  const addCommonForDigit = digit => {
    const pts = Number(points);

    if (!pts || pts <= 0) {
      setPointsError(true);
      return;
    }
    setPointsError(false);

    const panas = getDoublePanaCommonDigitPanas(digit);
    if (!panas.length) return;

    setBets(prev => {
      const existing = new Set(prev.map(b => b.digit));
      const stamp = Date.now().toString();

      const toAdd = panas
        .filter(p => !existing.has(p))
        .map((p, idx) => ({
          id: `${p}-${stamp}-${idx}`,
          digit: p,
          points: pts,
          type: selectedType.toLowerCase(),
        }));

      return [...prev, ...toAdd];
    });
  };

  const handleSubmit = async () => {
    if (totals.bids === 0) {
      Alert.alert('No bets', 'Please add at least one pana.');
      return;
    }

    if (totals.points > balance) {
      Alert.alert('Insufficient balance', 'Your wallet balance is too low.');
      return;
    }

    const payload = {
      gameId,
      subGame: 'DP_COMMON',
      mode: 'EASY',
      type: selectedType,
      bets: bets.map(b => ({
        pana: b.digit,
        points: b.points,
        type: b.type,
      })),
    };

    try {
      console.log('Submitting DP Common payload:', payload);
      Alert.alert('Success', 'Bets submitted (mock).');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - DP COMMON`} />

        <View style={styles.content}>
          <GameTypePicker
            label="Select Game Type:"
            value={selectedType}
            options={allowedTypes}
            onChange={setSelectedType}
            containerStyle={{ marginBottom: 12 }}
          />

          <View style={styles.row}>
            <Text style={styles.label}>Enter Points:</Text>
            <TextInput
              style={[
                styles.input,
                pointsError
                  ? { borderColor: '#E53935', borderWidth: 2 }
                  : null,
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={v => {
                setPoints(v);
                if (pointsError) setPointsError(false);
              }}
              placeholder="Point"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.pad}>
            <View style={styles.padRow}>
              {ROW1.map(d => (
                <DigitBtn
                  key={d}
                  digit={d}
                  onPress={() => addCommonForDigit(d)}
                />
              ))}
            </View>
            <View style={styles.padRow}>
              {ROW2.map(d => (
                <DigitBtn
                  key={d}
                  digit={d}
                  onPress={() => addCommonForDigit(d)}
                />
              ))}
            </View>
          </View>

          {/* Table area (flex:1 so EasyModeTable can scroll internally) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel="Pana"
            />
          </View>
        </View>

        <BottomBetBar
          bids={totals.bids}
          points={totals.points}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default DpCommon;

const DigitBtn = ({ digit, onPress }) => (
  <TouchableOpacity
    style={styles.digitBtn}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <Text style={styles.digitText}>{digit}</Text>
  </TouchableOpacity>
);

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

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    color: '#111',
  },

  pad: {
    marginTop: 8,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  digitBtn: {
    flex: 1,
    height: 52,
    marginHorizontal: 6,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});