import React, { useContext, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ButtonLoader from '../../components/ButtonLoader';
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

const PRESET_AMOUNTS = [100, 200, 500, 1000, 1500, 2000, 5000, 10000];


const AddMoney = ({ navigation }) => {
  const { t } = useTranslation(['screens', 'funds', 'common']);
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const { addMoney, loading: payLoading, gatewayUi, closeGatewayUi } = useContext(PaymentsContext);

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

  // ✅ tighter disable logic (handles " ", "0", etc.)
  const amtNum = useMemo(() => Number(String(amount).trim()), [amount]);
  const isDisabled = !Number.isFinite(amtNum) || amtNum <= 0 || payLoading;

  const handleAdd = async () => {
    try {
      if (!Number.isFinite(amtNum) || amtNum <= 0) {
        Alert.alert(t('screens:invalidAmount'), t('screens:pleaseEnterValidAmount'));
        return;
      }

      const minDep = Number(minDeposit) || 0;
      if (minDep > 0 && amtNum < minDep) {
        Alert.alert(t('screens:invalidAmount'), t('screens:minimumDepositAmount', { amount: minDep }));
        return;
      }

      await addMoney({
        amountRupees: amtNum,
        payeeVpa: upiId,
        payeeName: bankingName,
        note: t('common:paymentTo', { name: bankingName }),
      });

      setAmount('');
    } catch (e) {
      Alert.alert(t('screens:paymentFailed'), e?.message || t('common:somethingWentWrong'));
    }
  };

    const modalTitle =
    gatewayUi?.step === 'opening'
      ? t('funds:openingUpi')
      : gatewayUi?.step === 'confirming'
      ? t('funds:confirmingPayment')
      : gatewayUi?.step === 'success'
      ? t('funds:paymentSuccess')
      : gatewayUi?.step === 'fail'
      ? t('funds:paymentUpdate')
      : t('funds:payment');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('funds:addFund')} />

      <ScrollView
        contentContainerStyle={[fundStyles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AccountCard
          user={user}
          tiles={[
            { label: t('screens:availableBalance'), value: `₹${user?.balance ? user.balance : '0.00'}` },
            { label: t('funds:minimumDeposit'), value: minDeposit > 0 ? `₹${minDeposit}` : '--' },
          ]}
        />

        <SectionLabel>{t('funds:enterAmount')}</SectionLabel>
        <AmountInput value={amount} onChange={setAmount} editable={!payLoading} />

        {/* Quick amounts */}
        <View style={styles.presets}>
          {PRESET_AMOUNTS.map((v) => {
            const selected = amtNum === v;
            const belowMin = minDeposit > 0 && v < minDeposit;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => setPreset(v)}
                disabled={payLoading || belowMin}
                activeOpacity={0.8}
                style={[
                  styles.presetBtn,
                  { borderColor: colors.primaryTile, backgroundColor: colors.primaryIconBg },
                  selected && { borderColor: colors.primary, backgroundColor: colors.primary },
                  (payLoading || belowMin) && styles.presetDisabled,
                ]}
              >
                <Text
                  style={[styles.presetText, { color: selected ? colors.onPrimary : colors.primaryDark }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  ₹{v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          label={t('screens:payNow')}
          onPress={handleAdd}
          disabled={isDisabled}
          busy={payLoading}
          Loader={ButtonLoader}
        />

        <HelpRow onCall={openDialer} onWhatsapp={openWhatsapp} />
      </ScrollView>

      {/* Overlay modal */}
      <Modal
        visible={!!gatewayUi?.visible}
        transparent
        animationType="fade"
        onRequestClose={closeGatewayUi}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>{modalTitle}</Text>

            <View style={modalStyles.spacer} />

            {(gatewayUi?.step === 'opening' ||
              gatewayUi?.step === 'confirming') && (
              <ButtonLoader size={24} />
            )}

            <View style={modalStyles.spacer} />

            <Text style={modalStyles.msg}>
              {gatewayUi?.message || t('common:pleaseWait')}
            </Text>

            {!!gatewayUi?.custRefNum && (
              <Text style={modalStyles.refText}>
                {t('common:ref')}: {gatewayUi.custRefNum}
              </Text>
            )}

            <TouchableOpacity
              style={[modalStyles.btn, { backgroundColor: colors.primary }]}
              onPress={closeGatewayUi}
              activeOpacity={0.85}
            >
              <Text style={[modalStyles.btnText, { color: colors.background }]}>{t('common:close')}</Text>
            </TouchableOpacity>

            <Text style={modalStyles.hint}>
              {t('funds:closingWillHidePopup')}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddMoney;

const styles = StyleSheet.create({
  container: { flex: 1 },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 16,
  },
  presetBtn: {
    width: '23%',
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  presetDisabled: {
    opacity: 0.45,
  },
  presetText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  spacer: {
    height: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 8,
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  msg: {
    fontSize: FONT.label,
    color: '#111',
    textAlign: 'center',
  },
  refText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  btn: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '800',
    fontSize: FONT.body,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
