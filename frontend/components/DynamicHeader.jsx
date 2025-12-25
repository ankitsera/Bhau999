import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../contexts/AuthContext";

const GREEN = "#3FA16C";

const DynamicHeader = ({ title = "", speed = 60, gap = 80 }) => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const balance = typeof user?.balance === "number" ? user.balance : 0;
  const [textW, setTextW] = useState(0);
  const animX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!textW) return;

    const distance = textW + gap;
    const duration = (distance / speed) * 1000;

    const loop = () => {
      // Start with a small initial offset (e.g., 10px) so letters aren't cut off immediately
      animX.setValue(20); 
      Animated.timing(animX, {
        toValue: -distance + 10,
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
      <View style={styles.bg} />

      <View style={styles.row}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.left}
        >
          <MaterialIcons name="arrow-back" size={26} color="#000" />
        </Pressable>

        <View style={styles.center}>
          <Animated.View
            style={{
              flexDirection: "row",
              alignItems: "center",
              transform: [{ translateX: animX }],
              width: textW ? (textW + gap) * 2 + 20 : '1000%',
            }}
          >
            {/* Initial Spacer to prevent clipping on start */}
            <View style={{ width: 10 }} />

            <Text
              numberOfLines={1}
              style={styles.title}
              onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
            >
              {title}
            </Text>

            <View style={{ width: gap }} />

            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          </Animated.View>
        </View>

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
    height: 90,
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
    zIndex: 10,
    marginBottom: 15,
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
    flexWrap: 'nowrap',
    marginBottom: 15,
  },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    zIndex: 10,
    marginBottom: 15,
  },
  walletText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 6,
  },
});