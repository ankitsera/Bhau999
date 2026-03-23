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

const ITEMS = [
  {
    id: "add",
    titleKey: "funds:addFund",
    subtitleKey: "screens:addFundSubtitle",
    image: require("../../assets/Images/AddFund.webp"),
    onPress: (nav) => nav.navigate("Add Money"),
  },
  {
    id: "withdraw",
    titleKey: "funds:withdrawFund",
    subtitleKey: "screens:withdrawFundSubtitle",
    image: require("../../assets/Images/WithdrawFund.webp"),
    onPress: (nav) => nav.navigate("Withdraw Money"),
  },
  {
    id: "bank",
    titleKey: "navigation:bankDetails",
    subtitleKey: "screens:bankDetailsSubtitle",
    image: require("../../assets/Images/AddBankDetails.webp"),
    onPress: (nav) => nav.navigate("Bank Details"),
  },
  {
    id: "addHistory",
    titleKey: "funds:addFundHistory",
    subtitleKey: "screens:addFundHistorySubtitle",
    image: require("../../assets/Images/AddFund.webp"),
    onPress: (nav) => nav.navigate("Add Fund History"),
  },
  {
    id: "withdrawHistory",
    titleKey: "funds:withdrawFundHistory",
    subtitleKey: "screens:withdrawFundHistorySubtitle",
    image: require("../../assets/Images/WithdrawFund.webp"),
    onPress: (nav) => nav.navigate("Withdraw Fund History"),
  },
];

const LeftIcon = ({ image }) => {
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

const Item = ({ item, navigation, t }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
      onPress={() => item.onPress?.(navigation)}
    >
      <LeftIcon image={item.image} />

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{t(item.titleKey)}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
      </View>

      <Chevron />
    </TouchableOpacity>
  );
};

const Funds = ({ navigation }) => {
  const { t } = useTranslation(['funds', 'screens', 'common', 'navigation']);
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('common:funds')} />

      <FlatList
        data={ITEMS}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <Item item={item} navigation={navigation} t={t} />}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Funds;

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
    paddingVertical: 10,
    elevation: 2,
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