import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from 'react-native-vector-icons/Ionicons';

// ✅ AppConfig helpers (defaults already inside these)
import {
  getHeadline,
  getCallSupport,
  getWhatsappSupport,
} from "../utils/AppConfigService";
import { useTheme } from "../contexts/ThemeContext";

// kept as fallback initial values (helpers already have same defaults)
const CONTACT_NUMBER = "7757033237";
const WHATSAPP_NUMBER = "7757033237";
const MARQUEE_TEXT =
  "Play Daily - Win Big! ₹1Cr+ Winnings Everyday 💸 SARA777 : Safe ✅ Fast⚡Real Results हर दिन ₹1Cr+ जीतनेका मौका – सिर्फ SARA777 पर!";

const normalizeDigits = (v) => String(v || "").replace(/\D/g, "");

const TopStrip = ({ navigation }) => {
  const { colors } = useTheme();

  // ✅ config-driven values
  const [headlineText, setHeadlineText] = useState(MARQUEE_TEXT);
  const [callNumber, setCallNumber] = useState(CONTACT_NUMBER);
  const [waNumber, setWaNumber] = useState(WHATSAPP_NUMBER);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const [h, c, w] = await Promise.all([
          getHeadline(),
          getCallSupport(),
          getWhatsappSupport(),
        ]);

        if (!mounted) return;

        if (h) setHeadlineText(String(h));
        if (c) setCallNumber(String(c));
        if (w) setWaNumber(String(w));
      } catch {
        // rely on defaults already set
      }
    };

    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  /** helper functions */
  const openDialer = () =>
    Linking.openURL(`tel:+91${callNumber}`).catch(() => {});

  const openWhatsApp = async () => {
    const digits = normalizeDigits(waNumber); // whatsapp wants digits
    try {
      return await Linking.openURL(
        `whatsapp://send?phone=${digits}&text=${encodeURIComponent(
          "Hi, I need assistance!"
        )}`
      );
    } catch { }
  };

  // marquee animation
  const [textW, setTextW] = useState(0);
  const animX = useRef(new Animated.Value(0)).current;
  const animRefRef = useRef(null);
  const speed = 60;
  const gap = 80;

  useEffect(() => {
    if (!textW) return;

    // Stop any previous animation
    if (animRefRef.current) {
      animRefRef.current.stop();
    }

    const distance = textW + gap;
    const duration = (distance / speed) * 1000;

    // Reset to start position
    animX.setValue(20);

    // Create looping animation using Animated.loop
    animRefRef.current = Animated.loop(
      Animated.timing(animX, {
        toValue: -distance + 10,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animRefRef.current.start();

    return () => {
      if (animRefRef.current) {
        animRefRef.current.stop();
      }
    };
  }, [textW, gap, speed, animX]);

  // Button handlers
  const handleLuckyStarline = () => {
    navigation.navigate("Add Money");
  };

  const handleLuckyJackpot = () => {
    navigation.navigate("Withdraw Money");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* marquee text */}
      <View style={styles.marqueeWrap}>
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            transform: [{ translateX: animX }],
            width: textW > 0 ? (textW + gap) * 2 + 20 : 1000,
          }}
        >
          {/* Initial Spacer to prevent clipping on start */}
          <View style={{ width: 10 }} />

          <Text
            numberOfLines={1}
            style={[styles.marqueeText, { color: colors.error }]}
            onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
          >
            {headlineText}
          </Text>

          <View style={{ width: gap }} />

          <Text numberOfLines={1} style={[styles.marqueeText, { color: colors.error }]}>
            {headlineText}
          </Text>
        </Animated.View>
      </View>

      {/* pill buttons */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.pill, { backgroundColor: colors.primary }]}
          onPress={handleLuckyStarline}
        >
          <View style={[styles.pillIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="wallet-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.pillText, { color: colors.text }]}>Add Fund</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.pill, { backgroundColor: colors.primary }]}
          onPress={handleLuckyJackpot}
        >
          <View style={[styles.pillIcon, { backgroundColor: colors.background }]}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.pillText, { color: colors.text }]}>Withdraw Fund</Text>
        </TouchableOpacity>
      </View>

      {/* contact rows */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginHorizontal: 20,
        }}
      >
        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="cellphone" size={22} color={colors.text} />
          <TouchableOpacity onPress={openDialer} activeOpacity={0.7}>
            <Text style={[styles.contactText, { color: colors.text }]}>{normalizeDigits(callNumber)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="whatsapp" size={22} color='#1fa851ff' />
          <TouchableOpacity onPress={openWhatsApp} activeOpacity={0.7}>
            <Text style={[styles.contactText, { color: colors.text }]}>{normalizeDigits(waNumber)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TopStrip;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  marqueeWrap: {
    overflow: "hidden",
    height: 24,
    marginBottom: 8,
  },
  marqueeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  pillsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pillIcon: {
    width: 26,
    height: 26,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  pillText: {
    fontWeight: "900",
    fontSize: 14,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: "600",
  },
});