// screens/SubGames/DoublePanaBulk.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import BottomBetBar from '../../components/games/BottomBetBar';
import GameTypePicker from '../../components/games/GameTypePicker';
import EasyModeTable from '../../components/games/EasyModeTable';

import { DOUBLE_PANA_BY_RESULT_DIGIT } from '../../data/doublePanaMap';

const GREEN = '#3FA16C';
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']; // increasing order

const DoublePanaBulk = ({ route }) => {
  const gameId = route?.params?.gameId;
  const gameName = route?.params?.gameName || 'GAME';

  const allowedTypes = ['OPEN', 'CLOSE']; // replace later
  const balance = 0; // replace later

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || 'OPEN');

  const [points, setPoints] = useState('');
  const [pointsError, setPointsError] = useState(false);

  const [bets, setBets] = useState([]); // { id, pana, points, type }

  const { bids, totalPoints } = useMemo(() => {
    const b = bets.length;
    const p = bets.reduce((sum, x) => sum + (Number(x.points) || 0), 0);
    return { bids: b, totalPoints: p };
  }, [bets]);

  const isPointsValid = () => {
    const val = Number(points);
    return !!val && val > 0;
  };

  const handlePointsChange = text => {
    const clean = text.replace(/[^0-9]/g, '');
    setPoints(clean);
    if (pointsError && clean) setPointsError(false);
  };

  const addBetsForDigit = digitKey => {
    if (!isPointsValid()) {
      setPointsError(true);
      return;
    }

    const panaList = DOUBLE_PANA_BY_RESULT_DIGIT[digitKey] || [];
    if (panaList.length === 0) return;

    const pts = Number(points);
    const typeLower = selectedType.toLowerCase();

    const newBets = panaList.map(pana => ({
      id: `${digitKey}-${pana}-${Date.now()}-${Math.random()}`,
      pana: String(pana),
      points: pts,
      type: typeLower,
    }));

    setBets(prev => [...prev, ...newBets]);
  };

  const handleDeleteBet = id => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async () => {
    if (bids === 0) {
      Alert.alert('No bets', 'Please add at least one bet.');
      return;
    }

    if (totalPoints > balance) {
      Alert.alert('Insufficient balance', 'Your wallet balance is too low.');
      return;
    }

    const payload = {
      gameId,
      subGame: 'DOUBLE_PANA_BULK',
      type: selectedType,
      bets: bets.map(b => ({
        pana: b.pana,
        points: b.points,
        type: b.type,
      })),
    };

    try {
      console.log('Submitting Double Pana Bulk payload:', payload);
      Alert.alert('Success', 'Bets submitted (mock).');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - DOUBLE PANA BULK`} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <GameTypePicker
              label="Select Game Type:"
              value={selectedType}
              options={allowedTypes}
              onChange={setSelectedType}
              containerStyle={{ marginBottom: 12 }}
            />

            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Points:</Text>
              <TextInput
                style={[styles.input, pointsError && styles.errorInput]}
                keyboardType="number-pad"
                value={points}
                onChangeText={handlePointsChange}
                placeholder="Point"
              />
            </View>

            <View style={styles.grid}>
              {DIGITS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitTile}
                  activeOpacity={0.85}
                  onPress={() => addBetsForDigit(d)}
                >
                  <Text style={styles.digitText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <EasyModeTable
              bets={bets.map(b => ({
                id: b.id,
                digit: b.pana,
                points: b.points,
                type: b.type,
              }))}
              onDelete={handleDeleteBet}
              digitHeaderLabel="Pana"
            />
          </ScrollView>
        </View>

        <BottomBetBar
          bids={bids}
          points={totalPoints}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default DoublePanaBulk;

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
  pointInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    writingDirection: 'ltr',
    paddingHorizontal: 8,
  },
  errorInput: {
    borderColor: '#FF4D4F',
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  digitTile: {
    width: '18%',
    aspectRatio: 1.3,
    backgroundColor: GREEN,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  digitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
