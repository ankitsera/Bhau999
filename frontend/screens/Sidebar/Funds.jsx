import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import ThemeHeader from "../../components/Header";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { ThemeColor } from "../../contexts/Themes";

const ITEMS = [
  {
    id: "add",
    title: "Add Fund",
    subtitle: "You can add fund to your wallet",
    icon: "currency-inr",
    onPress: (nav) => nav.navigate("Add Money"),
  },
  {
    id: "withdraw",
    title: "Withdraw Fund",
    subtitle: "You can withdraw winnings",
    icon: "cash-minus",
    onPress: (nav) => nav.navigate("Withdraw Money"),
  },
  {
    id: "bank",
    title: "Bank Detail",
    subtitle: "Add your bank detail for withdrawals",
    icon: "bank-outline",
    onPress: (nav) => nav.navigate("Bank Details"),
  },
  {
    id: "addHistory",
    title: "Add Fund History",
    subtitle: "You can check your add point history",
    icon: "clock-time-four-outline",
    onPress: (nav) => nav.navigate("Add Fund History"),
  },
  {
    id: "withdrawHistory",
    title: "Withdraw Fund History",
    subtitle: "You can check your Withdraw point history",
    icon: "history",
    onPress: (nav) => nav.navigate("Withdraw Fund History"),
  },
];

const LeftIcon = ({ name }) => (
  <View style={styles.leftIconWrap}>
    <MaterialCommunityIcons name={name} size={24} color="#fff" />
  </View>
);

const Chevron = () => (
  <View style={styles.chevWrap}>
    <MaterialIcons name="chevron-right" size={26} color="#444" />
  </View>
);

const Item = ({ item, navigation }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.card}
    onPress={() => item.onPress?.(navigation)}
  >
    <LeftIcon name={item.icon} />

    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>

    <Chevron />
  </TouchableOpacity>
);

const Funds = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ThemeHeader title="Funds" />

      <FlatList
        data={ITEMS}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <Item item={item} navigation={navigation} />}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Funds;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  leftIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ThemeColor,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  title: {
    color: "#111",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#333",
    marginTop: 2,
  },

  chevWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});