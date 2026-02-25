import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Snackbar from "react-native-snackbar";
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const UserCheck = ({ navigation }) => {
  const { userCheck } = useContext(AuthContext);
  const { colors } = useTheme();

  const [mobileNumber, setMobileNumber] = useState("");

  const handleNext = () => {
    const phoneRegex = /^[0-9]{10}$/;
    const val = String(mobileNumber || "").trim();

    if (!val) {
      Snackbar.show({
        text: "Please enter your mobile number",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.error || "#d32f2f",
      });
      return;
    }

    if (!phoneRegex.test(val)) {
      Snackbar.show({
        text: "Please enter a valid 10-digit mobile number",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.error || "#d32f2f",
      });
      return;
    }

    userCheck(val, navigation);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["bottom", "top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollGrow}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Title Row like screenshot */}
          <View style={styles.titleRow}>
            <View
              style={[styles.primaryBar, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              ENTER YOUR MOBILE{"\n"}NUMBER
            </Text>
          </View>

          {/* Big Illustration */}
          <Image
            source={require("../../assets/Images/UserCheck.webp")}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Input pill */}
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.text,
              },
            ]}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons
                name="cellphone"
                size={28}
                color={colors.onPrimary || "#fff"}
              />
            </View>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter Mobile Number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              value={mobileNumber}
              maxLength={10}
              onChangeText={(t) => {
                const digits = String(t || "").replace(/[^0-9]/g, "");

                // handle common paste formats: +91XXXXXXXXXX / 91XXXXXXXXXX / 0XXXXXXXXXX
                if (digits.length === 12 && digits.startsWith("91")) {
                  setMobileNumber(digits.slice(2));
                  return;
                }
                if (digits.length === 11 && digits.startsWith("0")) {
                  setMobileNumber(digits.slice(1));
                  return;
                }

                setMobileNumber(digits.slice(0, 10));
              }}
            />
          </View>

          {/* Next button */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextText, { color: colors.onPrimary || "#fff" }]}>
              NEXT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserCheck;

const styles = StyleSheet.create({
  safe: { flex: 1 },

  scrollGrow: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    alignItems: "center",
  },

  titleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 10,
  },
  primaryBar: {
    width: 10,
    height: 50,
    borderRadius: 2,
    marginTop: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  image: {
    width: "92%",
    height: 300,
    marginTop: 10,
    marginBottom: 10,
  },

  inputPill: {
    width: "98%",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingRight: 18,
    marginTop: 12,

    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginRight: 14,
  },

  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
  },

  nextBtn: {
    width: "92%",
    marginTop: 26,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  nextText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
});