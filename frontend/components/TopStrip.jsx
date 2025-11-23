import React, { useEffect, useRef } from "react";
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
import Ionicons from "react-native-vector-icons/Ionicons";

const GREEN = "#3FA16C";
const WHATSAPP = "#25D366";
const CONTACT_NUMBER = "7757033237";
const WHATSAPP_NUMBER = "7757033237";
const MARQUEE_TEXT = "का मौका – सिर्फ AS Online पर!  |  Play Daily – Win Big!";

/** helper functions */
const openDialer = () => Linking.openURL(`tel:+91${CONTACT_NUMBER}`);
const openWhatsApp = () =>
  Linking.openURL(`whatsapp://send?phone=+91${WHATSAPP_NUMBER}&text=${encodeURIComponent("Hi, I need assistance!")}`);

const TopStrip = () => {
  // marquee animation
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnim = () => {
      translateX.setValue(0);
      Animated.timing(translateX, {
        toValue: -600,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => finished && startAnim());
    };
    startAnim();
  }, [translateX]);

  // Button handlers
  const handleLuckyStarline = () => {
    console.log("Lucky Starline pressed");
  };

  const handleLuckyJackpot = () => {
    console.log("Lucky Jackpot pressed");
  };

  return (
    <View style={styles.container}>
      {/* marquee text */}
      <View style={styles.marqueeWrap}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.marqueeText,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {MARQUEE_TEXT}
        </Animated.Text>
      </View>

      {/* pill buttons */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.pill}
          onPress={handleLuckyStarline}
        >
          <View style={styles.pillIcon}>
            <Ionicons name="play" size={20} color={GREEN} />
          </View>
          <Text style={styles.pillText}>Lucky Starline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.pill}
          onPress={handleLuckyJackpot}
        >
          <View style={styles.pillIcon}>
            <Ionicons name="play" size={20} color={GREEN} />
          </View>
          <Text style={styles.pillText}>Lucky Jackpot</Text>
        </TouchableOpacity>
      </View>

      {/* contact rows */}
      <View style={{flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20}}>
        <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone" size={22} color="#111" />
            <TouchableOpacity onPress={openDialer} activeOpacity={0.7}>
            <Text style={styles.contactText}>{CONTACT_NUMBER}</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
            <MaterialCommunityIcons name="whatsapp" size={22} color={WHATSAPP} />
            <TouchableOpacity onPress={openWhatsApp} activeOpacity={0.7}>
            <Text style={styles.contactText}>{WHATSAPP_NUMBER}</Text>
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
    backgroundColor: "#fff",
  },
  marqueeWrap: {
    overflow: "hidden",
    height: 24,
    marginBottom: 8,
  },
  marqueeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E34234",
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
    backgroundColor: GREEN,
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
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  pillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  contactText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
});