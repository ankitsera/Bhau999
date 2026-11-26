import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
  Image,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from 'react-i18next';

// ✅ AppConfig helpers (defaults already inside these)
import {
  getHeadline,
  getCallSupport,
  getWhatsappSupport,
} from "../utils/AppConfigService";
import { useTheme } from "../contexts/ThemeContext";
import { useFeature, FEATURES } from "../utils/Features";

// kept as fallback initial values (helpers already have same defaults)
const CONTACT_NUMBER = "7757033237";
const WHATSAPP_NUMBER = "7757033237";
const MARQUEE_TEXT =
  "Play Daily - Win Big! ₹1Cr+ Winnings Everyday 💸 BHAU999 : Safe ✅ Fast⚡Real Results हर दिन ₹1Cr+ जीतनेका मौका – सिर्फ BHAU999 पर!";

const normalizeDigits = (v) => String(v || "").replace(/\D/g, "");

const TopStrip = ({ navigation }) => {
  const { t } = useTranslation(['common']);
  const { colors } = useTheme();
  const canPay = useFeature(FEATURES.PAYMENTS);

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
          t('common:whatsappMessage')
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
    <View style={styles.container}>
      {/* marquee pill */}
      <View style={[styles.marqueePill, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="bullhorn" size={17} color={colors.text} style={styles.marqueeIcon} />
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
              style={[styles.marqueeText, { color: colors.primaryDark }]}
              onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
            >
              {headlineText}
            </Text>

            <View style={{ width: gap }} />

            <Text numberOfLines={1} style={[styles.marqueeText, { color: colors.primaryDark }]}>
              {headlineText}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Add / Withdraw card */}
      {canPay && (
        <View style={[styles.pillsCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.pill, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            onPress={handleLuckyStarline}
          >
            <Image source={require("../assets/Images/AddFund.webp")} style={styles.pillIcon} resizeMode="contain" />
            <Text style={[styles.pillText, { color: colors.primary }]} numberOfLines={1}>{t('common:addFund')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.pill, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            onPress={handleLuckyJackpot}
          >
            <Image source={require("../assets/Images/WithdrawFund.webp")} style={styles.pillIcon} resizeMode="contain" />
            <Text style={[styles.pillText, { color: colors.primary }]} numberOfLines={1}>{t('common:withdrawFund')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* contact rows */}
      <View style={styles.contactsRow}>
        <TouchableOpacity style={styles.contactRow} onPress={openDialer} activeOpacity={0.7}>
          <MaterialCommunityIcons name="cellphone" size={15} color={colors.onPrimary} />
          <Text style={[styles.contactText, { color: colors.onPrimary }]}>{normalizeDigits(callNumber)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={openWhatsApp} activeOpacity={0.7}>
          <MaterialCommunityIcons name="whatsapp" size={15} color={colors.onPrimary} />
          <Text style={[styles.contactText, { color: colors.onPrimary }]}>{normalizeDigits(waNumber)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopStrip;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 8,
  },
  marqueePill: {
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    borderRadius: 17,
    paddingLeft: 12,
    paddingRight: 8,
    marginBottom: 8,
  },
  marqueeIcon: {
    marginRight: 4,
  },
  marqueeWrap: {
    flex: 1,
    overflow: "hidden",
    height: 20,
    justifyContent: "center",
  },
  marqueeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pillsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    padding: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1.2,
    height: 40,
    paddingHorizontal: 8,
  },
  pillIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  pillText: {
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
  },
  contactsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
});
