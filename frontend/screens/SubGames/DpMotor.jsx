import React, { useMemo, useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import GameDateTypeRow from '../../components/games/GameDateTypeRow';
import BottomBetBar from '../../components/games/BottomBetBar';
import EasyModeTable from '../../components/games/EasyModeTable';

import { getDoublePanaMotorPanas } from '../../data/doublePanaMap';
import { sanitizeMotorDigits } from '../../data/singlePanaMap'; // reuse same sanitizer (no need to duplicate)

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';
import {
  validateAndAlertBetAmount,
  fetchBetLimits,
} from '../../utils/BetValidationService';

import { useTheme } from '../../contexts/ThemeContext';

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

const DpMotor = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
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

  const [selectedType, setSelectedType] = useState('OPEN');
  const [digits, setDigits] = useState(''); // 4..6 digits (we allow duplicates while typing, but block Add)
  const [points, setPoints] = useState('');
  const [bets, setBets] = useState([]);
  const [digitsError, setDigitsError] = useState(false);
  const [digitsFocused, setDigitsFocused] = useState(false);
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

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points: totalPoints };
  }, [bets]);

  // ✅ Don’t block duplicates while typing (prevents flicker on physical device)
  // Only keep digits-only + max 10, and show error if duplicates exist.
  const handleChangeDigits = txt => {
    const clean = String(txt || '').replace(/[^0-9]/g, '').slice(0, 10);
    setDigits(clean);
    setDigitsError(hasDuplicateDigits(clean));
  };

  // ✅ Auto-sanitize only when typing is “done” (blur/end edit)
  const handleDigitsBlur = () => {
    setDigitsFocused(false);
    const uniq = sanitizeMotorDigits(digits, 10);
    if (uniq !== digits) setDigits(uniq);
    setDigitsError(hasDuplicateDigits(uniq));
  };

  const ptsNum = Number(points || 0);

  // ✅ block Add if invalid digits/points (UX + prevents bad requests)
  const canAdd = useMemo(() => {
    if (!digits) return false;
    if (digits.length < 4 || digits.length > 10) return false;
    if (digitsError) return false;
    if (!ptsNum || ptsNum <= 0) return false;
    if (ptsNum < minAmount || ptsNum > maxAmount) return false;
    return true;
  }, [digits, digitsError, ptsNum, minAmount, maxAmount]);

  const handleAdd = () => {
    const uniqDigits = sanitizeMotorDigits(digits, 10);

    if (uniqDigits.length < 4 || uniqDigits.length > 10) {
      Alert.alert(
        t('validation:validation'),
        t('validation:enterMinMaxDigits'),
      );
      return;
    }

    // if duplicates were present, stop and let user see error
    if (hasDuplicateDigits(digits)) {
      setDigitsError(true);
      Alert.alert(t('validation:validation'), t('validation:enterUniqueDigits'));
      return;
    }

    const pts = Number(points);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    const panas = getDoublePanaMotorPanas(uniqDigits);

    if (panas.length === 0) {
      Alert.alert(t('validation:noMatch'), t('validation:noDoublePanaFound'));
      return;
    }

    setBets(prev => {
      const merged = [...prev];
      const existing = new Set(prev.map(b => b.id)); // stable id is best here

      panas.forEach(p => {
        const id = `${selectedType.toLowerCase()}-${p}`;
        if (!existing.has(id)) {
          merged.push({
            id, // stable id => avoid duplicates
            digit: p,
            points: pts,
            type: selectedType.toLowerCase(),
          });
        } else {
          // if already present, update points to latest entered
          const idx = merged.findIndex(x => x.id === id);
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
        type: 'Double Pana',
        openClose: String(b.type).toUpperCase(), // OPEN / CLOSE
        amount: Number(b.points) || 0,
        betValue: b.digit, // pana
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - DP MOTOR`} />
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
              <Text style={[styles.label, { color: colors.text }]}>Enter Digit:</Text>

              <View style={{ alignItems: 'flex-end' }}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                    (digitsError || (digitsFocused && (digits.length < 4 || digits.length > 10))) && [
                      styles.errorInput,
                      { borderColor: colors.error },
                    ],
                  ]}
                  keyboardType="number-pad"
                  value={digits}
                  onChangeText={handleChangeDigits}
                  onFocus={() => setDigitsFocused(true)}
                  onEndEditing={handleDigitsBlur}
                  placeholder="Number"
                  maxLength={10}
                  placeholderTextColor={colors.textTertiary}
                />
                {digitsError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>Please enter unique digits</Text>
                ) : digitsFocused && (digits.length < 4 || digits.length > 10) ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>4-10 digits required</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>Enter Points:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                keyboardType="number-pad"
                value={points}
                onChangeText={t =>
                  setPoints(String(t || '').replace(/[^0-9]/g, ''))
                }
                placeholder="Point"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: colors.primary },
                !canAdd && styles.addButtonDisabled,
              ]}
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

export default DpMotor;

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
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
    writingDirection: 'ltr',
    paddingHorizontal: 8,
  },
  errorInput: {
    borderColor: '#E53935',
    borderWidth: 2,
  },
  errorText: {
    marginTop: 6,
    fontWeight: '700',
    fontSize: 12,
  },
  addButton: {
    height: 44,
    width: 180,
    borderRadius: 6,
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