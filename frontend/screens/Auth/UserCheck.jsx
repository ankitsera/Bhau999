import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Snackbar from "react-native-snackbar";
import { AuthContext } from "../../contexts/AuthContext";
import { getCallSupport, getWhatsappSupport } from "../../utils/AppConfigService";
import { ThemeColor } from "../../contexts/Themes";

const UserCheck = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const { userCheck } = useContext(AuthContext);

  // ✅ from AppConfigService (defaults already handled there)
  const [callSupport, setCallSupport] = useState("");
  const [whatsappSupport, setWhatsappSupport] = useState("");

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [callNo, waNo] = await Promise.all([
          getCallSupport(),
          getWhatsappSupport(),
        ]);

        if (!mounted) return;
        setCallSupport(String(callNo || ""));
        setWhatsappSupport(String(waNo || ""));
      } catch (e) {
        // helpers already handle defaults/critical behavior; keep screen silent
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const openDialer = () => {
    if (!callSupport) return;
    Linking.openURL(`tel:+91${callSupport}`).catch(() => {});
  };

  const openWhatsapp = () => {
    if (!whatsappSupport) return;
    Linking.openURL(`https://wa.me/91${whatsappSupport}`).catch(() => {});
  };

  const handleLogin = () => {
    const phoneRegex = /^[0-9]{10}$/;

    if (mobileNumber.trim() === "") {
      Snackbar.show({
        text: "Please enter your mobile number",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    } else if (!phoneRegex.test(mobileNumber)) {
      Snackbar.show({
        text: "Please enter a valid 10-digit mobile number",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    } else {
      userCheck(mobileNumber, navigation);
    }
  };

  return (
    <SafeAreaProvider style={styles.container}>
      {/* Theme Header */}
      <View style={styles.headerBg}></View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration */}
        <Image
          source={require("../../assets/Images/UserCheck.webp")} // Replace with your local image
          style={styles.image}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>ENTER YOUR MOBILE NUMBER</Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="cellphone" size={22} color={ThemeColor} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            placeholderTextColor="#777"
            value={mobileNumber}
            onChangeText={(text) => {
              const digits = String(text || "").replace(/[^0-9]/g, "");

              // Handle common India paste formats cleanly:
              // 1) +91XXXXXXXXXX or 91XXXXXXXXXX (12 digits) => keep XXXXXXXXXX
              if (digits.length === 12 && digits.startsWith("91")) {
                setMobileNumber(digits.slice(2));
                return;
              }

              // 2) 0XXXXXXXXXX (11 digits) => keep XXXXXXXXXX
              if (digits.length === 11 && digits.startsWith("0")) {
                setMobileNumber(digits.slice(1));
                return;
              }

              // Normal typing: keep first 10 digits (extra accidental digit is ignored)
              setMobileNumber(digits.slice(0, 10));
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
            <TouchableOpacity style={styles.circleButton}
              onPress={openDialer}
            >
              <MaterialCommunityIcons name="phone-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleButton}
              onPress={openWhatsapp}
            >
              <MaterialCommunityIcons name="whatsapp" size={22} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomText}>
            <Text style={{fontWeight:"bold"}}>Don't have an account</Text> 
            <TouchableOpacity
              onPress={()=>{navigation.navigate("Signup")}}>
              <Text style={styles.signUp}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaProvider>
  );
};

export default UserCheck;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBg: {
    height: 200,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    backgroundColor: ThemeColor,
  },

  // ----- Content Card -----
  content: {
    flex: 1,
    alignItems: "center",
    marginTop: 90,
    backgroundColor: "#fff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingBottom: 32,
    zIndex: 1,
    elevation: 10,
    shadowColor: "#000",
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
    elevation: 4, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
    backgroundColor: ThemeColor,
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
  bottomText:{
    flexDirection: "row",
    marginTop: 15,
    gap: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  signUp: {
    fontSize: 17,
    fontWeight: "bold",
    color: ThemeColor,
  },
});
