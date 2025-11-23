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

const SideBarNavigation = ({ navigation, closeSidebar }) => {
  const { user, logout } = useContext(AuthContext);

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
    { name: 'How to Play', icon: 'help-outline' },
    { name: 'Share App', icon: 'share' },
    { name: 'Logout', icon: 'logout' },
  ];

  const handleSidebarClick = menu => {
    closeSidebar();
    if(menu === 'Logout'){
      logout(navigation);
    } else if(menu === 'Share App'){
      // Implement share functionality here
    } else {
      navigation.navigate(menu);
    }
  };

  const renderMenuItem = ({ item }) => (
    <View>
      <View style={styles.divider} />
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.7}
        onPress={() => handleSidebarClick(item.name)}
      >
        <View style={styles.iconCircle}>
          <MaterialIcons name={item.icon} size={20} color="#fff" />
        </View>
        <Text style={styles.menuText}>{item.name}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.container}>
        {/* ---------- USER INFO SECTION ---------- */}
        <View style={styles.userSection}>
          <View style={styles.userCircle}>
            <MaterialIcons name="person" size={24} color="#fff" />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <Text style={styles.mobile}>
              {user?.mobileNumber || '9999999999'}
            </Text>
            <Text style={styles.since}>
              Since{' '}
              {user?.dateSignup
                ? user.dateSignup.slice(0, 10).split('-').reverse().join('/')
                : '26/10/2025'}
            </Text>
          </View>

          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <MaterialIcons name="close" size={25} color="red" />
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
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // --- USER SECTION ---
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  userCircle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#66bf6aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#66bf6aff',
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
    color: '#000',
  },
  mobile: {
    fontSize: 14,
    color: '#333',
    marginTop: 1,
  },
  since: {
    fontSize: 13,
    color: '#607d8b',
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
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    opacity: 0.2,
  },
});

export default SideBarNavigation;
