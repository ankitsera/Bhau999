import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#3FA16C";

const BankDetails = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const handleSave = () => {
    // TODO: Validate and submit API
    console.log("Bank Details:", { holderName, accountNumber, ifsc });
  };

  return (
    <View style={styles.container}>
      {/* --- Green Header --- */}
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
          <Text style={styles.headerTitle}>Update Bank Detail</Text>
          <View style={{ width: 26 }} />
        </View>
      </View>

      {/* --- Inputs --- */}
      <View style={styles.form}>
        {/* Account Holder Name */}
        <View style={styles.inputContainer}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="person-outline" size={22} color={GREEN} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Account Holder Name"
            placeholderTextColor="#777"
            value={holderName}
            onChangeText={setHolderName}
          />
        </View>

        {/* Bank Account Number */}
        <View style={styles.inputContainer}>
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
        <View style={styles.inputContainer}>
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

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, !(holderName && accountNumber && ifsc) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={!(holderName && accountNumber && ifsc)}
          activeOpacity={0.85}
        >
          <Text style={styles.saveText}>Save Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BankDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },

  // --- Header ---
  headerRoot: { width: "100%" },
  headerBg: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 110,
    backgroundColor: GREEN,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    color: "#000",
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 6,
  },

  // --- Form ---
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
    borderColor: GREEN,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 16,
    width: "95%",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e9f8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },

  // --- Save Button ---
  saveBtn: {
    backgroundColor: GREEN,
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