// screens/SubGames/DoublePanaBulk.jsx
import React, { useMemo, useState, useContext } from 'react';
import {
  View,
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

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';
import { validateAndAlertBetAmount, fetchBetLimits } from '../../utils/BetValidationService';

import { useTheme } from '../../contexts/ThemeContext';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']; // increasing order

const DoublePanaBulk = ({ route }) => {
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || 'GAME';

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const [selectedType, setSelectedType] = useState('OPEN');

  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
  });

  const [points, setPoints] = useState('');
  const [pointsError, setPointsError] = useState(false);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

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
    const pts = Number(points);
    if (!pts || pts <= minAmount - 1 || pts > maxAmount) {
      setPointsError(true);
      return;
    }
    setPointsError(false);

    const panaList = DOUBLE_PANA_BY_RESULT_DIGIT[digitKey] || [];
    if (panaList.length === 0) return;

    const typeLower = selectedType.toLowerCase();

    setBets(prev => {
      const map = new Map(prev.map(b => [b.id, b]));

      panaList.forEach(pana => {
        const p = String(pana);
        const id = `${typeLower}-${p}`; // stable id => no duplicates
        if (map.has(id)) {
          map.set(id, { ...map.get(id), points: pts });
        } else {
          map.set(id, {
            id,
            pana: p,
            points: pts,
            type: typeLower,
          });
        }
      });

      return Array.from(map.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return Number(a.pana) - Number(b.pana);
      });
    });
  };

  const handleDeleteBet = id => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!guard()) return;
    if (bids === 0) {
      Alert.alert('No bets', 'Please add at least one bet.');
      return;
    }

    if (!mobileNumber) {
      Alert.alert(
        'Login required',
        'Mobile number missing. Please login again.',
      );
      return;
    }

    if (totalPoints > balance) {
      Alert.alert('Insufficient balance', 'Your wallet balance is too low.');
      return;
    }

    const betsToSend = bets.map(b =>
      makeBet({
        mobileNumber,
        gameName,
        type: 'Double Pana',
        openClose: String(b.type).toUpperCase(),
        amount: Number(b.points) || 0,
        betValue: b.pana,
      }),
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert('Success', 'Bets placed successfully!');

      // Update balance safely
      const spent = Number(totalPoints) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
      // keep points as-is (bulk UX). If you want reset:
      // setPoints("");
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to place bets.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - DOUBLE PANA BULK`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <GameTypePicker
            label="Select Game Type:"
            value={selectedType}
            options={pickerOptions}
            onChange={setSelectedType}
            containerStyle={{ marginBottom: 12 }}
          />

          <View style={styles.pointInputRow}>
            <Text style={[styles.label, { color: colors.text }]}>Enter Points:</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                pointsError && styles.errorInput,
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={handlePointsChange}
              placeholder="Point"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.grid}>
            {DIGITS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.digitTile, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => addBetsForDigit(d)}
              >
                <Text style={styles.digitText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Table area (flex:1 so EasyModeTable can scroll internally) */}
          <View style={styles.tableArea}>
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
          </View>
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
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  },
  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    borderWidth: 1,
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
    aspectRatio: 1.6,
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
  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});