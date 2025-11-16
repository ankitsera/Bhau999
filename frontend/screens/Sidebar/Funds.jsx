import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import GreenHeader from "../../components/GreenHeader";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const GREEN = "#3FA16C";

const ITEMS = [
  {
    id: "add",
    title: "Add Fund",
    subtitle: "You can add fund to your wallet",
    icon: "currency-inr",
    onPress: (nav) => nav.navigate("AddMoney"),
  },
  {
    id: "withdraw",
    title: "Withdraw Fund",
    subtitle: "You can withdraw winnings",
    icon: "cash-minus",
    onPress: (nav) => nav.navigate("WithdrawMoney"),
  },
  {
    id: "bank",
    title: "Bank Detail",
    subtitle: "Add your bank detail for withdrawals",
    icon: "bank-outline",
    onPress: (nav) => nav.navigate("BankDetails"),
  },
  {
    id: "addHistory",
    title: "Add Fund History",
    subtitle: "You can check your add point history",
    icon: "clock-time-four-outline",
    onPress: (nav) => nav.navigate("AddFundHistory"),
  },
  {
    id: "withdrawHistory",
    title: "Withdraw Fund History",
    subtitle: "You can check your Withdraw point history",
    icon: "history",
    onPress: (nav) => nav.navigate("WithdrawFundHistory"),
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
      <GreenHeader navigation={navigation} title="Funds" />

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
    backgroundColor: GREEN,
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