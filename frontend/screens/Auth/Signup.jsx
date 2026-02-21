import React, { useEffect, useState, useContext } from 'react';
import Snackbar from 'react-native-snackbar';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import PasswordInput from '../../components/PasswordInput';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Signup = ({ navigation, route }) => {
  const { colors } = useTheme();

  const { signup } = useContext(AuthContext);
  const routemobileNumber = route?.params?.mobileNumber || '';
  const isPhoneFromRoute = !!route?.params?.mobileNumber;
  const [mobileNumber, setMobileNumber] = useState(routemobileNumber);

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  //To make border match theme color on focus
  const [uFocused, setUFocused] = useState(false);

  const handleRegister = () => {
    if (!username.trim()) {
      Snackbar.show({
        text: 'Please enter a username',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
    } else if (!password.trim()) {
      Snackbar.show({
        text: 'Please enter a password',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
    } else if (password.length < 6) {
      Snackbar.show({
        text: 'Password must be at least 6 characters long',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
    } else if (password !== confirmPassword) {
      Snackbar.show({
        text: 'Passwords do not match',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#d32f2f',
      });
    } else {
      signup(mobileNumber, username, password, navigation);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Curved Green Header */}
      <View style={[styles.headerBg, { backgroundColor: colors.primary }]}></View>

      {/* White folding content card */}
      <View style={[styles.content, { backgroundColor: colors.background, shadowColor: colors.text }]}>
        {/* Illustration */}
        <Image
          source={require('../../assets/Images/signup.webp')}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: colors.text }]}>CREATE NEW ACCOUNT</Text>

        {/* Phone */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
          <MaterialCommunityIcons
            name="cellphone"
            size={22}
            color={colors.primary}
            style={styles.leftIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={mobileNumber}
            editable={!isPhoneFromRoute}
            placeholder="Phone Number"
            placeholderTextColor={colors.textTertiary}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* Username */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, shadowColor: colors.text }, uFocused && [styles.inputFocused, { borderColor: colors.primary }]]}>
          <MaterialCommunityIcons
            name="account-outline"
            size={22}
            color={colors.primary}
            style={styles.leftIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Username"
            placeholderTextColor={colors.textTertiary}
            value={username}
            onChangeText={setUsername}
            onFocus={() => setUFocused(true)}
            onBlur={() => setUFocused(false)}
          />
        </View>

        {/* Password */}
        <PasswordInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
        />

        {/* Confirm Password */}
        <PasswordInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
        >
          <Text style={styles.registerText}>Register & Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerBg: {
    height: 200,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },

  // ----- Content Card -----
  content: {
    flex: 1,
    alignItems: 'center',
    marginTop: 60,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingBottom: 32,
    zIndex: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },

  image: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 12,
    color: '#000',
  },

  // ----- Inputs -----
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    width: '85%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,

    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  inputFocused: {
    borderWidth: 1,
  },
  leftIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingRight: 8,
  },

  registerButton: {
    borderRadius: 25,
    paddingVertical: 12,
    width: '85%',
    marginTop: 16,
    alignItems: 'center',
  },
  registerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});