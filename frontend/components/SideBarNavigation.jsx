import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share, Alert } from 'react-native';
import { getShareUrl, getTelegramChannel } from '../utils/AppConfigService';
import { useTheme } from '../contexts/ThemeContext';

const SideBarNavigation = ({ navigation, closeSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, colors, themeMode, setThemeMode } = useTheme();

  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const themeSubtitle = useMemo(() => {
    if (themeMode === 'system')
      return `System (${isDarkMode ? 'Dark' : 'Light'})`;
    return themeMode === 'dark' ? 'Dark' : 'Light';
  }, [themeMode, isDarkMode]);

  const menuItems = [
    { name: 'Home', icon: 'home' },
    { name: 'Add Money', icon: 'currency-rupee' },
    { name: 'Withdraw Money', icon: 'subtitles-off' },
    { name: 'My Bids', icon: 'history' },
    { name: 'Passbook', icon: 'compare-arrows' },
    { name: 'Telegram', icon: 'telegram' },
    { name: 'Notifications', icon: 'notifications' },
    { name: 'Charts', icon: 'bar-chart' },
    { name: 'Game Rate', icon: 'attach-money' },
    { name: 'Time Table', icon: 'access-time' },
    { name: 'Notice board / Rules', icon: 'rule' },
    { name: 'Settings', icon: 'settings' },
    { name: 'Share App', icon: 'share' },

    { name: 'Change Theme', icon: 'palette', isTheme: true },

    { name: 'Logout', icon: 'logout' },
  ];

  const shareApp = async () => {
    try {
      const url = await getShareUrl();
      const link = String(url || '').trim();
      if (!link) {
        Alert.alert(
          'Share failed',
          'Share link is missing. Please try again later.',
        );
        return;
      }

      const message =
        `Download the latest SARA777 app from here:\n${link}\n\n` +
        `Then tap Download and install.\nIf it asks, allow "Install unknown apps".`;

      await Share.share({ message });
    } catch (e) {
      Alert.alert('Share failed', e?.message || 'Something went wrong');
    }
  };

  const openThemeModal = () => setThemeModalVisible(true);

  const pickTheme = mode => {
    setThemeMode(mode); // "system" | "light" | "dark"
    setThemeModalVisible(false);
  };

  const openTelegram = async () => {
    const telegramUrl = await getTelegramChannel();
    if (!telegramUrl) {
      Alert.alert('Error', 'Telegram channel link is not configured.');
      return;
    }
    Linking.openURL(telegramUrl).catch(() => {});
  };

  const handleSidebarClick = async item => {
    const menu = item?.name;

    if (item?.isTheme) {
      openThemeModal();
      return;
    }

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

  // ✅ minimal row (no background, no divider, no icon circle)
  const renderMenuItem = ({ item }) => {
    const isTheme = !!item?.isTheme;

    return (
      <TouchableOpacity
        style={styles.menuRow}
        activeOpacity={0.75}
        onPress={() => handleSidebarClick(item)}
      >
        <MaterialIcons
          name={item.icon}
          size={22}
          color={colors.text}
          style={{ marginRight: 12 }}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={[styles.menuText, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {isTheme ? (
            <Text
              style={[styles.menuSubText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {themeSubtitle}
            </Text>
          ) : null}
        </View>

        {isTheme ? (
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textTertiary}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  const ThemeOption = ({ mode, title, desc, icon }) => {
    const selected = themeMode === mode;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => pickTheme(mode)}
        style={styles.themeRow}
      >
        <MaterialIcons
          name={icon}
          size={22}
          color={selected ? colors.primary : colors.textTertiary}
          style={{ marginRight: 12 }}
        />

        <View style={{ flex: 1 }}>
          <Text style={[styles.themeTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
            {desc}
          </Text>
        </View>

        {selected ? (
          <MaterialIcons name="check" size={22} color={colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* USER INFO */}
        <View style={styles.userSection}>
          <View
            style={[styles.userCircle, { backgroundColor: colors.text }]}
          >
            <MaterialIcons name="person" size={24} color="#fff" />
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {user?.username || 'User'}
            </Text>

            <Text style={[styles.mobile, { color: colors.textSecondary }]}>
              {user?.mobileNumber || '9999999999'}
            </Text>

            <Text style={[styles.since, { color: colors.textTertiary }]}>
              Since{' '}
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

      {/* THEME MODAL */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setThemeModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose theme
              </Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={22}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <ThemeOption
              mode="system"
              title="System"
              desc={`Follow device (${
                isDarkMode ? 'Dark' : 'Light'
              } right now)`}
              icon="settings-suggest"
            />
            <ThemeOption
              mode="light"
              title="Light"
              desc="Always light mode"
              icon="light-mode"
            />
            <ThemeOption
              mode="dark"
              title="Dark"
              desc="Always dark mode"
              icon="dark-mode"
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    width: 50,
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
  },
  mobile: {
    fontSize: 14,
    marginTop: 1,
  },
  since: {
    fontSize: 13,
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
  menuText: {
    fontSize: 15.5,
    fontWeight: '400',
  },
  menuSubText: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '400',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Theme rows (minimal)
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  themeTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  themeDesc: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '600',
  },
});

export default SideBarNavigation;