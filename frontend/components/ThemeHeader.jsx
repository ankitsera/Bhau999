import React from "react";
import { View, Text, StyleSheet, Pressable, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";

// Green status-bar strip + white rounded sheet with a boxed back button and title
const ThemeHeader = ({ title = "", right = null }) => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { paddingTop: top + 8, backgroundColor: colors.primary }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.row}>
          <Pressable
            onPress={() => navigation?.goBack?.()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            <MaterialIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>

          <Text numberOfLines={1} style={[styles.title, { color: colors.heading }]}>
            {title}
          </Text>

          {right}
        </View>
      </View>
    </View>
  );
};

export default ThemeHeader;

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
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 16,
  },
});
