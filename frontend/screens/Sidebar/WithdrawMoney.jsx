import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
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
import {
  getCallSupport,
  getWhatsappSupport,
  getWithdrawalTimeStart,
  getWithdrawalTimeEnd,
  getMinimumWithdrawalAmount,
} from '../../utils/AppConfigService';
import { useTheme } from '../../contexts/ThemeContext';

import { WITHDRAW_MONEY_CAROUSEL_DUMMY } from '../../data/withdrawMoneyCarouselDummy';

/* ------------------ Carousel helpers ------------------ */
const maskMobile = (m) => {
  const s = String(m || "").replace(/\D/g, "");
  if (s.length < 10) return s || "--";
  return `${s.slice(0, 2)}****${s.slice(-4)}`;
};

const TopCarouselBar = ({ data, statusText }) => {
  const { t } = useTranslation(['screens', 'funds', 'common']);
  const { colors } = useTheme();
  const listRef = useRef(null);
  const idxRef = useRef(0);

  const [wrapW, setWrapW] = useState(0);

  const GAP = 12;
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

    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % data.length;
      try {
        listRef.current?.scrollToOffset?.({
          offset: idxRef.current * INTERVAL,
          animated: true,
        });
      } catch {}
    }, 5500);

    return () => clearInterval(t);
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
          <View
            style={[
              styles.carouselStatusPill,
              { backgroundColor: "#22c55e" },
            ]}
          >
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
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
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

function isWithinWithdrawalWindow(now = new Date(), open, close) {
  const start = new Date(now);
  start.setHours(open.hour, open.minute, 0, 0);
  const end = new Date(now);
  end.setHours(close.hour, close.minute, 0, 0);
  // supports overnight windows too
  if (end <= start) {
    return now >= start || now <= end;
  }
  return now >= start && now <= end;
}

function formatTime({ hour, minute }) {
  const h12 = hour % 12 || 12;
  const mm = String(minute).padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h12}:${mm} ${ampm}`;
}

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
  const [withdrawOpenStr, setWithdrawOpenStr] = useState('');
  const [withdrawCloseStr, setWithdrawCloseStr] = useState('');
  const [minWithdraw, setMinWithdraw] = useState(0);

  const parseHHMM = (s) => {
    if (!s || typeof s !== 'string') return null;
    const [hh, mm] = s.split(':');
    const h = Number(hh);
    const m = Number(mm);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return { hour: h, minute: m };
  };

  const WITHDRAW_OPEN_CFG = useMemo(
    () => parseHHMM(withdrawOpenStr),
    [withdrawOpenStr],
  );

  const WITHDRAW_CLOSE_CFG = useMemo(
    () => parseHHMM(withdrawCloseStr),
    [withdrawCloseStr],
  );

  const MIN_WITHDRAW = useMemo(() => {
    const v = Number(minWithdraw);
    return Number.isFinite(v) && v > 0 ? v : 0;
  }, [minWithdraw]);

  const openDialer = () => {
    if (!supportPhone) return;
    Linking.openURL(`tel:+91${supportPhone}`).catch(() => {});
  };

  const openWhatsapp = () => {
    if (!whatsappPhone) return;
    Linking.openURL(`https://wa.me/91${whatsappPhone}`).catch(() => {});
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const [
        callSupport,
        whatsappSupport,
        wStart,
        wEnd,
        minW,
      ] = await Promise.all([
        getCallSupport(),
        getWhatsappSupport(),
        getWithdrawalTimeStart(),
        getWithdrawalTimeEnd(),
        getMinimumWithdrawalAmount(),
      ]);

      if (!mounted) return;

      const openObj = parseHHMM(String(wStart || ''));
      const closeObj = parseHHMM(String(wEnd || ''));

      setSupportPhone(String(callSupport || ''));
      setWhatsappPhone(String(whatsappSupport || ''));
      setWithdrawOpenStr(String(wStart || ''));
      setWithdrawCloseStr(String(wEnd || ''));
      setMinWithdraw(Number(minW) || 0);

      // rely on AppConfigService defaults; if parse somehow fails, just don't block UI
      if (openObj && closeObj) {
        const within = isWithinWithdrawalWindow(new Date(), openObj, closeObj);
        if (!within) setShowClosedModal(true);
        else setShowTncModal(true); // always show T&C when within window
      } else {
        setShowTncModal(true);
      }
    };

    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amtNum = useMemo(() => Number(String(amount).trim()), [amount]);
  const isDisabled = !Number.isFinite(amtNum) || amtNum <= 0 || payLoading;

  const handleWithdraw = async () => {
    try {
      if (!WITHDRAW_OPEN_CFG || !WITHDRAW_CLOSE_CFG) {
        // config not ready / parse fail -> don't hard-block
        setShowTncModal(true);
      } else {
        const within = isWithinWithdrawalWindow(
          new Date(),
          WITHDRAW_OPEN_CFG,
          WITHDRAW_CLOSE_CFG,
        );
        if (!within) {
          setShowClosedModal(true);
          return;
        }
      }

      if (!Number.isFinite(amtNum) || amtNum <= 0) {
        Alert.alert(t('screens:invalidAmount'), t('screens:pleaseEnterValidAmount'));
        return;
      }

      if (MIN_WITHDRAW > 0 && amtNum < MIN_WITHDRAW) {
        Alert.alert(
          t('screens:invalidAmount'),
          t('screens:minimumWithdrawalAmount', { amount: MIN_WITHDRAW }),
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
            style={{ paddingRight: 8, marginBottom: 15 }}
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
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP CAROUSEL */}
        <TopCarouselBar data={WITHDRAW_MONEY_CAROUSEL_DUMMY} statusText={t('screens:withdrawSuccessfully')} />

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
          <View style={[styles.innerCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <Image source={require("../../assets/Images/logo.webp")} style={styles.walletImage} />

            <View style={{ width: "70%", borderWidth: 1, borderColor: colors.divider }}></View>
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
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: colors.primary, shadowColor: colors.text }, isDisabled && { opacity: 0.6 }]}
          onPress={handleWithdraw}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {payLoading ? <ButtonLoader size={24} /> : <Text style={styles.bottomText}>{t('screens:sendRequest')}</Text>}
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

            <Text style={[styles.modalRow, { color: colors.text }]}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('games:openTime')} : </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                {WITHDRAW_OPEN_CFG ? formatTime(WITHDRAW_OPEN_CFG) : '--:--'}
              </Text>
            </Text>

            <Text style={[styles.modalRow, { marginBottom: 16, color: colors.text }]}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('games:closeTime')} : </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                {WITHDRAW_CLOSE_CFG ? formatTime(WITHDRAW_CLOSE_CFG) : '--:--'}
              </Text>
            </Text>

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
              style={{ maxHeight: 360 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
              showsVerticalScrollIndicator={false}
            >
              {MIN_WITHDRAW > 0 ? (
                <TncItem text={t('screens:tncMinWithdraw', { amount: MIN_WITHDRAW })} />
              ) : null}
              <TncItem text={t('screens:tncMaxWithdraw')} />
              <TncItem text={t('screens:tncAbove5Lakh')} />
              <TncItem text={t('screens:tncProcessTime')} />
              <TncItem
                text={t('screens:tncWithdrawTiming', { openTime: withdrawOpenStr, closeTime: withdrawCloseStr })}
              />
              <TncItem text={t('screens:tncAvailableAllDays')} />
              <TncItem text={t('screens:tncConfirmBankDetails')} />
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { margin: 16, backgroundColor: colors.primary }]}
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
  carouselStatusPill: {
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