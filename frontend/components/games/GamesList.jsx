import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import EmptyState from "../../components/EmptyState";
import { GameContext } from "../../contexts/GameContext";
import { ThemeColor } from "../../contexts/Themes";

const RED = "#EF4B3E";

const ClosedPopup = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
            <MaterialCommunityIcons name="close" size={28} color="#9E9E9E" />
          </Pressable>

          <View style={styles.modalIconWrap}>
            <View style={styles.modalIconCircle}>
              <MaterialCommunityIcons name="close" size={46} color={RED} />
            </View>
          </View>

          <Text style={styles.modalTitle}>Sorry !</Text>
          <Text style={styles.modalMsg}>
            Betting is Closed for today.{"\n"}Please come next day to play.
          </Text>

          <Pressable onPress={onClose} style={styles.modalOkBtn}>
            <Text style={styles.modalOkText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const GameCard = ({ item, navigation, onPressClosed }) => {
  const handlePress = () => {
    if (item.isClosed) {
      onPressClosed?.();
      return;
    }

    // ✅ better way: pass only gameName
    navigation.navigate("Games Sub Types", { gameName: item.gameName });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.title}>{item.gameName}</Text>
        <Text style={[styles.statusText, { color: item.statusColor }]}>
          {item.statusText}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.result}>{item.resultText}</Text>

          <View style={styles.timeRow}>
            <View>
              <Text style={styles.timeLabel}>Open Bids</Text>
              <Text style={styles.timeValue}>{item.openTimeText}</Text>
            </View>

            <View style={{ marginLeft: 18 }}>
              <Text style={styles.timeLabel}>Close Bids</Text>
              <Text style={styles.timeValue}>{item.closeTimeText}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.circle, { backgroundColor: item.statusColor }]}>
          <MaterialCommunityIcons name={item.iconName} size={28} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const GamesList = ({ navigation, refreshing, onRefresh }) => {
  const { activeGamesUi, isLoadingActiveGames, loadActiveGames } =
    useContext(GameContext);

  const [showClosedModal, setShowClosedModal] = useState(false);

  useEffect(() => {
    // context also polls, but this ensures first paint isn’t empty
    loadActiveGames?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingActiveGames) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ThemeColor} />
      </View>
    );
  }

  if (!activeGamesUi || activeGamesUi.length === 0) {
    return <EmptyState icon="gamepad-variant" message="NO GAMES FOUND" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ClosedPopup
        visible={showClosedModal}
        onClose={() => setShowClosedModal(false)}
      />

      <FlatList
        data={activeGamesUi}
        refreshing={!!refreshing}
        onRefresh={onRefresh}
        keyExtractor={(item, index) => `${item.gameName}-${index}`}
        renderItem={({ item }) => (
          <GameCard
            item={item}
            navigation={navigation}
            onPressClosed={() => setShowClosedModal(true)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default GamesList;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#141414",
    flex: 1,
    paddingRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  result: {
    fontSize: 22,
    fontWeight: "900",
    color: ThemeColor,
  },
  timeRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: "#2c2c2c",
    fontWeight: "700",
  },
  timeValue: {
    fontSize: 14,
    color: "#2f2f2f",
    fontWeight: "600",
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },

  // ===== Modal styles =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 6,
  },
  modalIconWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  modalIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#FCE6E6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#D32F2F",
    marginTop: 6,
  },
  modalMsg: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
    fontWeight: "600",
  },
  modalOkBtn: {
    marginTop: 18,
    width: "75%",
    backgroundColor: ThemeColor,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalOkText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});