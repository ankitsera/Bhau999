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
import {
  validateAndAlertBetAmount,
  fetchBetLimits,
} from '../../utils/BetValidationService';

import { ThemeColor } from '../../contexts/Themes';

const hasDuplicateDigits = s => {
  const str = String(s || '');
  const seen = new Set();
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (seen.has(ch)) return true;
    seen.add(ch);
  }
  return false;
};

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

  const { pickerOptions, showClosedModal, closeClosedModal, guard } =
    useBettingGuard({
      gameName,
      selectedType,
      setSelectedType,
    });

  const [digits, setDigits] = useState(''); // 4..6 digits (we allow duplicates while typing, but block Add)
  const [points, setPoints] = useState('');
  const [bets, setBets] = useState([]); // {id, digit(pana), points, type}
  const [digitsError, setDigitsError] = useState(false);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points: totalPoints };
  }, [bets]);

  // ✅ NO blocking/rewriting for uniqueness here (prevents flicker on real devices)
  // Only: digits-only + max 6 + set error if duplicates exist
  const handleChangeDigits = txt => {
    const clean = String(txt || '')
      .replace(/[^0-9]/g, '')
      .slice(0, 6);
    setDigits(clean);
    setDigitsError(hasDuplicateDigits(clean));
  };

  // ✅ Auto-clean ONLY when user finishes editing (safe)
  const handleDigitsBlur = () => {
    const uniq = sanitizeMotorDigits(digits, 6);
    if (uniq !== digits) {
      setDigits(uniq);
    }
    // after sanitize, duplicates should be gone
    setDigitsError(hasDuplicateDigits(uniq));
  };

  const ptsNum = Number(points || 0);

  // ✅ block Add if invalid digits/points (good UX)
  const canAdd = useMemo(() => {
    if (!digits) return false;
    if (digits.length < 4 || digits.length > 6) return false;
    if (digitsError) return false;
    if (!ptsNum || ptsNum <= 0) return false;
    if (ptsNum < minAmount || ptsNum > maxAmount) return false;
    return true;
  }, [digits, digitsError, ptsNum, minAmount, maxAmount]);

  const handleAdd = () => {
    // extra safety net: if user somehow bypassed, sanitize once
    const uniqDigits = sanitizeMotorDigits(digits, 6);

    if (uniqDigits.length < 4 || uniqDigits.length > 6) {
      Alert.alert(
        'Validation',
        'Please enter minimum 4 and maximum 6 unique digits.',
      );
      return;
    }

    // if duplicates were present, stop and let user see error
    if (hasDuplicateDigits(digits)) {
      setDigitsError(true);
      Alert.alert('Validation', 'Please enter unique digits (no duplicates).');
      return;
    }

    const pts = Number(points);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount)) {
      return;
    }

    const panas = getSinglePanaMotorPanas(uniqDigits);

    if (panas.length === 0) {
      Alert.alert('No match', 'No Single Pana found for these digits.');
      return;
    }

    setBets(prev => {
      const existing = new Set(prev.map(b => `${b.type}-${b.digit}`));
      const merged = [...prev];

      panas.forEach(p => {
        const key = `${selectedType.toLowerCase()}-${p}`;
        if (!existing.has(key)) {
          merged.push({
            id: key, // stable id
            digit: p,
            points: pts,
            type: selectedType.toLowerCase(),
          });
        } else {
          // if already present, update points to latest entered
          const idx = merged.findIndex(
            x => x.digit === p && x.type === selectedType.toLowerCase(),
          );
          if (idx >= 0) merged[idx] = { ...merged[idx], points: pts };
        }
      });

      return merged.sort((a, b) => Number(a.digit) - Number(b.digit));
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
        type: 'Single Pana',
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(), // OPEN/CLOSE
        amount: Number(b.points) || 0,
        betValue: String(b.digit),
      }),
    );

    try {
      await placeBets(betsToSend);
      Alert.alert('Success', 'Bets placed successfully!');

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
      setDigits('');
      setPoints('');
      setDigitsError(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to place bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SP MOTOR`} />
        <BettingClosedModal
          visible={showClosedModal}
          onClose={closeClosedModal}
        />

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
              <View style={{ alignItems: 'flex-end' }}>
                <TextInput
                  style={[styles.input, digitsError && styles.errorInput]}
                  keyboardType="number-pad"
                  value={digits}
                  onChangeText={handleChangeDigits}
                  onEndEditing={handleDigitsBlur}
                  placeholder="Number"
                  maxLength={6}
                  placeholderTextColor="#999"
                />
                {digitsError ? (
                  <Text style={styles.errorText}>
                    Please enter unique digits
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Points:</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={points}
                onChangeText={t =>
                  setPoints(String(t || '').replace(/[^0-9]/g, ''))
                }
                placeholder="Point"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
              onPress={handleAdd}
              activeOpacity={0.85}
              disabled={!canAdd}
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
    borderColor: '#E53935',
    borderWidth: 2,
  },
  errorText: {
    marginTop: 6,
    color: '#E53935',
    fontWeight: '700',
    fontSize: 12,
  },
  addButton: {
    height: 44,
    width: 180,
    borderRadius: 6,
    backgroundColor: ThemeColor,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  addButtonDisabled: {
    opacity: 0.55,
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
