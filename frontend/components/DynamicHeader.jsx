import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const DynamicHeader = ({ title = "", speed = 60, gap = 80 }) => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();

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
    <View style={[styles.root, { paddingTop: top + 8, backgroundColor: colors.primary }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.row}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            <MaterialIcons name="chevron-left" size={28} color={colors.text} />
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
                style={[styles.title, { color: colors.heading }]}
                onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
              >
                {title}
              </Text>

              <View style={{ width: gap }} />

              <Text numberOfLines={1} style={[styles.title, { color: colors.heading }]}>
                {title}
              </Text>
            </Animated.View>
          </View>

          <View style={[styles.wallet, { backgroundColor: colors.dark }]}>
            <MaterialCommunityIcons name="wallet" size={20} color={colors.onDark} />
            <Text style={[styles.walletText, { color: colors.onDark }]}>₹{balance.toFixed(2)}</Text>
          </View>
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
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 18,
    paddingBottom: 8,
  },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  center: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
    marginLeft: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    flexWrap: 'nowrap',
  },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    zIndex: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  walletText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
