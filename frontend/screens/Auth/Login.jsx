// src/screens/Login.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

const GREEN = "#328555ff";
const TILE_GREEN = "#41B773";

const TileIcon = ({ name }) => (
  <View style={styles.tile}>
    <Icon name={name} size={26} color="#fff" />
  </View>
);

const Login = ({ route }) => {
  const phoneNumber = route?.params?.phoneNumber || "1234567890";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const onLogin = () => {
    // TODO: auth
    console.log("login with", phoneNumber, password);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Green header */}
      <View style={styles.headerBg} />

      {/* White rounded sheet */}
      <View style={styles.card}>
        <View style={styles.textHeader}>
          <Text style={styles.title}>Login Now</Text>
          <Text style={styles.subtitle}>Sign in your account</Text>
          <Text style={[styles.subtitle, { marginTop: 4 }]}>Enter Your Password</Text>
        </View>

        {/* Phone (read-only) */}
        <View style={[styles.fieldContainer, phoneFocused && styles.inputFocused]}>
          <TileIcon name="phone-portrait-outline" />
          <TextInput
            style={styles.input}
            value={phoneNumber}
            editable={false}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
          />
        </View>

        {/* Password (inline, with eye on the right) */}
        <View style={[styles.fieldContainer, passFocused && styles.inputFocused]}>
          <TileIcon name="key-outline" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(v => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Icon
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity style={styles.loginBtn} onPress={onLogin} activeOpacity={0.85}>
          <Text style={styles.loginText}>Login</Text>
          <Icon name="chevron-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  headerBg: {
    height: 200,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    backgroundColor: "#3FA16C",
  },

  card: {
    flex: 1,
    marginTop: 60,
    backgroundColor: "#fff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    zIndex: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },

  textHeader: {
    marginLeft: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
    color: "#121212",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#303030",
    opacity: 0.8,
  },

  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 22,

    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  inputFocused: {
    borderWidth: 1,
    borderColor: GREEN,
  },

  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: TILE_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 18,
    color: "#000",
    paddingRight: 8, // breathing room before eye icon
  },

  loginBtn: {
    marginTop: 28,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TILE_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 36,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  loginText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});