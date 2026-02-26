import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import ThemeHeader from "../../components/ThemeHeader";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../contexts/ThemeContext";

const ITEMS = [
  {
    id: "bid-history",
    title: "Bid History",
    subtitle: "You can view your market bid history",
    image: require("../../assets/Images/AddFund.webp"),
    onPress: (nav) => nav.navigate("Bid History"),
  },
  {
    id: "game-results",
    title: "Game Results",
    subtitle: "You can view your market result history",
    image: require("../../assets/Images/WithdrawFund.webp"),
    onPress: (nav) => nav.navigate("Game Results"),
  },
  // {
  //   id: "ls-bid",
  //   title: "Lucky Starline Bid History",
  //   subtitle: "You can view starline history",
  //   icon: { lib: "MaterialCommunityIcons", name: "bank-transfer" },
  //   onPress: (nav) => nav.navigate("LuckyStarline Bid History"),
  // },
  // {
  //   id: "ls-result",
  //   title: "Lucky Starline Result History",
  //   subtitle: "You can view starline result",
  //   icon: { lib: "MaterialCommunityIcons", name: "history" },
  //   onPress: (nav) => nav.navigate("LuckyStarline Result History"),
  // },
  // {
  //   id: "lj-bid",
  //   title: "Lucky Jackpot Bid History",
  //   subtitle: "You can view Jackpot history",
  //   icon: { lib: "MaterialCommunityIcons", name: "bank-transfer" },
  //   onPress: (nav) => nav.navigate("LuckyJackpot Bid History"),
  // },
  // {
  //   id: "lj-result",
  //   title: "Lucky Jackpot Result History",
  //   subtitle: "You can view Jackpot result",
  //   icon: { lib: "MaterialCommunityIcons", name: "history" },
  //   onPress: (nav) => nav.navigate("LuckyJackpot Result History"),
  // },
];

const TileIcon = ({ image }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.leftIconWrap]}>
      <Image
        source={image}
        style={styles.iconImage}
        resizeMode="contain"
      />
    </View>
  );
};

const Chevron = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.chevWrap, { backgroundColor: colors.surface }]}>
      <MaterialIcons name="chevron-right" size={26} color={colors.textTertiary} />
    </View>
  );
};

const Item = ({ item, navigation }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
      onPress={() => item.onPress?.(navigation)}
    >
      <TileIcon image={item.image} />

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
      </View>

      <Chevron />
    </TouchableOpacity>
  );
};

const MyBids = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title="My Bids" />

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
  container: { flex: 1 },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  leftIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconImage: {
    width: 40,
    height: 40,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },

  chevWrap: {
    width: 38,
    height: 38,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});