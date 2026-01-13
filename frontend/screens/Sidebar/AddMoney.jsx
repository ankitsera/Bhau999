import React, { useContext, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  TouchableOpacity,
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
  getUpiId,
  getBankingName,
  getMinimumDepositAmount,
} from '../../utils/AppConfigService';

const GREEN = '#3FA16C';

const AddMoney = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { addMoneyViaUpi, loading: payLoading } = useContext(PaymentsContext);

  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');

  // ✅ from AppConfigService (defaults already handled there)
  const [supportPhone, setSupportPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankingName, setBankingName] = useState('');
  const [minDeposit, setMinDeposit] = useState(0);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [callSupport, whatsappSupport, upi, bankName, minDep] =
          await Promise.all([
            getCallSupport(),
            getWhatsappSupport(),
            getUpiId(),
            getBankingName(),
            getMinimumDepositAmount(),
          ]);

        if (!mounted) return;

        setSupportPhone(String(callSupport || ''));
        setWhatsappPhone(String(whatsappSupport || ''));
        setUpiId(String(upi || ''));
        setBankingName(String(bankName || ''));
        setMinDeposit(Number(minDep) || 0);
      } catch (e) {
        // helpers already handle defaults/critical behavior; keep screen silent
        // (no extra defaults here to avoid duplicating logic)
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const openDialer = () => {
    if (!supportPhone) return;
    Linking.openURL(`tel:+91${supportPhone}`).catch(() => {});
  };

  const openWhatsapp = () => {
    if (!whatsappPhone) return;
    Linking.openURL(`https://wa.me/91${whatsappPhone}`).catch(() => {});
  };

  const setPreset = v => setAmount(String(v));

  // ✅ payee config from AppConfigService
  const getPayeeConfig = () => ({
    payeeVpa: upiId,
    payeeName: bankingName,
  });

  // ✅ tighter disable logic (handles " ", "0", etc.)
  const amtNum = useMemo(() => Number(String(amount).trim()), [amount]);
  const isDisabled = !Number.isFinite(amtNum) || amtNum <= 0 || payLoading;

  const handleAdd = async () => {
    try {
      if (!Number.isFinite(amtNum) || amtNum <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount.');
        return;
      }

      const minDep = Number(minDeposit) || 0;
      if (minDep > 0 && amtNum < minDep) {
        Alert.alert('Invalid Amount', `Minimum deposit amount is ₹${minDep}.`);
        return;
      }

      const { payeeVpa, payeeName } = getPayeeConfig();

      if (!payeeVpa || !payeeName) {
        Alert.alert('Config Missing', 'Payment configuration is not available.');
        return;
      }

      await addMoneyViaUpi({
        amountRupees: amtNum,
        payeeVpa,
        payeeName,
        note: `Payment to ${payeeName}`,
      });

      setAmount('');
    } catch (e) {
      Alert.alert('Payment Failed', e?.message || 'Something went wrong.');
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
          <Text style={styles.headerTitle}>Add Fund</Text>
          <View style={styles.walletRight}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={28}
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
        {/* Wallet card */}
        <View style={styles.card}>
          <View style={styles.innerCard}>
            <Text style={styles.name}>{ user?.username ? user.username : "User"}</Text>
            <Text style={styles.mobile}>{ user?.mobileNumber ? user.mobileNumber : "User"}</Text>
            <View style={styles.balanceStrip}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>₹ {user?.balance ? user.balance : '0.0'}</Text>
            </View>
          </View>

          {/* help section */}
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

          {/* amount input */}
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

          {/* presets */}
          <View style={styles.presets}>
            {[500, 1000, 5000, 10000].map(v => {
              const selected = String(amtNum) === String(v);
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => setPreset(v)}
                  disabled={payLoading}
                  style={[
                    styles.presetBtn,
                    selected && {
                      borderColor: GREEN,
                      backgroundColor: '#e9f8f0',
                    },
                    payLoading && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selected && { color: GREEN, fontWeight: '700' },
                    ]}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, isDisabled && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {payLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.bottomText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddMoney;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3' },

  // header
  headerRoot: {
    width: '100%',
  },
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
    fontSize: 26,
  },

  // card
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
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: 16,
  },
  presetBtn: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#00000040',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  presetText: {
    fontSize: 18,
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
});
