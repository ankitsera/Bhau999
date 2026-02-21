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
import {
  getCallSupport,
  getWhatsappSupport,
  getTelegramChannel,
} from '../utils/AppConfigService';

import { useTheme } from '../contexts/ThemeContext';

const Header = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { isDarkMode, colors } = useTheme();
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);

  return (
    <View style={[styles.headerRoot, { backgroundColor: colors.background }]}>
      {/* keep translucent so modal overlay can cover status bar */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Sidebar modal */}
      <Modal
        visible={isSideBarVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setIsSideBarVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.sidebar, { backgroundColor: colors.background }]}
          >
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

      {/* Top bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            shadowColor: colors.text,
          },
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
          <Text style={[styles.brandText, { color: colors.text }]}>
            SARA777
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.walletRight}
            onPress={() => {
              navigation.navigate('Add Money');
            }}
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
  const { isDarkMode, colors } = useTheme();

  const [supportVisible, setSupportVisible] = useState(false);
  const [quitVisible, setQuitVisible] = useState(false);

  // Pull to refresh state (UI will be attached to GamesList FlatList)
  const [refreshing, setRefreshing] = useState(false);

  // from AppConfig (defaults already inside helpers)
  const [supportPhone, setSupportPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');

  // User refresh handler should be added in AuthContext as `refreshUser`
  const { refreshUser } = useContext(AuthContext);

  // Manual refresh of active games
  const { loadActiveGames } = useContext(GameContext);

  const loadSupportConfig = useCallback(async (options = {}) => {
    try {
      const [call, wa, tg] = await Promise.all([
        getCallSupport(options),
        getWhatsappSupport(options),
        getTelegramChannel(options),
      ]);

      if (call) setSupportPhone(String(call));
      if (wa) setWhatsappPhone(String(wa));
      if (tg) setTelegramUrl(String(tg));
    } catch {
      // rely on defaults inside helpers
    }
  }, []);

  useEffect(() => {
    loadSupportConfig();
  }, [loadSupportConfig]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh user (balance etc.)
      await refreshUser?.();

      // ✅ manual pull should also refresh active games (apart from polling)
      await loadActiveGames?.();

      // Refresh important config values on manual pull
      await loadSupportConfig({ forceRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, loadActiveGames, loadSupportConfig]);

  // dismiss modal before exiting so it doesn't show again on resume
  const confirmQuit = useCallback(() => {
    setQuitVisible(false);
    setTimeout(() => {
      BackHandler.exitApp();
    }, 0);
  }, []);

  // Ensure the back override ONLY applies when Home is focused
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        setQuitVisible(true);
        return true; // block default only while focused on Home
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, []),
  );

  const normalizeDigits = (v) => String(v || '').replace(/\D/g, '');

  const openDialer = () => {
    const digits = normalizeDigits(supportPhone);
    if (!digits) return;
    Linking.openURL(`tel:+91${digits}`).catch(() => {});
  };

  const openWhatsapp = async () => {
    const digits = normalizeDigits(whatsappPhone);
    if (!digits) return;
    try {
      return await Linking.openURL(`https://wa.me/91${digits}`);
    } catch {}
  };

  const openTelegram = () => {
    if (!telegramUrl) return;
    Linking.openURL(telegramUrl).catch(() => {});
  };

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

      <View
        style={[
          styles.topStripContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <TopStrip navigation={navigation} />
      </View>

      <View
        style={[
          styles.gamesListContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <GamesList
          navigation={navigation}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>

      {/* fixed footer */}
      <Footer
        navigation={navigation}
        onSupportPress={() => setSupportVisible(true)}
      />

      {/* Support modal */}
      <Modal
        visible={supportVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSupportVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.supportCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.supportTitle, { color: colors.text }]}>
              Support
            </Text>

            <Pressable
              style={styles.closeX}
              onPress={() => setSupportVisible(false)}
            >
              <View
                style={[
                  styles.closeCircle,
                  { backgroundColor: colors.surface },
                ]}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={colors.textTertiary}
                />
              </View>
            </Pressable>

            <View style={styles.supportRow}>
              <TouchableOpacity
                style={[styles.supportBtn, { backgroundColor: '#167de4ff' }]}
                onPress={openDialer}
              >
                <MaterialIcons name="call" size={22} color="#fff" />
                <Text style={styles.supportBtnText}>Call Us</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.supportBtn, { backgroundColor: '#1fa851ff' }]}
                onPress={openWhatsapp}
              >
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.supportBtnText}>Whatsapp</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.supportRowCenter}>
              <TouchableOpacity
                style={[
                  styles.supportBtn,
                  styles.supportBtnHalf,
                  { backgroundColor: '#2AABEE' },
                ]}
                onPress={openTelegram}
              >
                <MaterialIcons name="telegram" size={26} color="#fff" />
                <Text style={styles.supportBtnText}>Telegram</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quit confirm modal */}
      <Modal
        visible={quitVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setQuitVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.quitCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[styles.quitHeader, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.quitTitle}>Quit</Text>
            </View>

            <View
              style={[
                styles.quitIconCircle,
                { backgroundColor: colors.primaryIconBg },
              ]}
            >
              <MaterialCommunityIcons
                name="run-fast"
                size={40}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.quitText, { color: colors.text }]}>
              Are you sure you want to quit the app?
            </Text>

            <View style={styles.quitRow}>
              <TouchableOpacity
                style={[
                  styles.quitBtn,
                  styles.quitBtnGhost,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={() => setQuitVisible(false)}
              >
                <Text style={[styles.quitBtnText, { color: colors.primary }]}>
                  No
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quitBtn,
                  styles.quitBtnSolid,
                  { backgroundColor: colors.primary },
                ]}
                onPress={confirmQuit}
              >
                <Text style={[styles.quitBtnText, { color: '#fff' }]}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  headerRoot: {
    width: '100%',
  },
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
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburger: {
    marginHorizontal: 5,
  },
  brandText: {
    fontWeight: '800',
    fontSize: 24,
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletAmt: {
    fontSize: 24,
  },

  /* TopStrip */
  topStripContainer: {},

  /* Games */
  gamesListContainer: {
    flex: 1,
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

  /* Generic modal backdrop */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  /* Support card */
  supportCard: {
    width: '95%',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  closeX: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  supportRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  supportBtn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  supportBtnHalf: {
    width: '48%',
  },
  supportBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* Quit card */
  quitCard: {
    width: '92%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignItems: 'center',
  },
  quitHeader: {
    width: '100%',
    paddingVertical: 12,
  },
  quitTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  quitIconCircle: {
    marginTop: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  quitRow: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    width: '100%',
    justifyContent: 'space-evenly',
  },
  quitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitBtnGhost: {
    borderWidth: 2,
  },
  quitBtnSolid: {},
  quitBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
