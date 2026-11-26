import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ButtonLoader from '../../components/ButtonLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { PaymentsContext } from '../../contexts/PaymentsContext';
import { getCallSupport, getWhatsappSupport } from '../../utils/AppConfigService';
import { getWithdrawalRules } from '../../utils/PaymentsService';
import { useTheme } from '../../contexts/ThemeContext';

import ThemeHeader from '../../components/ThemeHeader';
import {
  AccountCard,
  SectionLabel,
  AmountInput,
  PrimaryButton,
  HelpRow,
  fundStyles,
} from '../../components/funds/FundParts';
import { FONT } from '../../contexts/Themes';

const maskAccount = (no) => {
  const d = String(no || '').replace(/\s/g, '');
  return d.length > 4 ? `•••• ${d.slice(-4)}` : d;
};


// "HH:mm" (as sent by the server) -> "h:mm AM/PM"
function formatTime(hhmm) {
  const [hour, minute] = String(hhmm || '').split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '--:--';
  const h12 = hour % 12 || 12;
  const mm = String(minute).padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h12}:${mm} ${ampm}`;
}

const isWithdrawalOpen = (rules) => rules.allowedToday && rules.withinTimeWindow;

const WithdrawMoney = ({ navigation }) => {
  const { t } = useTranslation(['screens', 'funds', 'common']);
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const { withdrawMoney, loading: payLoading } = useContext(PaymentsContext);

  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');

  // Modals
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showTncModal, setShowTncModal] = useState(false);

  // AppConfig-driven values (defaults handled in AppConfigService helpers)
  const [supportPhone, setSupportPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');

  // Withdrawal rules come from the server, so the app checks exactly what the server
  // enforces, on the server's clock. Sending stays disabled until they have loaded.
  const [rules, setRules] = useState(null);
  const [rulesStatus, setRulesStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [checkingRules, setCheckingRules] = useState(false);

  const openDialer = () => {
    if (!supportPhone) return;
    Linking.openURL(`tel:+91${supportPhone}`).catch(() => {});
  };

  const openWhatsapp = () => {
    if (!whatsappPhone) return;
    Linking.openURL(`https://wa.me/91${whatsappPhone}`).catch(() => {});
  };

  const loadRules = useCallback(async () => {
    setRulesStatus('loading');
    try {
      const next = await getWithdrawalRules();
      setRules(next);
      setRulesStatus('ready');
      if (isWithdrawalOpen(next)) setShowTncModal(true);
      else setShowClosedModal(true);
    } catch {
      setRulesStatus('error');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.all([getCallSupport(), getWhatsappSupport()])
      .then(([callSupport, whatsappSupport]) => {
        if (!mounted) return;
        setSupportPhone(String(callSupport || ''));
        setWhatsappPhone(String(whatsappSupport || ''));
      })
      .catch(() => {});

    loadRules();

    return () => {
      mounted = false;
    };
  }, [loadRules]);

  const amtNum = useMemo(() => Number(String(amount).trim()), [amount]);
  const isBusy = rulesStatus === 'loading' || checkingRules || payLoading;
  const isDisabled = rulesStatus !== 'ready' || !Number.isFinite(amtNum) || amtNum <= 0 || isBusy;

  const handleWithdraw = async () => {
    try {
      // Re-read the rules so a screen left open past closing time, or a setting the
      // admin just changed, is still caught before the request goes out.
      let latest;
      setCheckingRules(true);
      try {
        latest = await getWithdrawalRules();
        setRules(latest);
      } catch {
        Alert.alert(t('screens:withdrawFailed'), t('screens:withdrawRulesLoadFailed'));
        return;
      } finally {
        setCheckingRules(false);
      }

      if (!isWithdrawalOpen(latest)) {
        setShowClosedModal(true);
        return;
      }

      if (!Number.isFinite(amtNum) || amtNum <= 0) {
        Alert.alert(t('screens:invalidAmount'), t('screens:pleaseEnterValidAmount'));
        return;
      }

      if (amtNum < latest.minAmount) {
        Alert.alert(
          t('screens:invalidAmount'),
          t('screens:minimumWithdrawalAmount', { amount: latest.minAmount }),
        );
        return;
      }

      // Require bank details
      const accName = String(user?.accountHolderName || "").trim();
      const accNo = String(user?.accountNumber || "").trim();
      const ifsc = String(user?.ifscCode || "").trim();
      

      const anyBankField = !!accName || !!accNo || !!ifsc;
      const hasBankDetails = !!accName && !!accNo && !!ifsc;

      if (anyBankField && !hasBankDetails) {
        Alert.alert(t('screens:bankDetailsIncomplete'), t('screens:pleaseUpdateBankDetails'));
        return;
      }

      if (!hasBankDetails) {
        Alert.alert(
          t('screens:bankDetailsRequired'),
          t('screens:pleaseAddBankDetails'),
          [
            { text: t('common:cancel'), style: "cancel" },
            {
              text: t('screens:addBankDetails'),
              onPress: () => navigation.navigate("Bank Details"),
            },
          ]
        );
        return;
      }

      const currentBal = Number(user?.balance || 0);
      if (amtNum > currentBal) {
        Alert.alert(t('screens:insufficientBalance'), t('screens:notEnoughBalance'));
        return;
      }

      await withdrawMoney({ amountRupees: amtNum });

      // optional: clear input on success
      setAmount('');
    } catch (e) {
      Alert.alert(t('screens:withdrawFailed'), e?.message || t('common:somethingWentWrong'));
    }
  };

  const bankName = String(user?.accountHolderName || '').trim();
  const bankNo = String(user?.accountNumber || '').trim();
  const bankIfsc = String(user?.ifscCode || '').trim();
  const hasBank = !!bankName && !!bankNo && !!bankIfsc;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('funds:withdrawFund')} />

      <ScrollView
        contentContainerStyle={[fundStyles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AccountCard
          user={user}
          tiles={[
            { label: t('screens:availableBalance'), value: `₹${user?.balance ? user.balance : '0.00'}` },
            { label: t('funds:minimumWithdrawal'), value: rules?.minAmount ? `₹${rules.minAmount}` : '--' },
          ]}
        />

        {/* Bank account the money goes to */}
        <TouchableOpacity
          style={[styles.bankRow, { backgroundColor: colors.surface, borderColor: hasBank ? colors.cardBorder : colors.primary }]}
          onPress={() => navigation.navigate('Bank Details')}
          activeOpacity={0.8}
        >
          <View style={[styles.bankIcon, { backgroundColor: colors.primaryIconBg }]}>
            <MaterialCommunityIcons name="bank-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.bankInfo}>
            <Text style={[styles.bankTitle, { color: colors.text }]} numberOfLines={1}>
              {hasBank ? bankName : t('screens:addBankDetails')}
            </Text>
            <Text style={[styles.bankSub, { color: colors.textTertiary }]} numberOfLines={1}>
              {hasBank ? `${maskAccount(bankNo)}  ·  ${t('screens:ifsc')} ${bankIfsc}` : t('screens:pleaseAddBankDetails')}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </TouchableOpacity>

        <SectionLabel>{t('funds:enterAmount')}</SectionLabel>
        <AmountInput value={amount} onChange={setAmount} editable={!payLoading} />

        {rulesStatus === 'error' ? (
          <View style={[styles.rulesError, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.rulesErrorRow}>
              <MaterialIcons name="error-outline" size={18} color="#EF4444" />
              <Text style={[styles.rulesErrorText, { color: colors.text }]}>
                {t('screens:withdrawRulesLoadFailed')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={loadRules}
              activeOpacity={0.85}
            >
              <Text style={[styles.retryText, { color: colors.onPrimary }]}>{t('common:tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <PrimaryButton
          label={t('screens:sendRequest')}
          onPress={handleWithdraw}
          disabled={isDisabled}
          busy={isBusy}
          Loader={ButtonLoader}
        />

        <HelpRow onCall={openDialer} onWhatsapp={openWhatsapp} />
      </ScrollView>

      {/* MODAL: Out-of-hours */}
      <Modal
        visible={showClosedModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowClosedModal(false);
          navigation.navigate('Home');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.closedCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <View style={[styles.modalIconCircle, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={36} color="#EF4444" />
            </View>
            <Text style={[styles.closedTitle, { color: colors.text }]}>
              {t('screens:cannotWithdrawNow')}
            </Text>
            <View style={[styles.modalHr, { backgroundColor: colors.divider }]} />

            {rules && !rules.allowedToday ? (
              <Text style={[styles.modalRow, styles.modalRowLast, { color: colors.text }]}>
                {t('screens:withdrawClosedToday')}
              </Text>
            ) : (
              <>
                <Text style={[styles.modalRow, { color: colors.text }]}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('games:openTime')} : </Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {formatTime(rules?.timeStart)}
                  </Text>
                </Text>

                <Text style={[styles.modalRow, styles.modalRowLast, { color: colors.text }]}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('games:closeTime')} : </Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {formatTime(rules?.timeEnd)}
                  </Text>
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowClosedModal(false);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.modalPrimaryText}>{t('common:ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Terms & Conditions (shown only when within time window) */}
      <Modal
        visible={showTncModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTncModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.tncCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <Text style={[styles.tncTitle, { backgroundColor: colors.primary }]}>{t('screens:termsAndConditions')}</Text>
            <ScrollView
              style={styles.tncScroll}
              contentContainerStyle={styles.tncScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {rules ? (
                <TncItem text={t('screens:tncMinWithdraw', { amount: rules.minAmount })} />
              ) : null}
              <TncItem text={t('screens:tncMaxWithdraw')} />
              <TncItem text={t('screens:tncAbove5Lakh')} />
              <TncItem text={t('screens:tncProcessTime')} />
              {rules?.timeStart && rules?.timeEnd ? (
                <TncItem
                  text={t('screens:tncWithdrawTiming', {
                    openTime: formatTime(rules.timeStart),
                    closeTime: formatTime(rules.timeEnd),
                  })}
                />
              ) : null}
              <TncItem text={t('screens:tncAvailableAllDays')} />
              <TncItem text={t('screens:tncConfirmBankDetails')} />
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, styles.tncAcceptBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowTncModal(false)}
            >
              <Text style={styles.modalPrimaryText}>{t('common:accept')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function TncItem({ text }) {
  const { colors } = useTheme();

  return (
    <View style={styles.tncRow}>
      <Text style={[styles.tncBullet, { color: colors.text }]}>•</Text>
      <Text style={[styles.tncText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

export default WithdrawMoney;

const styles = StyleSheet.create({
  container: { flex: 1 },

  // bank account row
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bankIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfo: {
    flex: 1,
    marginLeft: 10,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bankSub: {
    fontSize: 12,
    marginTop: 2,
  },

  // rules failed to load
  rulesError: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rulesErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rulesErrorText: {
    flex: 1,
    fontSize: 13,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Modals shared styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalPrimaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#fff',
    fontSize: FONT.body,
    fontWeight: '800',
  },
  modalHr: {
    height: 1,
    marginVertical: 12,
  },
  modalRow: {
    textAlign: 'center',
    fontSize: FONT.body,
    marginBottom: 4,
  },
  modalRowLast: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: FONT.body,
  },
  modalValue: {
    fontSize: FONT.body,
    fontWeight: '800',
  },

  // Closed (out-of-hours) card
  closedCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalIconCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closedTitle: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: FONT.body,
  },

  // T&C card
  tncCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tncTitle: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: FONT.title,
    paddingVertical: 12,
  },
  tncScroll: {
    maxHeight: 360,
  },
  tncScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tncAcceptBtn: {
    margin: 16,
  },
  tncRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  tncBullet: {
    fontSize: FONT.title,
    lineHeight: 20,
    fontWeight: '900',
  },
  tncText: {
    flex: 1,
    fontSize: FONT.label,
    lineHeight: 19,
    fontWeight: '700',
  },
});