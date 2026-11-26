import React, { useContext, useMemo, useState } from 'react';
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

import { useTheme } from '../../contexts/ThemeContext';
import { FONT } from '../../contexts/Themes';

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
  const [digitsFocused, setDigitsFocused] = useState(false);
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
  // Only: digits-only + max 10 + set error if duplicates exist
  const handleChangeDigits = txt => {
    const clean = String(txt || '')
      .replace(/[^0-9]/g, '')
      .slice(0, 10);
    setDigits(clean);
    setDigitsError(hasDuplicateDigits(clean));
  };

  // ✅ Auto-clean ONLY when user finishes editing (safe)
  const handleDigitsBlur = () => {
    setDigitsFocused(false);
    const uniq = sanitizeMotorDigits(digits, 10);
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
    if (digits.length < 4 || digits.length > 10) return false;
    if (digitsError) return false;
    if (!ptsNum || ptsNum <= 0) return false;
    if (ptsNum < minAmount || ptsNum > maxAmount) return false;
    return true;
  }, [digits, digitsError, ptsNum, minAmount, maxAmount]);

  const handleAdd = () => {
    // extra safety net: if user somehow bypassed, sanitize once
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

    const panas = getSinglePanaMotorPanas(uniqDigits);

    if (panas.length === 0) {
      Alert.alert(t('validation:noMatch'), t('validation:noSinglePanaFound'));
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
      Alert.alert(t('validation:noBets'), t('validation:pleaseAddPana'));
      return;
    }

    if (!mobileNumber) {
      Alert.alert(
        t('validation:loginRequired'),
        t('validation:mobileNumberMissing'),
      );
      return;
    }

    if (totals.points > balance) {
      Alert.alert(t('validation:insufficientBalance'), t('validation:walletBalanceTooLow'));
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
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

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
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterDigit')}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
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
                  placeholder={t('games:number')}
                  maxLength={10}
                  placeholderTextColor={colors.textTertiary}
                />
                {digitsError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    Please enter unique digits
                  </Text>
                ) : digitsFocused && (digits.length < 4 || digits.length > 10) ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    4-10 digits required
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="number-pad"
                value={points}
                onChangeText={t =>
                  setPoints(String(t || '').replace(/[^0-9]/g, ''))
                }
                placeholder={t('games:point')}
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
              <Text style={[styles.addText, { color: colors.onPrimary }]}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel={t('games:pana')}
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
    fontSize: FONT.body,
    fontWeight: '500',
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: FONT.body,
    textAlign: 'center',
  },
  errorInput: {
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
    fontSize: FONT.body,
    fontWeight: '700',
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});