import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { PaymentsContext } from "../contexts/PaymentsContext";

const GREEN = "#3FA16C";
const RED = "#cc1f1f";
const GREY = "#E5E5E5";

const isIfscSyntaxOk = (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v?.trim());
const isUpiSyntaxOk  = (v) => /^[\w.\-]{2,}@[a-zA-Z][\w\-]{2,}$/i.test(v?.trim());

const BankDetails = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { resolveIFSC, savePayout, loading } = useContext(PaymentsContext);

  // form state
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");

  // IFSC resolution state
  const [bankMeta, setBankMeta] = useState(null);
  const [ifscQuerying, setIfscQuerying] = useState(false);
  const [ifscError, setIfscError] = useState(null);

  const bankValid = useMemo(
    () =>
      holderName.trim().length > 1 &&
      accountNumber.trim().length >= 9 &&
      isIfscSyntaxOk(ifsc) &&
      !!bankMeta,
    [holderName, accountNumber, ifsc, bankMeta]
  );
  const upiValid = useMemo(() => isUpiSyntaxOk(upiId), [upiId]);

  // MUTUAL EXCLUSION: user cannot save both
  const bothFilled = bankValid && upiValid;
  const canSave = !bothFilled && (bankValid || upiValid);

  // Debounced IFSC lookup
  useEffect(() => {
    let cancelled = false;
    setIfscError(null);
    setBankMeta(null);

    const v = ifsc.trim().toUpperCase();
    if (!isIfscSyntaxOk(v)) return;

    const t = setTimeout(async () => {
      try {
        setIfscQuerying(true);
        const meta = await resolveIFSC(v);
        if (!cancelled) {
          if (meta?.bank && meta?.branch) setBankMeta(meta);
          else setIfscError("IFSC not found");
        }
      } catch {
        if (!cancelled) setIfscError("IFSC not found");
      } finally {
        if (!cancelled) setIfscQuerying(false);
      }
    }, 400);

    return () => { cancelled = true; clearTimeout(t); };
  }, [ifsc, resolveIFSC]);

  const handleSave = async () => {
    if (!canSave) return;

    if (bankValid) {
      await savePayout({
        type: "bank",
        holderName: holderName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        bank: bankMeta?.bank,
        branch: bankMeta?.branch,
      });
      navigation.goBack();
      return;
    }

    if (upiValid) {
      await savePayout({ type: "upi", upiId: upiId.trim() });
      navigation.goBack();
    }
  };

  const ifscTouched = ifsc.length > 0;
  const upiTouched  = upiId.length > 0;

  const ifscBorderColor =
    bothFilled ? RED :
    (ifscTouched && (!isIfscSyntaxOk(ifsc) || ifscError)) ? RED :
    bankMeta ? GREEN : GREY;

  const upiBorderColor =
    bothFilled ? RED :
    (upiTouched && !upiValid) ? RED : GREY;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerRoot, { paddingTop: insets.top }]}>
        <View style={styles.headerBg} />
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ paddingRight: 8 }}>
            <MaterialIcons name="arrow-back" size={26} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Update Bank Detail</Text>
          <View style={{ width: 26 }} />
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Holder Name */}
        <View style={[styles.inputContainer, { borderColor: GREY }]}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="person-outline" size={22} color={GREEN} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Account Holder Name"
            placeholderTextColor="#777"
            value={holderName}
            onChangeText={setHolderName}
            autoCapitalize="words"
          />
        </View>

        {/* Account Number */}
        <View style={[styles.inputContainer, { borderColor: GREY }]}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={GREEN} />
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
            <MaterialCommunityIcons name="bank-outline" size={22} color={GREEN} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="IFSC"
            placeholderTextColor="#777"
            value={ifsc}
            onChangeText={setIfsc}
            autoCapitalize="characters"
          />
        </View>

        {/* IFSC helper */}
        <View style={{ width: "95%", marginBottom: 8 }}>
          {ifscTouched && !isIfscSyntaxOk(ifsc) && (
            <Text style={[styles.hint, { color: RED }]}>Please enter a valid IFSC Code</Text>
          )}
          {isIfscSyntaxOk(ifsc) && ifscQuerying && (
            <Text style={styles.hint}>Looking up IFSC…</Text>
          )}
          {ifscError && !ifscQuerying && (
            <Text style={[styles.hint, { color: RED }]}>{ifscError}</Text>
          )}
        </View>

        {/* Readonly bank/branch */}
        {bankMeta && (
          <>
            <View style={styles.inputContainerDisabled}>
              <View style={[styles.iconWrap, { backgroundColor: "#f4f4f4" }]}>
                <MaterialCommunityIcons name="bank-check" size={20} color="#777" />
              </View>
              <TextInput style={[styles.input, { color: "#555" }]} value={bankMeta.bank} editable={false} />
            </View>
            <View style={styles.inputContainerDisabled}>
              <View style={[styles.iconWrap, { backgroundColor: "#f4f4f4" }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#777" />
              </View>
              <TextInput style={[styles.input, { color: "#555" }]} value={bankMeta.branch} editable={false} />
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
            <MaterialCommunityIcons name="qrcode-scan" size={22} color={GREEN} />
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

        {/* UPI helper */}
        {upiTouched && !upiValid && (
          <View style={{ width: "95%", marginBottom: 8 }}>
            <Text style={[styles.hint, { color: RED }]}>Please enter a valid UPI ID</Text>
          </View>
        )}

        {/* both-filled error */}
        {bothFilled && (
          <View style={{ width: "95%", marginBottom: 8 }}>
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
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  headerRoot: { width: '100%' },
  headerBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 110,
    backgroundColor: GREEN, borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  headerRow: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { flex: 1, color: '#000', fontSize: 22, fontWeight: '600', marginLeft: 6 },

  form: { flex: 1, padding: 16, alignItems: 'center', marginTop: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: GREEN, borderRadius: 40,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    marginBottom: 12, width: '95%',
  },
  inputContainerDisabled: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: '#E5E5E5', backgroundColor: '#FAFAFA',
    borderRadius: 40, paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 12, width: '95%',
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#e9f8f0',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  input: { flex: 1, fontSize: 16, color: '#000' },
  hint: { color: '#555' },
  orRow: { width: '95%', flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: '#DDD' },
  orText: { color: '#111', fontWeight: '800' },
  saveBtn: {
    backgroundColor: GREEN, borderRadius: 30, paddingVertical: 14,
    width: '60%', alignItems: 'center', justifyContent: 'center', marginTop: 10,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },
  saveText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});