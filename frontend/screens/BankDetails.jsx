import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { PaymentsContext } from '../contexts/PaymentsContext';
import ThemeHeader from '../components/ThemeHeader';
import { useTheme } from '../contexts/ThemeContext';

const RED = '#cc1f1f';
const GREY = '#E5E5E5';

const isIfscSyntaxOk = (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v?.trim());

const BankDetails = () => {
  const { t } = useTranslation(['screens', 'validation', 'common']);
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const { resolveIFSC, savePayout, loading } = useContext(PaymentsContext);

  // form state
  const [accountHolderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfsc] = useState('');

  // IFSC resolution
  const [bankMeta, setBankMeta] = useState(null);
  const [ifscQuerying, setIfscQuerying] = useState(false);
  const [ifscError, setIfscError] = useState(null);

  // ---- PREFILL FROM USER ----
  useEffect(() => {
    if (!user) return;

    setHolderName(user.accountHolderName || '');
    setAccountNumber(user.accountNumber || '');
    setIfsc(user.ifscCode || '');

    if (user.ifscCode) {
      (async () => {
        try {
          setIfscQuerying(true);
          setIfscError(null);
          const meta = await resolveIFSC(user.ifscCode);
          if (meta?.bank && meta?.branch) setBankMeta(meta);
        } catch {
          setBankMeta(null);
        } finally {
          setIfscQuerying(false);
        }
      })();
    }
  }, [user, resolveIFSC]);

  // ---- IFSC lookup (debounced) ----
  useEffect(() => {
    let cancelled = false;

    setIfscError(null);
    setBankMeta(null);

    const v = ifscCode.trim().toUpperCase();
    if (!isIfscSyntaxOk(v)) return;

    const t = setTimeout(async () => {
      try {
        setIfscQuerying(true);
        const meta = await resolveIFSC(v);

        if (!cancelled) {
          if (meta?.bank && meta?.branch) setBankMeta(meta);
          else setIfscError('IFSC not found');
        }
      } catch {
        if (!cancelled) setIfscError('IFSC not found');
      } finally {
        if (!cancelled) setIfscQuerying(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ifscCode, resolveIFSC]);

  // ---- VALIDATION ----
  const bankValid = useMemo(
    () =>
      accountHolderName.trim().length > 1 &&
      accountNumber.trim().length >= 9 &&
      isIfscSyntaxOk(ifscCode) &&
      !!bankMeta,
    [accountHolderName, accountNumber, ifscCode, bankMeta]
  );

  const canSave = bankValid && !ifscQuerying && !ifscError;

  // ---- SAVE ----
  const handleSave = async () => {
    if (!canSave) return;

    await savePayout({
      type: 'bank',
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
    });
  };

  // ---- BORDER COLORS ----
  const ifscBorderColor =
    ifscCode.length > 0 && (!isIfscSyntaxOk(ifscCode) || ifscError)
      ? RED
      : bankMeta
      ? colors.primary
      : GREY;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('screens:updateBankDetails')} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/Images/logo.webp')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.form}>
        {/* Account Holder Name */}
        <View style={[styles.inputPill, { borderColor: GREY, backgroundColor: colors.surface || '#fff' }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryIconBg }]}>
            <MaterialIcons name="person-outline" size={22} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('screens:accountHolderName')}
            placeholderTextColor={colors.textTertiary}
            value={accountHolderName}
            onChangeText={setHolderName}
            autoCapitalize="words"
          />
        </View>

        {/* Account Number */}
        <View style={[styles.inputPill, { borderColor: GREY, backgroundColor: colors.surface || '#fff' }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryIconBg }]}>
            <MaterialCommunityIcons name="credit-card-outline" size={22} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('screens:bankAccountNumber')}
            placeholderTextColor={colors.textTertiary}
            value={accountNumber}
            keyboardType="numeric"
            onChangeText={setAccountNumber}
          />
        </View>

        {/* IFSC */}
        <View style={[styles.inputPill, { borderColor: ifscBorderColor, backgroundColor: colors.surface || '#fff' }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryIconBg }]}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('screens:ifsc')}
            placeholderTextColor={colors.textTertiary}
            value={ifscCode}
            onChangeText={setIfsc}
            autoCapitalize="characters"
          />
        </View>

        {/* IFSC helper */}
        <View style={{ width: '95%', marginBottom: 10 }}>
          {ifscCode.length > 0 && !isIfscSyntaxOk(ifscCode) && (
            <Text style={[styles.hint, { color: RED }]}>{t('validation:pleaseEnterValidIFSC')}</Text>
          )}

          {isIfscSyntaxOk(ifscCode) && ifscQuerying && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('screens:lookingUpIFSC')}</Text>
          )}

          {ifscError && !ifscQuerying && (
            <Text style={[styles.hint, { color: RED }]}>{t('screens:ifscNotFound')}</Text>
          )}
        </View>

        {/* Secondary (non-editable) fields appear only after successful IFSC lookup */}
        {bankMeta && (
          <>
            <View style={[styles.inputPill, styles.disabledPill, { borderColor: GREY, backgroundColor: colors.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryIconBg }]}>
                <MaterialCommunityIcons name="bank" size={22} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.textSecondary }]}
                value={bankMeta.bank}
                editable={false}
              />
            </View>

            <View style={[styles.inputPill, styles.disabledPill, { borderColor: GREY, backgroundColor: colors.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryIconBg }]}>
                <MaterialCommunityIcons name="source-branch" size={22} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.textSecondary }]}
                value={bankMeta.branch}
                editable={false}
              />
            </View>
          </>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary },
            (!canSave || loading) && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={!canSave || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveText}>{loading ? t('common:saving').toUpperCase() : t('common:save').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

export default BankDetails;

const styles = StyleSheet.create({
  container: { flex: 1 },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    width: 280,
    height: 190,
  },

  form: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    width: '95%',
  },

  disabledPill: {
    opacity: 0.95,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  hint: {
    fontSize: 13,
    marginLeft: 8,
  },

  saveBtn: {
    marginTop: 18,
    width: '95%',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  saveText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});