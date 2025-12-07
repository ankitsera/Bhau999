import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../contexts/AuthContext";

const GREEN = "#3FA16C";

/**
 * Props:
 *  - title: string
 *  - speed?: number  // px per second (default 60)
 *  - gap?: number    // space between the two title copies (default 40)
 */
const DynamicHeader = ({ title = "", speed = 60, gap = 80 }) => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const balance = typeof user?.balance === "number" ? user.balance : 0;

  // width of a single title copy
  const [textW, setTextW] = useState(0);

  // animation value
  const animX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!textW) return; // wait until we know width once

    const distance = textW + gap; // slide by one full copy + gap
    const duration = (distance / speed) * 1000;

    const loop = () => {
      animX.setValue(0);
      Animated.timing(animX, {
        toValue: -distance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => loop());
    };

    loop();
    return () => animX.stopAnimation();
  }, [textW, gap, speed, animX]);

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      {/* curved green background */}
      <View style={styles.bg} />

      <View style={styles.row}>
        {/* back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.left}
        >
          <MaterialIcons name="arrow-back" size={26} color="#000" />
        </Pressable>

        {/* marquee title (always moving) */}
        <View style={styles.center}>
          <Animated.View
            style={{
              flexDirection: "row",
              alignItems: "center",
              transform: [{ translateX: animX }],
            }}
          >
            {/* First copy – measured */}
            <Text
              style={styles.title}
              onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
            >
              {title}
            </Text>

            {/* Gap */}
            <View style={{ width: gap }} />

            {/* Second copy – for seamless loop */}
            <Text style={styles.title}>{title}</Text>
          </Animated.View>
        </View>

        {/* wallet + balance */}
        <View style={styles.wallet}>
          <MaterialCommunityIcons name="wallet-outline" size={22} color="#000" />
          <Text style={styles.walletText}>{balance.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
};

export default DynamicHeader;

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: GREEN,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  row: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  left: {
    paddingRight: 8,
  },
  center: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  title: {
    color: "#000",
    fontSize: 24,
    fontWeight: "600",
  },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  walletText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 6,
  },
});