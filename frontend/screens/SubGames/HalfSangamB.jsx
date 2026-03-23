import React, { useMemo, useState, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import { getAllPanaSuggestions } from '../../data/singlePanaMap';

import { AuthContext } from '../../contexts/AuthContext';
import { placeBets, makeBet } from '../../utils/GameService';
import BettingClosedModal from '../../components/BettingClosedModal';
import { useBettingGuard } from '../../utils/BettingGuard';
import { validateAndAlertBetAmount, fetchBetLimits } from '../../utils/BetValidationService';

import { useTheme } from '../../contexts/ThemeContext';

const HalfSangamB = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || 'GAME';

  // TODO: replace with WalletContext later
  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const { showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
  });

  const [openAnk, setOpenAnk] = useState('');
  const [closePana, setClosePana] = useState('');
  const [points, setPoints] = useState('');
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  const [showCloseSug, setShowCloseSug] = useState(false);

  const [bets, setBets] = useState([]); // {id, sangam, points}

  const closeSuggestions = useMemo(() => {
    if (!showCloseSug) return [];
    return getAllPanaSuggestions(closePana);
  }, [closePana, showCloseSug]);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const sanitizeDigits = val => (val || '').replace(/[^0-9]/g, '');

  const handleAdd = () => {
    Keyboard.dismiss();

    const ankVal = sanitizeDigits(openAnk);
    const panaVal = sanitizeDigits(closePana);
    const pts = Number(points);

    if (ankVal.length !== 1) {
      Alert.alert(t('validation:validation'), t('validation:pleaseEnterValidOpenAnk'));
      return;
    }

    if (panaVal.length !== 3) {
      Alert.alert(t('validation:validation'), t('validation:pleaseEnterValidClosePana'));
      return;
    }

    const panaOk = (getAllPanaSuggestions(panaVal[0]) || []).includes(
      panaVal,
    );
    if (!panaOk) {
      Alert.alert(
        t('validation:validation'),
        t('validation:pleaseSelectValidClosePana'),
      );
      return;
    }

    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    const sangam = `${ankVal}-${panaVal}`;
    const bet = {
      id: `${sangam}`, // stable => avoids duplicates
      sangam,
      points: pts,
      type: 'CLOSE',
    };

    setBets(prev => {
      const map = new Map(prev.map(b => [b.id, b]));
      map.set(bet.id, bet);
      return Array.from(map.values());
    });

    setOpenAnk('');
    setClosePana('');
    setPoints('');
    setShowCloseSug(false);
  };

  const handleDelete = id => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    const { bids, points: totalPts } = totals;

    if (bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseAddBet'));
      return;
    }

    if (!mobileNumber) {
      Alert.alert(
        t('validation:loginRequired'),
        t('validation:mobileNumberMissing'),
      );
      return;
    }

    if (totalPts > balance) {
      Alert.alert(t('validation:insufficientBalance'), t('validation:walletBalanceTooLow'));
      return;
    }

    const betsToSend = bets.map(b =>
      makeBet({
        mobileNumber,
        gameName,
        type: 'Half Sangam',
        openClose: 'CLOSE',
        amount: Number(b.points) || 0,
        betValue: b.sangam, // "openAnk-closePana"
      }),
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
    } catch (e) {
      console.error(e);
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - HALF SANGAM(B)`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Open Ank */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterOpenAnk')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                keyboardType="number-pad"
                value={openAnk}
                onChangeText={t => setOpenAnk(sanitizeDigits(t).slice(0, 1))}
                placeholder={t('games:ank')}
                placeholderTextColor={colors.textTertiary}
                maxLength={1}
              />
            </View>

            {/* Close Pana */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterClosePana')}</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  keyboardType="number-pad"
                  value={closePana}
                  onChangeText={t =>
                    setClosePana(sanitizeDigits(t).slice(0, 3))
                  }
                  placeholder={t('games:pana')}
                  placeholderTextColor={colors.textTertiary}
                  maxLength={3}
                  onFocus={() => setShowCloseSug(true)}
                  onBlur={() => setTimeout(() => setShowCloseSug(false), 120)}
                />

                {showCloseSug && closeSuggestions.length > 0 && (
                  <View style={[styles.suggestionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {closeSuggestions.map(item => (
                        <TouchableOpacity
                          key={item}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setClosePana(item);
                            setShowCloseSug(false);
                            Keyboard.dismiss();
                          }}
                        >
                          <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Points */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                keyboardType="number-pad"
                value={points}
                onChangeText={t => setPoints(sanitizeDigits(t))}
                placeholder={t('games:point')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>{t('common:add')}</Text>
            </TouchableOpacity>

            {/* Table */}
            <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerCell, { flex: 1.2, color: colors.text }]}>{t('games:sangam')}</Text>
              <Text style={[styles.headerCell, { flex: 0.9, color: colors.text }]}>{t('funds:amount')}</Text>
              <Text style={[styles.headerCell, { flex: 0.7, color: colors.text }]}>{t('common:delete')}</Text>
            </View>

            {bets.map(b => (
              <View key={b.id} style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.rowText, { flex: 1.2, color: colors.text }]}>{b.sangam}</Text>
                <Text
                  style={[styles.rowText, { flex: 0.9, textAlign: 'center', color: colors.text }]}
                >
                  {b.points}
                </Text>

                <View style={{ flex: 0.7, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[styles.deleteCircle, { backgroundColor: colors.primary }]}
                    onPress={() => handleDelete(b.id)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 80 }} />
          </ScrollView>
        </View>

        {/* Bottom submit */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <Text style={styles.submitText}>{t('common:submit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HalfSangamB;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
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
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputWrapper: {
    width: 150,
    position: 'relative',
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  suggestionBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 8,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
  },
  addButton: {
    marginTop: 6,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180,
    alignSelf: 'flex-end',
  },
  addText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeader: {
    marginTop: 14,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  rowCard: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteCircle: {
    width: 26,
    height: 26,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    height: 70,
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  submitBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});