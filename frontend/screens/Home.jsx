// src/screens/Home.jsx
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

const Header = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);

  return (
    <View style={styles.headerRoot}>
      {/* Transparent status bar that content draws under */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Sidebar modal covering the full screen (including status bar) */}
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

          {/* Full-screen dark overlay */}
          <Pressable
            style={styles.overlay}
            onPress={() => setIsSideBarVisible(false)}
          />
        </View>
      </Modal>

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Pressable
            style={styles.hamburger}
            onPress={() => setIsSideBarVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="menu" size={30} color="black" />
          </Pressable>

          <Text style={styles.brandText}>AS Online</Text>
        </View>

        <Pressable onPress={logout}>
          <MaterialIcons name="notifications" size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
};

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      
      <View style={{ flex: 1 }}>
        
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },

  /* Header container */
  headerRoot: {
    width: "100%",
  },
  header: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
  },
  hamburger: {
    marginHorizontal: 5,
  },
  brandText: {
    fontWeight: "800",
    color: "#000",
    fontSize: 20,
    marginLeft: 6,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 50,
  },
});