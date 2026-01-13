import React, { useContext, useMemo, useState } from 'react';
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
import GameDateTypeRow from '../../components/games/GameDateTypeRow';
import BottomBetBar from '../../components/games/BottomBetBar';
import EasyModeTable from '../../components/games/EasyModeTable';

import {
  sanitizeMotorDigits,
  getSinglePanaMotorPanas,
} from '../../data/singlePanaMap';

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';

const GREEN = '#3FA16C';

const SpMotor = ({ route }) => {
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

  const [selectedType, setSelectedType] = useState('OPEN');

  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
  });

  const [digits, setDigits] = useState(''); // 4..6 unique digits
  const [points, setPoints] = useState('');
  const [bets, setBets] = useState([]); // {id, digit(pana), points, type}
  const [digitsError, setDigitsError] = useState(false);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const handleChangeDigits = (txt) => {
    const clean = String(txt || "").replace(/[^0-9]/g, "");

    const seen = new Set();
    let out = "";
    let hasDuplicate = false;

    for (const ch of clean) {
      if (out.length >= 6) break;

      if (seen.has(ch)) {
        hasDuplicate = true;
        continue;
      }

      seen.add(ch);
      out += ch;
    }

    setDigits(out);
    setDigitsError(hasDuplicate);
  };

  const handleAdd = () => {
    if (digits.length < 4 || digits.length > 6) {
      Alert.alert(
        'Validation',
        'Please enter minimum 4 and maximum 6 unique digits.',
      );
      return;
    }

    const pts = Number(points);
    if (!pts || pts <= 0) {
      Alert.alert('Validation', 'Please enter valid points.');
      return;
    }

    const panas = getSinglePanaMotorPanas(digits);

    if (panas.length === 0) {
      Alert.alert('No match', 'No Single Pana found for these digits.');
      return;
    }

    setBets(prev => {
      const existing = new Set(prev.map(b => b.digit));
      const merged = [...prev];

      panas.forEach(p => {
        if (!existing.has(p)) {
          merged.push({
            id: `${Date.now()}-${p}`,
            digit: p,
            points: pts,
            type: selectedType.toLowerCase(),
          });
        }
      });

      return merged;
    });
  };

  const handleDelete = id => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    if (totals.bids === 0) {
      Alert.alert('No bets', 'Please add at least one pana.');
      return;
    }

    if (!mobileNumber) {
      Alert.alert('Login required', 'Mobile number missing. Please login again.');
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
        type: 'Single Pana',
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(), // OPEN/CLOSE
        amount: Number(b.points) || 0,
        betValue: String(b.digit),
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
      setDigits('');
      setPoints('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to place bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SP MOTOR`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={pickerOptions}
            onChangeGameType={setSelectedType}
          />

          <View style={styles.form}>
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Digit:</Text>
              <TextInput
                style={[styles.input, digitsError && styles.errorInput]}
                keyboardType="number-pad"
                value={digits}
                onChangeText={handleChangeDigits}
                placeholder="Number"
                maxLength={6}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Points:</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={points}
                onChangeText={setPoints}
                placeholder="Point"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>

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

export default SpMotor;

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

  form: {
    marginTop: 8,
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
  },
  errorInput: {
    borderColor: "#E53935",
    borderWidth: 2,
  },
  addButton: {
    height: 44,
    width: 180,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  addText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});