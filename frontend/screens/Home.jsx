import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  StatusBar,
  BackHandler,
  Linking,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../contexts/AuthContext';
import { GameContext } from '../contexts/GameContext';
import SideBarNavigation from '../components/SideBarNavigation';
import Footer from '../components/Footer';
import TopStrip from '../components/TopStrip';
import GamesList from '../components/games/GamesList';

// ✅ AppConfig helpers (defaults live inside these)
import { getWhatsappSupport } from '../utils/AppConfigService';

import { useTheme } from '../contexts/ThemeContext';

const Header = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { isDarkMode, colors } = useTheme();
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);

  return (
    <View style={[styles.headerRoot, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <Modal
        visible={isSideBarVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setIsSideBarVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.sidebar, { backgroundColor: colors.background }]}>
            <SideBarNavigation
              navigation={navigation}
              closeSidebar={() => setIsSideBarVisible(false)}
            />
          </View>
          <Pressable
            style={styles.overlay}
            onPress={() => setIsSideBarVisible(false)}
          />
        </View>
      </Modal>

      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, shadowColor: colors.text },
        ]}
      >
        <View style={styles.logo}>
          <Pressable
            style={styles.hamburger}
            onPress={() => setIsSideBarVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name="format-align-left"
              size={28}
              color={colors.text}
            />
          </Pressable>
          <Image
            source={require('../assets/Images/logo_no_bg.webp')}
            style={styles.logoImage}
          />
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.walletRight}
            onPress={() => navigation.navigate('Add Money')}
          >
            <MaterialCommunityIcons
              name="wallet-outline"
              size={28}
              color={colors.text}
            />
            <Text style={[styles.walletAmt, { color: colors.text }]}>
              {user?.balance ? user.balance : '0.0'}
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Notifications')}>
            <MaterialIcons
              name="notifications-active"
              size={30}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const Home = ({ navigation }) => {
  const { colors } = useTheme();

  // Pull to refresh state (UI will be attached to GamesList FlatList)
  const [refreshing, setRefreshing] = useState(false);

  // Only WhatsApp support now
  const [whatsappPhone, setWhatsappPhone] = useState('');

  const { refreshUser } = useContext(AuthContext);
  const { loadActiveGames } = useContext(GameContext);

  const loadSupportConfig = useCallback(async (options = {}) => {
    try {
      const wa = await getWhatsappSupport(options);
      if (wa) setWhatsappPhone(String(wa));
    } catch {
      // rely on defaults inside helper
    }
  }, []);

  useEffect(() => {
    loadSupportConfig();
  }, [loadSupportConfig]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser?.();
      await loadActiveGames?.();
      await loadSupportConfig({ forceRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, loadActiveGames, loadSupportConfig]);

  const normalizeDigits = (v) => String(v || '').replace(/\D/g, '');

  const openWhatsapp = useCallback(async () => {
    const digits = normalizeDigits(whatsappPhone);
    if (!digits) return;

    try {
      await Linking.openURL(`https://wa.me/91${digits}`);
    } catch {}
  }, [whatsappPhone]);

  // ✅ Android default exit confirmation
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (Platform.OS === 'android') {
          Alert.alert('Exit', 'Are you sure you want to exit?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]);
          return true; // block default back behavior
        }
        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, []),
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
        },
      ]}
    >
      <Header navigation={navigation} />

      <View style={[styles.topStripContainer, { backgroundColor: colors.background }]}>
        <TopStrip navigation={navigation} />
      </View>

      <View style={[styles.gamesListContainer, { backgroundColor: colors.background }]}>
        <GamesList
          navigation={navigation}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>

      {/* ✅ footer support now directly opens WhatsApp */}
      <Footer navigation={navigation} onSupportPress={openWhatsapp} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerRoot: { width: '100%' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logo: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 100, height: 40 },
  hamburger: { marginHorizontal: 5 },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  walletRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletAmt: { fontSize: 24 },

  /* TopStrip */
  topStripContainer: {},

  /* Games */
  gamesListContainer: { flex: 1 },

  /* Sidebar modal + overlay */
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '100%',
    zIndex: 51,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
});