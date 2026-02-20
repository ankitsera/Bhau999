import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share, Alert } from 'react-native';
import { getShareUrl } from '../utils/AppConfigService';
import { useTheme } from '../contexts/ThemeContext';

const SideBarNavigation = ({ navigation, closeSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const menuItems = [
    { name: 'Home', icon: 'home' },
    { name: 'Add Money', icon: 'currency-rupee' },
    { name: 'Withdraw Money', icon: 'logout' },
    { name: 'My Bids', icon: 'history' },
    { name: 'Passbook', icon: 'compare-arrows' },
    { name: 'Funds', icon: 'account-balance' },
    { name: 'Notifications', icon: 'notifications' },
    { name: 'Charts', icon: 'bar-chart' },
    { name: 'Game Rate', icon: 'attach-money' },
    { name: 'Time Table', icon: 'access-time' },
    { name: 'Notice board / Rules', icon: 'rule' },
    { name: 'Settings', icon: 'settings' },
    { name: 'Share App', icon: 'share' },
    { name: isDarkMode ? 'Light Mode' : 'Dark Mode', icon: isDarkMode ? 'light-mode' : 'dark-mode' },
    { name: 'Logout', icon: 'logout' },
  ];

  const shareApp = async () => {
    try {
      // If you want to always get latest from backend once in a while:
      // const url = await getShareUrl({ forceRefresh: true });
      const url = await getShareUrl();

      const link = String(url || "").trim();
      if (!link) {
        Alert.alert("Share failed", "Share link is missing. Please try again later.");
        return;
      }

      const message =
        `Download the latest SARA777 app from here:\n${link}\n\n` +
        `Then tap Download and install.\nIf it asks, allow "Install unknown apps".`;

      await Share.share({ message });
    } catch (e) {
      Alert.alert("Share failed", e?.message || "Something went wrong");
    }
  };

  const handleSidebarClick = async menu => {
    closeSidebar();
    
    // Handle theme toggle
    if (menu === 'Light Mode' || menu === 'Dark Mode') {
      toggleTheme();
      return;
    }
    
    if(menu === 'Logout'){
      logout(navigation);
      return;
    }
    
    if (menu === 'Share App') {
      await shareApp();
      return;
    }
    
    navigation.navigate(menu);
  };

  const renderMenuItem = ({ item }) => (
    <View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.7}
        onPress={() => handleSidebarClick(item.name)}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
          <MaterialIcons name={item.icon} size={20} color="#fff" />
        </View>
        <Text style={[styles.menuText, { color: colors.text }]}>{item.name}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* ---------- USER INFO SECTION ---------- */}
        <View style={[styles.userSection, { backgroundColor: colors.background }]}>
          <View style={[styles.userCircle, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="person" size={24} color="#fff" />
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>{user?.username || 'User'}</Text>
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

        {/* ---------- MENU SECTION ---------- */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={menuItems}
            keyExtractor={item => item.name}
            renderItem={renderMenuItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            scrollEnabled={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:{
    flex: 1,
  },

  container: {
    flex: 1,
  },

  // --- USER SECTION ---
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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

  // --- MENU SECTION ---
  menuList: {
    paddingVertical: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 15.5,
  },
  divider: {
    height: 1,
    opacity: 0.2,
  },
});

export default SideBarNavigation;
