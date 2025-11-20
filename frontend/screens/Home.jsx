import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  StatusBar,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AuthContext } from "../contexts/AuthContext";
import SideBarNavigation from "../components/SideBarNavigation";
import Footer from "../components/Footer";
import TopStrip from "../components/TopStrip";
import GamesList from "../components/GamesList";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Header = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { logout } = useContext(AuthContext);
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);

  return (
    <View style={styles.headerRoot}>
      {/* keep translucent so modal overlay can cover status bar */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

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
          <View style={styles.sidebar}>
            <SideBarNavigation
              navigation={navigation}
              closeSidebar={() => setIsSideBarVisible(false)}
            />
          </View>
          <Pressable style={styles.overlay} onPress={() => setIsSideBarVisible(false)} />
        </View>
      </Modal>

      {/* Top bar */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Pressable
            style={styles.hamburger}
            onPress={() => setIsSideBarVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="format-align-left" size={28} color="black" />
          </Pressable>
          <Text style={styles.brandText}>AS Online</Text>
        </View>

        <View style = {styles.headerRight}>
          <View style={styles.walletRight}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={28}
              color="#000"
            />
            <Text style={styles.walletAmt}>
              {user?.balance ? user.balance : '0.0'}
            </Text>
          </View>
          <Pressable onPress={logout}>
            <MaterialIcons name="notifications-active" size={30} color="black" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* fixed header */}
      <Header navigation={navigation} />

      {/* fixed top strip right below header */}
      <View style={styles.topStripContainer}>
        <TopStrip />
      </View>

      {/* only GamesList scrolls */}
      <View style={styles.gamesListContainer}>
        <GamesList />
      </View>

      {/* fixed footer */}
      <Footer navigation={navigation} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    // let content render under translucent status bar but keep header visible on Android
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },

  /* Header */
  headerRoot: {
    width: "100%",
    backgroundColor: "#fff",
  },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logo: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  hamburger: { 
    marginHorizontal: 5 
  },
  brandText: { 
    fontWeight: "800", 
    color: "#000", 
    fontSize: 24, 
    marginLeft: 6 
  },
  headerRight: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10
  },
  walletRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  walletAmt: { 
    color: '#000', 
    fontSize: 24 
  },

  /* TopStrip */
  topStripContainer: {
    backgroundColor: "#fff",
  },

  /* Games */
  gamesListContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* Sidebar modal + overlay */
  modalContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "70%",
    height: "100%",
    backgroundColor: "#fff",
    zIndex: 51,
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 50,
  },
});