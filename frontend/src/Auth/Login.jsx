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

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleLogin = () => {
    const phoneRegex = /^[0-9]{10}$/;

    if (phoneNumber.trim() === "") {
      Alert.alert("Validation Error", "Please enter your mobile number");
    } else if (!phoneRegex.test(phoneNumber)) {
      Alert.alert("Validation Error", "Please enter a valid 10-digit mobile number");
    } else {
      Alert.alert("Success", "Mobile number is valid ✅");
      // Proceed with navigation or OTP logic here
    }
  };

  return (
    <SafeAreaProvider style={styles.container}>
      {/* Green Header */}
      <View style={styles.headerBg}></View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration */}
        {/* <Image
          source={require("../assets/login_image.png")} // Replace with your local image
          style={styles.image}
          resizeMode="contain"
        /> */}

        {/* Title */}
        <Text style={styles.title}>ENTER YOUR MOBILE NUMBER</Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Icon name="call-outline" size={22} color="#00A86B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            placeholderTextColor="#777"
            value={phoneNumber}
            onChangeText={(text) => {
              // Allow only numbers and limit to 10 digits
              const sanitized = text.replace(/[^0-9]/g, "").slice(0, 10);
              setPhoneNumber(sanitized);
            }}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* Bottom Section */}
        <View style={styles.bottomContainer}>
          <View style={styles.separator} />
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.circleButton}>
              <Icon name="call-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleButton}>
              <Icon name="logo-whatsapp" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaProvider>
  );
};

export default Login;

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
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#3FA16C",
    borderRadius: 25,
    paddingVertical: 12,
    width: "85%",
    marginTop: 25,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  bottomContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    width: "90%",
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 25,
  },
  circleButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
});
