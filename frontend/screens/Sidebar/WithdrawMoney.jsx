import React, { useState, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  FlatList,
  Image,
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

import { WITHDRAW_MONEY_CAROUSEL_DUMMY } from '../../data/withdrawMoneyCarouselDummy';

/* ------------------ Carousel helpers ------------------ */
const maskMobile = (m) => {
  const s = String(m || "").replace(/\D/g, "");
  if (s.length < 10) return s || "--";
  return `${s.slice(0, 2)}****${s.slice(-4)}`;
};

const CAROUSEL_GAP = 12;

const CarouselSeparator = () => <View style={styles.carouselSeparator} />;

const TopCarouselBar = ({ data, statusText }) => {
  const { colors } = useTheme();
  const listRef = useRef(null);
  const idxRef = useRef(0);

  const [wrapW, setWrapW] = useState(0);

  const GAP = CAROUSEL_GAP;
  const SIDE_PAD = 0;      // ScrollView already has padding: 16
  const PEEK = 0;         // how much next card peeks on right

  const ITEM_W = useMemo(() => {
    const w = Math.floor(wrapW || 0);
    if (!w) return 0;
    // keep it responsive + never too tiny
    return Math.max(240, w - PEEK);
  }, [wrapW]);

  const INTERVAL = ITEM_W + GAP;

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;
    if (!ITEM_W) return;

    const timer = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % data.length;
      try {
        listRef.current?.scrollToOffset?.({
          offset: idxRef.current * INTERVAL,
          animated: true,
        });
      } catch {}
    }, 5500);

    return () => clearInterval(timer);
  }, [data, ITEM_W, INTERVAL]);

  const renderItem = ({ item }) => {
    const mobile = maskMobile(item?.mobile);
    const amount = Number(item?.amount || 0) || 0;

    return (
      <View style={{ width: ITEM_W }}>
        <View
          style={[
            styles.carouselPill,
            {
              backgroundColor: colors.background,
              borderColor: colors.primary,
              shadowColor: colors.text,
            },
          ]}
        >
          {/* left group */}
          <View style={styles.carouselLeft}>
            <Text
              style={[styles.carouselMobile, { color: colors.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {mobile}
            </Text>

            <Text style={[styles.carouselPointer, { color: colors.text }]}>👉</Text>

            <Text
              style={[styles.carouselAmt, { color: colors.text }]}
              numberOfLines={1}
            >
              ₹{amount}
            </Text>
          </View>

          {/* right pill */}
          <View style={styles.carouselStatusPill}>
            <Text
              style={[styles.carouselStatusText, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <View
      style={styles.carouselWrap}
      onLayout={(e) => {
        const w = e?.nativeEvent?.layout?.width || 0;
        if (w && w !== wrapW) setWrapW(w);
      }}
    >
      {!!ITEM_W && (
        <FlatList
          ref={listRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(it, i) => `${it?.mobile || "m"}-${it?.amount || "a"}-${i}`}
          renderItem={renderItem}
          ItemSeparatorComponent={CarouselSeparator}
          contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
          snapToInterval={INTERVAL}
          decelerationRate="fast"
          snapToAlignment="start"
          bounces={false}
          getItemLayout={(_, index) => ({
            length: INTERVAL,
            offset: INTERVAL * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const x = e?.nativeEvent?.contentOffset?.x || 0;
            const nextIdx = Math.round(x / INTERVAL);
            idxRef.current = Math.max(0, Math.min(nextIdx, data.length - 1));
          }}
        />
      )}
    </View>
  );
};
/* ------------------ end carousel ------------------ */

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ThemeColor HEADER (inline) */}
      <View style={[styles.headerRoot, { paddingTop: insets.top }]}>
        <View style={[styles.headerBg, { backgroundColor: colors.primary }]} />
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('funds:withdrawFund')}</Text>
          <View style={styles.walletRight}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={22}
              color={colors.text}
            />
            <Text style={[styles.walletAmt, { color: colors.text }]}>
              {user?.balance ? user.balance : '0.0'}
            </Text>
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP CAROUSEL */}
        <TopCarouselBar data={WITHDRAW_MONEY_CAROUSEL_DUMMY} statusText={t('screens:withdrawSuccessfully')} />

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
          <View style={[styles.innerCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <Image source={require("../../assets/Images/logo.webp")} style={styles.walletImage} />

            <View style={[styles.logoDivider, { borderColor: colors.divider }]} />
            <View style={[styles.balanceStrip, { backgroundColor: colors.background }]}>
              <Text style={[styles.balanceLabel, { color: colors.text }]}>{t('screens:availableBalance')}</Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>₹ {user?.balance ? user.balance : '0.0'}</Text>

            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.helpTitle, { color: colors.text }]}>
            {t('screens:forFundQueries')}
          </Text>

          <View style={styles.helpBtns}>
            <TouchableOpacity style={[styles.helpBtn, { backgroundColor: colors.background, shadowColor: colors.text }]} onPress={openDialer}>
              <MaterialIcons name="call" size={20} color={colors.text} />
              <Text style={[styles.helpText, { color: colors.text }]}>{t('common:call')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.helpBtn, { backgroundColor: colors.background, shadowColor: colors.text }]} onPress={openWhatsapp}>
              <MaterialCommunityIcons name="whatsapp" size={20} color='#1ed514' />
              <Text style={[styles.helpText, { color: colors.text }]}>{t('common:whatsapp')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* amount input ONLY (no presets) */}
          <View style={[styles.amountInputWrap, { borderColor: colors.primary, backgroundColor: colors.background }]}>
            <View style={[styles.bankIcon, { backgroundColor: colors.primaryIconBg }]}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <TextInput
              placeholder={t('screens:enterAmount')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              style={[styles.amountInput, { color: colors.text }]}
              value={amount}
              onChangeText={setAmount}
              editable={!payLoading}
            />
          </View>

          {rulesStatus === 'error' ? (
            <View style={[styles.rulesError, { backgroundColor: colors.background }]}>
              <View style={styles.rulesErrorRow}>
                <MaterialIcons name="error-outline" size={22} color="#EF4444" />
                <Text style={[styles.rulesErrorText, { color: colors.text }]}>
                  {t('screens:withdrawRulesLoadFailed')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={loadRules}
                activeOpacity={0.85}
              >
                <Text style={styles.retryText}>{t('common:tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: colors.primary, shadowColor: colors.text }, isDisabled && styles.bottomBtnDisabled]}
          onPress={handleWithdraw}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {isBusy ? <ButtonLoader size={24} /> : <Text style={styles.bottomText}>{t('screens:sendRequest')}</Text>}
        </TouchableOpacity>
      </View>

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

  // ✅ carousel
  // ✅ carousel
  carouselWrap: {
    marginTop: 6,
    marginBottom: 14,
  },
  carouselPill: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  carouselLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0, // 🔥 allows text truncation in RN
  },
  carouselMobile: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
    flexShrink: 1,
    minWidth: 0,
  },
  carouselPointer: {
    fontSize: 16,
    fontWeight: '900',
  },
  carouselAmt: {
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 0,
  },
  carouselSeparator: {
    width: CAROUSEL_GAP,
  },
  carouselStatusPill: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 10,
    maxWidth: '45%', // 🔥 prevents overflow on small screens
  },
  carouselStatusText: {
    fontSize: 12,
    fontWeight: '900',
  },

  headerRoot: { width: '100%' },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 6,
    marginBottom: 15,
  },
  backBtn: {
    paddingRight: 8,
    marginBottom: 15,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 15,
  },
  walletAmt: {
    fontSize: 22,
  },

  card: {
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  innerCard: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  walletImage: {
    width: 120,
    height: 64,
    marginBottom: 10,
  },
  logoDivider: {
    width: '70%',
    borderWidth: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  mobile: {
    fontSize: 16,
    marginBottom: 10,
  },
  balanceStrip: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 15,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  divider: {
    height: 2,
    marginVertical: 10,
  },
  helpTitle: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  helpBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  helpText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },

  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  bankIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
  },
  rulesError: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
  },
  rulesErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rulesErrorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  retryBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bottomBtn: {
    width: '92%',
    borderRadius: 30,
    paddingVertical: 14,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bottomBtnDisabled: {
    opacity: 0.6,
  },
  bottomText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '800',
  },
  modalHr: {
    height: 1,
    marginVertical: 12,
  },
  modalRow: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 4,
  },
  modalRowLast: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
  },
  modalValue: {
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 18,
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
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  tncText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
});