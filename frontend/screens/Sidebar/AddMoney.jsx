import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
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
  FlatList,
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
import { useTheme } from '../../contexts/ThemeContext';

import { ADD_MONEY_CAROUSEL_DUMMY } from '../../data/addMoneyCarouselDummy';

/* ------------------ Carousel helpers ------------------ */
const maskMobile = (m) => {
  const s = String(m || "").replace(/\D/g, "");
  if (s.length < 10) return s || "--";
  return `${s.slice(0, 2)}****${s.slice(-4)}`;
};

const TopCarouselBar = ({ data, statusText = "Deposit Successfully" }) => {
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

const AddMoney = ({ navigation }) => {
  const { colors } = useTheme();

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Fund</Text>
          <View style={styles.walletRight}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={28}
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
        {/* ✅ TOP CAROUSEL */}
        <TopCarouselBar data={ADD_MONEY_CAROUSEL_DUMMY} statusText="Deposit Successfully" />

        {/* Wallet card */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
          <View style={[styles.innerCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <Text style={[styles.name, { color: colors.text }]}>{ user?.username ? user.username : "User"}</Text>
            <Text style={[styles.mobile, { color: colors.textSecondary }]}>{ user?.mobileNumber ? user.mobileNumber : "User"}</Text>
            <View style={{ width: "70%", borderWidth: 1, borderColor: colors.divider }}></View>
            <View style={[styles.balanceStrip, { backgroundColor: colors.background }]}>
              <Text style={[styles.balanceLabel, { color: colors.text }]}>Available Balance</Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>₹ {user?.balance ? user.balance : '0.0'}</Text>
            </View>
          </View>

          {/* help section */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.helpTitle, { color: colors.text }]}>
            For Fund Query's please Call Or Whatsapp
          </Text>

          <View style={styles.helpBtns}>
            <TouchableOpacity style={[styles.helpBtn, { backgroundColor: colors.background, shadowColor: colors.text }]} onPress={openDialer}>
              <MaterialIcons name="call" size={20} color={colors.text} />
              <Text style={[styles.helpText, { color: colors.text }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.helpBtn, { backgroundColor: colors.background, shadowColor: colors.text }]} onPress={openWhatsapp}>
              <MaterialCommunityIcons name="whatsapp" size={20} color='#1ed514' />
              <Text style={[styles.helpText, { color: colors.text }]}>Whatsapp</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* amount input */}
          <View style={[styles.amountInputWrap, { borderColor: colors.primary, backgroundColor: colors.background }]}>
            <View style={[styles.bankIcon, { backgroundColor: colors.primaryIconBg }]}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <TextInput
              placeholder="Enter Amount"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              style={[styles.amountInput, { color: colors.text }]}
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
                    { borderColor: colors.border, backgroundColor: colors.background },
                    selected && {
                      borderColor: colors.primary,
                      backgroundColor: colors.surface,
                    },
                    payLoading && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: colors.text },
                      selected && { color: colors.primary, fontWeight: '700' },
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
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: colors.primary, shadowColor: colors.text }, isDisabled && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {payLoading ? (
            <ActivityIndicator color={colors.background} />
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
  container: { flex: 1 },

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
    fontSize: 14,
    fontWeight: '900',
  },

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
    fontSize: 26,
  },

  // card
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
    alignItems: 'center',
  },
  presetText: {
    fontSize: 18,
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
});