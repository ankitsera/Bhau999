import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../contexts/AuthContext';
import { PaymentsContext } from '../contexts/PaymentsContext';
import ThemeHeader from '../components/Header';
import { ThemeColor, ThemeIconBg } from '../contexts/Themes';

const RED   = '#cc1f1f';
const GREY  = '#E5E5E5';

const isIfscSyntaxOk = (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v?.trim());
const isUpiSyntaxOk  = (v) => /^[\w.\-]{2,}@[a-zA-Z][\w\-]{2,}$/i.test(v?.trim());

const BankDetails = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { resolveIFSC, savePayout, loading } = useContext(PaymentsContext);

  // form state
  const [accountHolderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

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
    setUpiId(user.upiId || '');

    if (user.ifscCode) {
      (async () => {
        try {
          setIfscQuerying(true);
          const meta = await resolveIFSC(user.ifscCode);
          if (meta?.bank && meta?.branch) setBankMeta(meta);
        } finally {
          setIfscQuerying(false);
        }
      })();
    }
  }, [user, resolveIFSC]);

  // ---- VALIDATION ----

  const bankValid = useMemo(
    () =>
      accountHolderName.trim().length > 1 &&
      accountNumber.trim().length >= 9 &&
      isIfscSyntaxOk(ifscCode) &&
      !!bankMeta,
    [accountHolderName, accountNumber, ifscCode, bankMeta]
  );

  const upiValid = useMemo(() => isUpiSyntaxOk(upiId), [upiId]);

  // detect typed fields (even partial)
  const hasBankInput =
    accountHolderName.trim().length > 0 ||
    accountNumber.trim().length > 0 ||
    ifscCode.trim().length > 0;

  const hasUpiInput = upiId.trim().length > 0;

  const hasIfscError =
    (ifscCode.length > 0 && !isIfscSyntaxOk(ifscCode)) || !!ifscError;

  const hasUpiError = hasUpiInput && !upiValid;

  // full conflict = both methods valid
  const fullConflict = bankValid && upiValid;

  // partial conflict = one valid, the other has any input but is not valid
  const partialBankConflict = upiValid && hasBankInput && !bankValid;
  const partialUpiConflict  = bankValid && hasUpiInput && !upiValid;

  const partialConflict = partialBankConflict || partialUpiConflict;

  // final gate
  const hasAnyError = hasIfscError || hasUpiError || fullConflict || partialConflict;
  const canSave = (bankValid || upiValid) && !hasAnyError;

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

  // ---- SAVE ----
  const handleSave = async () => {
    if (!canSave) return;

    if (bankValid) {
      await savePayout({
        type: "bank",
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      return;
    }

    if (upiValid) {
      await savePayout({
        type: "upi",
        upiId: upiId.trim(),
      });
    }
  };

  // ---- BORDER COLORS ----
  const ifscBorderColor =
    fullConflict || partialConflict
      ? RED
      : ifscCode.length > 0 && (!isIfscSyntaxOk(ifscCode) || ifscError)
      ? RED
      : bankMeta
      ? ThemeColor
      : GREY;

  const upiBorderColor =
    fullConflict || partialConflict
      ? RED
      : upiId.length > 0 && !upiValid
      ? RED
      : GREY;

  return (
    <View style={styles.container}>
      <ThemeHeader title="Update Bank Details" />

      <View style={styles.form}>
        {/* Holder Name */}
        <View style={[styles.inputContainer, { borderColor: GREY }]}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="person-outline" size={22} color={ThemeColor} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Account Holder Name"
            placeholderTextColor="#777"
            value={accountHolderName}
            onChangeText={setHolderName}
            autoCapitalize="words"
          />
        </View>

        {/* Account number */}
        <View style={[styles.inputContainer, { borderColor: GREY }]}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={ThemeColor} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Bank Account number"
            placeholderTextColor="#777"
            value={accountNumber}
            keyboardType="numeric"
            onChangeText={setAccountNumber}
          />
        </View>

        {/* IFSC */}
        <View style={[styles.inputContainer, { borderColor: ifscBorderColor }]}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={ThemeColor} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="IFSC"
            placeholderTextColor="#777"
            value={ifscCode}
            onChangeText={setIfsc}
            autoCapitalize="characters"
          />
        </View>

        {/* IFSC helper */}
        <View style={{ width: '95%', marginBottom: 8 }}>
          {ifscCode.length > 0 && !isIfscSyntaxOk(ifscCode) && (
            <Text style={[styles.hint, { color: RED }]}>
              Please enter a valid IFSC Code
            </Text>
          )}

          {isIfscSyntaxOk(ifscCode) && ifscQuerying && (
            <Text style={styles.hint}>Looking up IFSC…</Text>
          )}

          {ifscError && !ifscQuerying && (
            <Text style={[styles.hint, { color: RED }]}>{ifscError}</Text>
          )}
        </View>

        {/* IFSC lookup results */}
        {bankMeta && (
          <>
            <View style={styles.inputContainerDisabled}>
              <View style={[styles.iconWrap, { backgroundColor: "#f4f4f4" }]}>
                <MaterialCommunityIcons name="bank-check" size={20} color="#777" />
              </View>
              <TextInput
                style={[styles.input, { color: "#555" }]}
                value={bankMeta.bank}
                editable={false}
              />
            </View>

            <View style={styles.inputContainerDisabled}>
              <View style={[styles.iconWrap, { backgroundColor: "#f4f4f4" }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#777" />
              </View>
              <TextInput
                style={[styles.input, { color: "#555" }]}
                value={bankMeta.branch}
                editable={false}
              />
            </View>
          </>
        )}

        {/* OR */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* UPI */}
        <View style={[styles.inputContainer, { borderColor: upiBorderColor }]}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="qrcode-scan" size={22} color={ThemeColor} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter UPI ID (e.g. name@bank)"
            placeholderTextColor="#777"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />
        </View>

        {/* UPI error */}
        {hasUpiInput && !upiValid && (
          <View style={{ width: '95%', marginBottom: 8 }}>
            <Text style={[styles.hint, { color: RED }]}>
              Please enter a valid UPI ID
            </Text>
          </View>
        )}

        {/* ONE merged conflict message */}
        {(fullConflict || partialConflict) && (
          <View style={{ width: '95%', marginBottom: 8 }}>
            <Text style={[styles.hint, { color: RED }]}>
              Please enter either Bank details or UPI — not both.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || loading) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={!canSave || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveText}>{loading ? "Saving..." : "Save Detail"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BankDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  form: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ThemeColor,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 12,
    width: "95%",
  },

  inputContainerDisabled: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    width: "95%",
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ThemeIconBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },

  hint: { color: "#555" },

  orRow: {
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDD",
  },

  orText: {
    color: "#111",
    fontWeight: "800",
  },

  saveBtn: {
    backgroundColor: ThemeColor,
    borderRadius: 30,
    paddingVertical: 14,
    width: "60%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});