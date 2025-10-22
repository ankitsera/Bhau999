import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

const Signup = ({ route }) => {
  const { phoneNumber } = "123456"; // from Login screen
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    if (!username.trim()) {
      Alert.alert("Validation Error", "Please enter a username");
    } else if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter a password");
    } else if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long");
    } else if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
    } else {
      Alert.alert("Success", "Account created successfully ✅");
      // Later: Call your DB / API logic here
    }
  };

  return (
    <SafeAreaProvider style={styles.container}>
      {/* Green Header */}
      <View style={styles.headerBg}></View>

      {/* Content */}
      <View style={styles.content}>
        {/* Illustration */}
        {/* <Image
          source={require("../assets/signup_image.png")} // Replace with your image
          style={styles.image}
          resizeMode="contain"
        /> */}

        <Text style={styles.title}>CREATE NEW ACCOUNT</Text>

        {/* Mobile Number (Read-only) */}
        <View style={styles.inputContainer}>
          <Icon name="call-outline" size={22} color="#00A86B" style={styles.icon} />
          <TextInput
            style={[styles.input, { color: "#000" }]}
            value={phoneNumber}
            editable={false}
          />
        </View>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Icon name="person-outline" size={22} color="#00A86B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#777"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Icon name="lock-closed-outline" size={22} color="#00A86B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Icon name="lock-closed-outline" size={22} color="#00A86B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#777"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerText}>Register & Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBg: {
    height: 150,
    backgroundColor: "#3FA16C",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  content: {
    alignItems: "center",
    marginTop: -50,
  },
  image: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 15,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    width: "85%",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },
  registerButton: {
    backgroundColor: "#3FA16C",
    borderRadius: 25,
    paddingVertical: 12,
    width: "85%",
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
