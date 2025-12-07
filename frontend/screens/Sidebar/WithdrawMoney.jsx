import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../contexts/AuthContext';

const GREEN = '#3FA16C';

// Window: 11:00 AM – 10:00 PM (local time)
const WITHDRAW_OPEN = { hour: 10, minute: 0 };
const WITHDRAW_CLOSE = { hour: 23, minute: 0 };

function isWithinWithdrawalWindow(now = new Date()) {
  const start = new Date(now);
  start.setHours(WITHDRAW_OPEN.hour, WITHDRAW_OPEN.minute, 0, 0);
  const end = new Date(now);
  end.setHours(WITHDRAW_CLOSE.hour, WITHDRAW_CLOSE.minute, 0, 0);
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
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');

  // Modals
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showTncModal, setShowTncModal] = useState(false);

  useEffect(() => {
    const within = isWithinWithdrawalWindow();
    if (!within) {
      setShowClosedModal(true);
    } else {
      setShowTncModal(true); // always show T&C when within window
    }
  }, []);

  const handleWithdraw = () => {
    // TODO: validate amount <= balance, submit request
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
            style={{ paddingRight: 8 }}
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
            <TouchableOpacity style={styles.helpBtn}>
              <MaterialIcons name="call" size={20} color="#000" />
              <Text style={styles.helpText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpBtn}>
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
            />
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, !amount && { opacity: 0.6 }]}
          onPress={handleWithdraw}
          disabled={!amount}
          activeOpacity={0.85}
        >
          <Text style={styles.bottomText}>Send Request</Text>
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
              <Text style={styles.modalValue}>{formatTime(WITHDRAW_OPEN)}</Text>
            </Text>
            <Text style={[styles.modalRow, { marginBottom: 16 }]}>
              <Text style={styles.modalLabel}>Close Time : </Text>
              <Text style={styles.modalValue}>
                {formatTime(WITHDRAW_CLOSE)}
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
              <TncItem text="Minimum Withdraw is 500/- Rs." />
              <TncItem text="Maximum Withdraw is 25,00,000/- per day." />
              <TncItem text="Above 5 Lakh you should request us manually." />
              <TncItem text="Process time minimum 1 hour, maximum 72 hours (depends on bank server)." />
              <TncItem text="Withdraw request timing is Morning 11:00 AM to Night 10:00 PM." />
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
    height: 110,
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
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
