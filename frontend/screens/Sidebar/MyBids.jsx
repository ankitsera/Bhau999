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
    id: "bid-history",
    title: "Bid History",
    subtitle: "You can view your market bid history",
    icon: { lib: "MaterialCommunityIcons", name: "calendar-blank-outline" },
    onPress: (nav) => nav.navigate("Bid History"),
  },
  {
    id: "game-results",
    title: "Game Results",
    subtitle: "You can view your market result history",
    icon: { lib: "MaterialCommunityIcons", name: "history" },
    onPress: (nav) => nav.navigate("Game Results"),
  },
  {
    id: "ls-bid",
    title: "Lucky Starline Bid History",
    subtitle: "You can view starline history",
    icon: { lib: "MaterialCommunityIcons", name: "bank-transfer" },
    onPress: (nav) => nav.navigate("LuckyStarline Bid History"),
  },
  {
    id: "ls-result",
    title: "Lucky Starline Result History",
    subtitle: "You can view starline result",
    icon: { lib: "MaterialCommunityIcons", name: "history" },
    onPress: (nav) => nav.navigate("LuckyStarline Result History"),
  },
  {
    id: "lj-bid",
    title: "Lucky Jackpot Bid History",
    subtitle: "You can view Jackpot history",
    icon: { lib: "MaterialCommunityIcons", name: "bank-transfer" },
    onPress: (nav) => nav.navigate("LuckyJackpot Bid History"),
  },
  {
    id: "lj-result",
    title: "Lucky Jackpot Result History",
    subtitle: "You can view Jackpot result",
    icon: { lib: "MaterialCommunityIcons", name: "history" },
    onPress: (nav) => nav.navigate("LuckyJackpot Result History"),
  },
];

const TileIcon = ({ name }) => (
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
    <TileIcon name={item.icon.name} />

    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>

    <Chevron />
  </TouchableOpacity>
);

const MyBids = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <GreenHeader title="My Bids" />

      <FlatList
        data={ITEMS}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <Item item={item} navigation={navigation} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default MyBids;

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