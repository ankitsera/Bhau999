// screens/SubGames/DpCommon.jsx
import React, { useMemo, useState, useContext } from 'react';
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

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';
import { validateAndAlertBetAmount, fetchBetLimits } from '../../utils/BetValidationService';

import { useTheme } from '../../contexts/ThemeContext';

const ROW1 = ['1', '2', '3', '4', '5'];
const ROW2 = ['6', '7', '8', '9', '0'];

const DpCommon = ({ route }) => {
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

  const [bets, setBets] = useState([]); // {id, digit(pana), points, type}

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

    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount)) {
      return;
    }
    setPointsError(false);

    const panas = getDoublePanaCommonDigitPanas(digit);
    if (!panas.length) return;

    const typeLower = selectedType.toLowerCase();

    setBets(prev => {
      const existing = new Set(prev.map(b => b.digit)); // digit is pana here
      const stamp = Date.now().toString();

      const toAdd = panas
        .filter(p => !existing.has(p))
        .map((p, idx) => ({
          id: `${typeLower}-${p}-${stamp}-${idx}`, // stable-ish, avoids collisions
          digit: p,
          points: pts,
          type: typeLower,
        }));

      return [...prev, ...toAdd].sort(
        (a, b) => Number(a.digit) - Number(b.digit),
      );
    });
  };

  const handleSubmit = async () => {
    if (!guard()) return;
    if (totals.bids === 0) {
      Alert.alert('No bets', 'Please add at least one pana.');
      return;
    }

    if (!mobileNumber) {
      Alert.alert(
        'Login required',
        'Mobile number missing. Please login again.',
      );
      return;
    }

    if (totals.points > balance) {
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
        betValue: b.digit, // pana value
      }),
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert('Success', 'Bets placed successfully!');

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to place bets.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - DP COMMON`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <GameTypePicker
            label="Select Game Type:"
            value={selectedType}
            options={pickerOptions}
            onChange={setSelectedType}
            containerStyle={{ marginBottom: 12 }}
          />

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Enter Points:</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                pointsError
                  ? { borderColor: colors.error, borderWidth: 2 }
                  : null,
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={v => {
                const clean = String(v || '').replace(/[^0-9]/g, '');
                setPoints(clean);
                if (pointsError && clean) setPointsError(false);
              }}
              placeholder="Point"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.pad}>
            <View style={styles.padRow}>
              {ROW1.map(d => (
                <DigitBtn
                  key={d}
                  digit={d}
                  onPress={() => addCommonForDigit(d)}
                  bg={colors.primary}
                />
              ))}
            </View>
            <View style={styles.padRow}>
              {ROW2.map(d => (
                <DigitBtn
                  key={d}
                  digit={d}
                  onPress={() => addCommonForDigit(d)}
                  bg={colors.primary}
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

const DigitBtn = ({ digit, onPress, bg }) => (
  <TouchableOpacity
    style={[styles.digitBtn, { backgroundColor: bg }]}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <Text style={styles.digitText}>{digit}</Text>
  </TouchableOpacity>
);

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

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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