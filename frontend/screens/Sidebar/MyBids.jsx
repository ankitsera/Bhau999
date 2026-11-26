import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTranslation } from 'react-i18next';
import ThemeHeader from "../../components/ThemeHeader";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../contexts/ThemeContext";
import { FONT } from '../../contexts/Themes';

const ITEMS = [
  {
    id: "bid-history",
    titleKey: "games:bidHistory",
    subtitleKey: "screens:bidHistorySubtitle",
    image: require("../../assets/Images/AddFund.webp"),
    onPress: (nav) => nav.navigate("Bid History"),
  },
  {
    id: "game-results",
    titleKey: "games:gameResults",
    subtitleKey: "screens:gameResultsSubtitle",
    image: require("../../assets/Images/WithdrawFund.webp"),
    onPress: (nav) => nav.navigate("Game Results"),
  },
  // {
  //   id: "ls-bid",
  //   titleKey: "games:lsBid",
  //   subtitleKey: "screens:lsBidSubtitle",
  //   icon: { lib: "MaterialCommunityIcons", name: "bank-transfer" },
  //   onPress: (nav) => nav.navigate("LuckyStarline Bid History"),
  // },
  // {
  //   id: "ls-result",
  //   titleKey: "games:lsResult",
  //   subtitleKey: "screens:lsResultSubtitle",
  //   icon: { lib: "MaterialCommunityIcons", name: "history" },
  //   onPress: (nav) => nav.navigate("LuckyStarline Result History"),
  // },
  // {
  //   id: "lj-bid",
  //   titleKey: "games:ljBid",
  //   subtitleKey: "screens:ljBidSubtitle",
  //   icon: { lib: "MaterialCommunityIcons", name: "bank-transfer" },
  //   onPress: (nav) => nav.navigate("LuckyJackpot Bid History"),
  // },
  // {
  //   id: "lj-result",
  //   titleKey: "games:ljResult",
  //   subtitleKey: "screens:ljResultSubtitle",
  //   icon: { lib: "MaterialCommunityIcons", name: "history" },
  //   onPress: (nav) => nav.navigate("LuckyJackpot Result History"),
  // },
];

const TileIcon = ({ image }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.leftIconWrap, { backgroundColor: colors.primary }]}>
      <Image
        source={image}
        style={[styles.iconImage, { tintColor: colors.onPrimary }]}
        resizeMode="contain"
      />
    </View>
  );
};

const Chevron = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.chevWrap, { backgroundColor: colors.surface }]}>
      <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
    </View>
  );
};

const Item = ({ item, navigation, t }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
      onPress={() => item.onPress?.(navigation)}
    >
      <TileIcon image={item.image} />

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{t(item.titleKey)}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
      </View>

      <Chevron />
    </TouchableOpacity>
  );
};

const MyBids = ({ navigation }) => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('screens:myBids')} />

      <FlatList
        data={ITEMS}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <Item item={item} navigation={navigation} t={t} />}
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  leftIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconImage: {
    width: 28,
    height: 28,
  },

  title: {
    fontSize: FONT.body,
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