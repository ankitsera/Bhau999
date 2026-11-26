import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getShareUrl, getTelegramChannel } from '../utils/AppConfigService';
import { useTheme } from '../contexts/ThemeContext';
import { canUseFeature, FEATURES } from '../utils/Features';
import { FONT } from '../contexts/Themes';

const menuImages = {
  home: require('../assets/Images/home.webp'),
  myBids: require('../assets/Images/MyBids.webp'),
  passbook: require('../assets/Images/Passbook.webp'),
  funds: require('../assets/Images/Funds.webp'),
  telegram: require('../assets/Images/telegram.webp'),
  notifications: require('../assets/Images/notification.webp'),
  charts: require('../assets/Images/Charts.webp'),
  gameRate: require('../assets/Images/Rates.webp'),
  language: require('../assets/Images/Language.webp'),
  noticeBoard: require('../assets/Images/Rules.webp'),
  settings: require('../assets/Images/Settings.webp'),
  shareApp: require('../assets/Images/Share.webp'),
  logout: require('../assets/Images/logout.webp'),
};

const SideBarNavigation = ({ navigation, closeSidebar }) => {
  const { t } = useTranslation(['common']);
  const { user, logout } = useContext(AuthContext);
  const { colors } = useTheme();

  const menuItems = [
    canUseFeature(user, FEATURES.GAMES)
      ? { name: 'Home', translationKey: 'home', imageKey: 'home' }
      : { name: 'Home', labelKey: 'library:title', imageKey: 'home' },
    { name: 'My Bids', translationKey: 'myBids', imageKey: 'myBids', feature: FEATURES.BETTING },
    { name: 'Passbook', translationKey: 'passbook', imageKey: 'passbook', feature: FEATURES.PAYMENTS },
    { name: 'Funds', translationKey: 'funds', imageKey: 'funds', feature: FEATURES.PAYMENTS },
    { name: 'Telegram', translationKey: 'telegram', imageKey: 'telegram', feature: FEATURES.GAMES },
    { name: 'Notifications', translationKey: 'notifications', imageKey: 'notifications', feature: FEATURES.GAMES },
    { name: 'Charts', translationKey: 'charts', imageKey: 'charts', feature: FEATURES.GAMES },
    { name: 'Game Rate', translationKey: 'gameRate', imageKey: 'gameRate', feature: FEATURES.GAMES },
    { name: 'Language', translationKey: 'language', imageKey: 'language' },
    { name: 'Notice board / Rules', translationKey: 'noticeBoardRules', imageKey: 'noticeBoard', feature: FEATURES.GAMES },
    { name: 'Settings', translationKey: 'settings', imageKey: 'settings', feature: FEATURES.GAMES },
    { name: 'Share App', translationKey: 'shareApp', imageKey: 'shareApp' },
    { name: 'Logout', translationKey: 'logout', imageKey: 'logout' },
  ].filter(item => !item.feature || canUseFeature(user, item.feature));

  const shareApp = async () => {
    try {
      const url = await getShareUrl();
      const link = String(url || '').trim();
      if (!link) {
        Alert.alert(
          t('common:shareFailed'),
          t('common:shareLinkMissing'),
        );
        return;
      }

      const message =
        `Download the latest BHAU999 app from here:\n${link}\n\n` +
        `Then tap Download and install.\nIf it asks, allow "Install unknown apps".`;

      await Share.share({ message });
    } catch (e) {
      Alert.alert(t('common:shareFailed'), e?.message || t('common:somethingWentWrong'));
    }
  };

  const openTelegram = async () => {
    const telegramUrl = await getTelegramChannel();
    if (!telegramUrl) {
      Alert.alert(t('common:error'), t('common:telegramLinkNotConfigured'));
      return;
    }
    Linking.openURL(telegramUrl).catch(() => {});
  };

  const handleSidebarClick = async item => {
    const menu = item?.name;

    closeSidebar();

    if (menu === 'Logout') {
      logout(navigation);
      return;
    }

    if (menu === 'Share App') {
      await shareApp();
      return;
    }

    if (menu === 'Telegram') {
      openTelegram();
      return;
    }

    navigation.navigate(menu);
  };

  // minimal row (no background, no divider, no icon circle)
  const renderMenuItem = ({ item }) => {
    const imageSource = menuImages[item?.imageKey];

    return (
      <TouchableOpacity
        style={styles.menuRow}
        activeOpacity={0.75}
        onPress={() => handleSidebarClick(item)}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.menuIcon}
            resizeMode="contain"
          />
        ) : null}

        <View style={{ flex: 1 }}>
          <Text
            style={[styles.menuText, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.labelKey
              ? t(item.labelKey)
              : item.translationKey ? t(`common:${item.translationKey}`) : item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle="dark-content"
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* USER INFO */}
        <View style={styles.userSection}>
          <View
            style={[styles.userCircle, { backgroundColor: colors.primary, borderColor: colors.primaryIconBg }]}
          >
            <MaterialIcons name="person-outline" size={36} color={colors.onPrimary} />
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {user?.username || 'User'}
            </Text>

            <Text style={[styles.mobile, { color: colors.textSecondary }]}>
              {user?.mobileNumber || '9999999999'}
            </Text>

            <Text style={[styles.since, { color: colors.textTertiary }]}>
              {t('common:since')}{' '}
              {user?.dateSignup
                ? user.dateSignup.slice(0, 10).split('-').reverse().join('/')
                : '26/10/2025'}
            </Text>
          </View>

          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <MaterialIcons name="close" size={25} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* MENU */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={menuItems}
            keyExtractor={i => i.name}
            renderItem={renderMenuItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },

  // USER SECTION (kept clean)
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  userCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONT.body,
    fontWeight: '700',
  },
  mobile: {
    fontSize: FONT.label,
    marginTop: 1,
  },
  since: {
    fontSize: FONT.caption,
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 10,
  },

  // MENU (clean list)
  menuList: {
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 14,
  },
  menuText: {
    fontSize: FONT.body,
    fontWeight: '400',
  },

});

export default SideBarNavigation;