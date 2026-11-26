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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { GameContext } from '../contexts/GameContext';
import SideBarNavigation from '../components/SideBarNavigation';
import Footer from '../components/Footer';
import TopStrip from '../components/TopStrip';
import GamesList from '../components/games/GamesList';
import BrandLogo from '../components/BrandLogo';

// ✅ AppConfig helpers (defaults live inside these)
import { getWhatsappSupport } from '../utils/AppConfigService';

import { useTheme } from '../contexts/ThemeContext';
import { useFeature, FEATURES } from '../utils/Features';

const Header = ({ navigation }) => {
  const { user, refreshBalance } = useContext(AuthContext);
  const { colors } = useTheme();
  const canPay = useFeature(FEATURES.PAYMENTS);
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);

  return (
    <View style={styles.headerRoot}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
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

      <View style={styles.header}>
        {/* Menu + logo pill */}
        <Pressable
          style={styles.logoPill}
          onPress={() => setIsSideBarVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons name="menu" size={22} color={colors.onPrimary} />
          <BrandLogo size={22} tone="onPrimary" />
        </Pressable>

        <View style={styles.headerRight}>
          {/* Wallet pill */}
          {canPay && (
            <Pressable
              style={[styles.walletPill, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Add Money')}
            >
              <View style={[styles.walletIconCircle, { backgroundColor: colors.dark }]}>
                <MaterialCommunityIcons name="wallet" size={15} color={colors.onDark} />
              </View>
              <Text style={[styles.walletAmt, { color: colors.text }]} numberOfLines={1}>
                ₹ {user?.balance ? user.balance : '0.0'}
              </Text>
              <Pressable
                onPress={() => refreshBalance?.()}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
              >
                <MaterialCommunityIcons name="refresh" size={17} color={colors.primary} />
              </Pressable>
            </Pressable>
          )}

          {/* Bell */}
          <Pressable
            style={[styles.bellCircle, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const Home = ({ navigation }) => {
  const { t } = useTranslation(['common']);
  const { colors } = useTheme();

  // Pull to refresh state (UI will be attached to GamesList FlatList)
  const [refreshing, setRefreshing] = useState(false);

  // Only WhatsApp support now
  const [whatsappPhone, setWhatsappPhone] = useState('');

  const { refreshUser, refreshBalance } = useContext(AuthContext);
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

  // Pull the latest wallet every time Home comes back into focus, so a payout
  // declared while the user was on another screen shows up immediately.
  useFocusEffect(
    useCallback(() => {
      refreshBalance?.();
    }, [refreshBalance]),
  );

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
          Alert.alert(t('quit'), t('quitMessage'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('quit'), style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]);
          return true; // block default back behavior
        }
        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    },[t]),
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
        },
      ]}
    >
      <Header navigation={navigation} />

      <View style={styles.topStripContainer}>
        <TopStrip navigation={navigation} />
      </View>

      {/* White rounded sheet holding the games list */}
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
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingLeft: 5,
    paddingRight: 10,
    borderRadius: 20,
    maxWidth: 160,
  },
  walletIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletAmt: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* TopStrip */
  topStripContainer: {},

  /* Games */
  gamesListContainer: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    paddingTop: 4,
  },

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