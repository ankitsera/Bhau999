import React, { useState, useContext, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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

const GREEN = '#3FA16C';

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
        Alert.alert('Invalid Amount', 'Please enter a valid amount.');
        return;
      }

      if (MIN_WITHDRAW > 0 && amtNum < MIN_WITHDRAW) {
        Alert.alert(
          'Invalid Amount',
          `Minimum withdrawal amount is ₹${MIN_WITHDRAW}.`,
        );
        return;
      }

      const currentBal = Number(user?.balance || 0);
      if (amtNum > currentBal) {
        Alert.alert('Insufficient Balance', 'You do not have enough balance to withdraw.');
        return;
      }

      await withdrawMoney({ amountRupees: amtNum });

      // optional: clear input on success
      setAmount('');
    } catch (e) {
      Alert.alert('Withdraw Failed', e?.message || 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      {/* GREEN HEADER (inline) */}
      <View style={[styles.headerRoot, { paddingTop: insets.top }]}>
        <View style={styles.headerBg} />
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ paddingRight: 8, marginBottom: 15 }}
          >
            <MaterialIcons name="arrow-back" size={26} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Withdrawal Fund</Text>
          <View style={styles.walletRight}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={22}
              color="#000"
            />
            <Text style={styles.walletAmt}>
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
        <View style={styles.card}>
          <View style={styles.innerCard}>
            <Text style={styles.name}>
              {user?.username ? user.username : 'User'}
            </Text>
            <Text style={styles.mobile}>
              {user?.mobileNumber ? user.mobileNumber : 'User'}
            </Text>

            <View style={styles.balanceStrip}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>
                ₹ {user?.balance ? user.balance : '0.0'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.helpTitle}>
            For Fund Query's please Call Or Whatsapp
          </Text>

          <View style={styles.helpBtns}>
            <TouchableOpacity style={styles.helpBtn} onPress={openDialer}>
              <MaterialIcons name="call" size={20} color="#000" />
              <Text style={styles.helpText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpBtn} onPress={openWhatsapp}>
              <MaterialCommunityIcons name="whatsapp" size={20} color={GREEN} />
              <Text style={styles.helpText}>Whatsapp</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {/* amount input ONLY (no presets) */}
          <View style={styles.amountInputWrap}>
            <View style={styles.bankIcon}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={22}
                color={GREEN}
              />
            </View>
            <TextInput
              placeholder="Enter Amount"
              placeholderTextColor="#777"
              keyboardType="numeric"
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              editable={!payLoading}
            />
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, isDisabled && { opacity: 0.6 }]}
          onPress={handleWithdraw}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {payLoading ? <ActivityIndicator /> : <Text style={styles.bottomText}>Send Request</Text>}
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
          <View style={styles.closedCard}>
            <View style={styles.modalIconCircle}>
              <MaterialIcons name="close" size={36} color="#EF4444" />
            </View>
            <Text style={styles.closedTitle}>
              Cannot withdraw at this time.
            </Text>
            <View style={styles.modalHr} />

            <Text style={styles.modalRow}>
              <Text style={styles.modalLabel}>Open Time : </Text>
              <Text style={styles.modalValue}>
                {WITHDRAW_OPEN_CFG ? formatTime(WITHDRAW_OPEN_CFG) : '--:--'}
              </Text>
            </Text>

            <Text style={[styles.modalRow, { marginBottom: 16 }]}>
              <Text style={styles.modalLabel}>Close Time : </Text>
              <Text style={styles.modalValue}>
                {WITHDRAW_CLOSE_CFG ? formatTime(WITHDRAW_CLOSE_CFG) : '--:--'}
              </Text>
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowClosedModal(false);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.modalPrimaryText}>OK</Text>
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
          <View style={styles.tncCard}>
            <Text style={styles.tncTitle}>Terms & Conditions</Text>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
              showsVerticalScrollIndicator={false}
            >
              {MIN_WITHDRAW > 0 ? (
                <TncItem text={`Minimum Withdraw is ${MIN_WITHDRAW}/- Rs.`} />
              ) : null}
              <TncItem text="Maximum Withdraw is 25,00,000/- per day." />
              <TncItem text="Above 5 Lakh you should request us manually." />
              <TncItem text="Process time minimum 1 hour, maximum 72 hours (depends on bank server)." />
              <TncItem
                text={`Withdraw request timing is Morning ${withdrawOpenStr} to Night ${withdrawCloseStr}.`}
              />
              <TncItem text="Withdraw is available on all days of week." />
              <TncItem text="Confirm your bank details are correct; wrong details are not our responsibility." />
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { margin: 16 }]}
              onPress={() => setShowTncModal(false)}
            >
              <Text style={styles.modalPrimaryText}>ACCEPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function TncItem({ text }) {
  return (
    <View style={styles.tncRow}>
      <Text style={{ fontSize: 18, lineHeight: 22 }}>👍</Text>
      <Text style={styles.tncText}>{text}</Text>
    </View>
  );
}

export default WithdrawMoney;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  headerRoot: { width: '100%' },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: GREEN,
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
    color: '#000',
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
    color: '#000',
    fontSize: 22,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  innerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  mobile: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  balanceStrip: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  divider: {
    height: 2,
    backgroundColor: '#00000033',
    marginVertical: 10,
  },
  helpTitle: {
    textAlign: 'center',
    color: '#000',
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
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  helpText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },

  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginTop: 6,
  },
  bankIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9f8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  bottomBtn: {
    backgroundColor: GREEN,
    width: '92%',
    borderRadius: 30,
    paddingVertical: 14,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
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
    backgroundColor: GREEN,
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
    backgroundColor: '#00000014',
    marginVertical: 12,
  },
  modalRow: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 16,
    color: '#111',
  },
  modalValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '800',
  },

  // Closed (out-of-hours) card
  closedCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalIconCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closedTitle: {
    textAlign: 'center',
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 16,
  },

  // T&C card
  tncCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tncTitle: {
    textAlign: 'center',
    backgroundColor: GREEN,
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
  tncText: {
    flex: 1,
    color: '#000',
    fontSize: 15,
    lineHeight: 22,
  },
});
