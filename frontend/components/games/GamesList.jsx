import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from 'react-i18next';
import EmptyState from "../../components/EmptyState";
import { GameContext } from "../../contexts/GameContext";
import { useTheme } from "../../contexts/ThemeContext";

const RED = "#EF4B3E";

/* ------------------ time helpers ------------------ */

// "10:20 AM" -> { h24, m } or null
const parseTime12h = (t) => {
  const s = String(t || "").trim().toUpperCase();
  if (!s || s === "--:--") return null;

  // expected: "HH:MM AM" or "H:MM AM"
  const parts = s.split(" ");
  if (parts.length < 2) return null;

  const timePart = parts[0];
  const ampm = parts[1];

  const [hhRaw, mmRaw] = timePart.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (ampm !== "AM" && ampm !== "PM") return null;

  let h = hh % 12;
  if (ampm === "PM") h += 12;

  return { h24: h, m: mm };
};

// {h24,m} -> "HH:MM AM"
const formatTime12hFrom24 = ({ h24, m }) => {
  if (!Number.isFinite(h24) || !Number.isFinite(m)) return "--:--";
  let h = h24 % 24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

// add minutes to "10:20 AM" => "10:30 AM"
const addMinutesTo12h = (t, minsToAdd = 10) => {
  const parsed = parseTime12h(t);
  if (!parsed) return "--:--";

  let total = parsed.h24 * 60 + parsed.m + (Number(minsToAdd) || 0);
  total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60); // safe wrap

  const h24 = Math.floor(total / 60);
  const m = total % 60;
  return formatTime12hFrom24({ h24, m });
};

/* ------------------ Modal ------------------ */

const ClosedPopup = ({ visible, onClose, game }) => {
  const { t } = useTranslation(['games', 'common']);
  const { colors } = useTheme();

  const gameName = String(game?.gameName || "GAME").toUpperCase();

  const openBidLast = game?.openTimeText || "--:--";
  const closeBidLast = game?.closeTimeText || "--:--";

  const openResult = useMemo(() => addMinutesTo12h(openBidLast, 10), [openBidLast]);
  const closeResult = useMemo(() => addMinutesTo12h(closeBidLast, 10), [closeBidLast]);

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard2,
            { backgroundColor: colors.surface, shadowColor: colors.text },
          ]}
        >
          {/* close icon top-right */}
          <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn2}>
            <MaterialCommunityIcons name="close" size={26} color={colors.textTertiary} />
          </Pressable>

          {/* big X circle */}
          <View style={[styles.iconCircle2, { backgroundColor: "#F8D7DA" }]}>
            <MaterialCommunityIcons name="close" size={44} color={RED} />
          </View>

          <Text style={[styles.closedTitle2, { color: RED }]}>
            {t('games:bettingClosedMessage')}
          </Text>

          <Text style={[styles.gameName2, { color: colors.text }]} numberOfLines={1}>
            {gameName}
          </Text>

          {/* time rows */}
          <View style={styles.timeTable2}>
            <View style={styles.timeRow2}>
              <Text style={[styles.timeLabel2, { color: colors.textSecondary }]}>
                {t('games:openResultTime')} :
              </Text>
              <Text style={[styles.timeValue2, { color: colors.text }]}>{openResult}</Text>
            </View>

            <View style={styles.timeRow2}>
              <Text style={[styles.timeLabel2, { color: colors.textSecondary }]}>
                {t('games:openBidLastTime')} :
              </Text>
              <Text style={[styles.timeValue2, { color: colors.text }]}>{openBidLast}</Text>
            </View>

            <View style={styles.timeRow2}>
              <Text style={[styles.timeLabel2, { color: colors.textSecondary }]}>
                {t('games:closeResultTime')} :
              </Text>
              <Text style={[styles.timeValue2, { color: colors.text }]}>{closeResult}</Text>
            </View>

            <View style={styles.timeRow2}>
              <Text style={[styles.timeLabel2, { color: colors.textSecondary }]}>
                {t('games:closeBidLastTime')} :
              </Text>
              <Text style={[styles.timeValue2, { color: colors.text }]}>{closeBidLast}</Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={[
              styles.modalOkBtn2,
              { backgroundColor: colors.primary }, // keep theme
            ]}
          >
            <Text style={[styles.modalOkText2, { color: colors.text }]}>{t('common:ok')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

/* ------------------ Card ------------------ */

const GameCard = ({ item, navigation, onPressClosed }) => {
  const { t } = useTranslation(['games']);
  const { colors } = useTheme();

  const handlePress = () => {
    if (item.isClosed) {
      onPressClosed?.(item);
      return;
    }
    navigation.navigate("Games Sub Types", { gameName: item.gameName });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.title, { color: colors.text }]}>{item.gameName}</Text>
        <Text style={[styles.statusText, { color: item.statusColor }]}>
          {item.statusText}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.result, { color: colors.primary }]}>{item.resultText}</Text>

          <View style={styles.timeRow}>
            <View>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {t('games:openBids')}
              </Text>
              <Text style={[styles.timeValue, { color: colors.textSecondary }]}>
                {item.openTimeText}
              </Text>
            </View>

            <View style={{ marginLeft: 18 }}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {t('games:closeBids')}
              </Text>
              <Text style={[styles.timeValue, { color: colors.textSecondary }]}>
                {item.closeTimeText}
              </Text>
            </View>
          </View>
        </View>

        <View>
          <Image
            source={require("../../assets/Images/play.webp")}
            style={styles.playIcon}
            resizeMode="contain"
          />
          <Text style={[styles.playText, { color: colors.text }]}>{t('games:playGame')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const GamesList = ({ navigation, refreshing, onRefresh }) => {
  const { t } = useTranslation(['games']);
  const { colors } = useTheme();

  const { activeGamesUi, isLoadingActiveGames, loadActiveGames } =
    useContext(GameContext);

  const [showClosedModal, setShowClosedModal] = useState(false);
  const [closedGame, setClosedGame] = useState(null);

  useEffect(() => {
    // context also polls, but this ensures first paint isn’t empty
    loadActiveGames?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingActiveGames) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activeGamesUi || activeGamesUi.length === 0) {
    return <EmptyState message={t('games:noGamesFound')} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ClosedPopup
        visible={showClosedModal}
        game={closedGame}
        onClose={() => {
          setShowClosedModal(false);
          setClosedGame(null);
        }}
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
            onPressClosed={(g) => {
              setClosedGame(g);
              setShowClosedModal(true);
            }}
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    paddingRight: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  result: {
    fontSize: 18,
    fontWeight: "900",
  },
  timeRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  playIcon: {
    width: 72,
    height: 46,
  },
  playText: {
    fontSize: 12,
    textAlign: "center",
  },

  // ===== Modal styles =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  modalCard2: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  modalCloseBtn2: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },

  iconCircle2: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  closedTitle2: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  gameName2: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.4,
  },

  timeTable2: {
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 6,
  },

  timeRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  timeLabel2: {
    fontSize: 15,
    fontWeight: "700",
  },

  timeValue2: {
    fontSize: 15,
    fontWeight: "900",
  },

  modalOkBtn2: {
    marginTop: 16,
    width: "100%",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },

  modalOkText2: {
    fontSize: 18,
    fontWeight: "900",
  },
});