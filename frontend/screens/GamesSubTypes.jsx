import React, { useContext, useMemo, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, StatusBar, Modal, Pressable, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from 'react-i18next';

import SubGameTile from "../components/games/SubGameTile";
import { SUB_GAME_TYPES } from "../data/SubGameType";
import ThemeHeader from "../components/ThemeHeader";
import EmptyState from "../components/EmptyState";
import { GameContext } from "../contexts/GameContext";
import { useTheme } from "../contexts/ThemeContext";

const RED = "#EF4B3E";

const ClosedPopup = ({ visible, onClose, t }) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
            <MaterialCommunityIcons name="close" size={28} color={colors.textTertiary} />
          </Pressable>

          <View style={styles.modalIconWrap}>
            <View style={[styles.modalIconCircle, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="close" size={46} color={RED} />
            </View>
          </View>

          <Text style={[styles.modalTitle, { color: colors.error }]}>{t('screens:sorry')}</Text>
          <Text style={[styles.modalMsg, { color: colors.textSecondary }]}>
            {t('games:bettingClosedMessage')}
          </Text>

          <Pressable onPress={onClose} style={[styles.modalOkBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.modalOkText, { color: '#fff' }]}>{t('common:ok')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const GamesSubTypes = () => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors, isDarkMode } = useTheme();

  const navigation = useNavigation();
  const route = useRoute();

  const { getGameRawByName, isLoadingActiveGames, loadActiveGames } =
    useContext(GameContext);

  // ✅ better way: only gameName comes from route
  const gameName = route.params?.gameName;

  const [showClosedModal, setShowClosedModal] = useState(false);

  // if user lands here and games aren’t loaded yet, fetch
  useEffect(() => {
    if (!gameName) return;
    loadActiveGames?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameName]);

  const game = getGameRawByName?.(gameName);

  const allowedTypes = Array.isArray(game?.allowed_types) ? game.allowed_types : [];
  const allowedLen = allowedTypes.length; // 2 / 1 / 0

  // if it becomes closed while user is here (polling), kick them out
  useEffect(() => {
    if (allowedLen === 0 && gameName) {
      setShowClosedModal(true);
    }
  }, [allowedLen, gameName]);

  const filteredSubGames = useMemo(() => {
    // Before openTime => show all
    if (allowedLen === 2) return SUB_GAME_TYPES;

    // After openTime => hide Jodi + Sangam stuff
    if (allowedLen === 1) {
      return SUB_GAME_TYPES.filter((x) => {
        const hay = `${x.label || ""} ${x.key || ""}`.toLowerCase();
        const isJodi = hay.includes("jodi");
        const isSangam = hay.includes("sangam");
        return !isJodi && !isSangam;
      });
    }

    // Closed: doesn’t matter (we’ll block navigation anyway)
    return SUB_GAME_TYPES;
  }, [allowedLen]);

  const handlePressTile = (item) => {
    if (allowedLen === 0) {
      setShowClosedModal(true);
      return;
    }

    // ✅ pass only gameName (no stale object)
    navigation.navigate(item.routeName, {
      gameName,
      subGameKey: item.key,
    });
  };

  const title = gameName || "GAME";

  if (!gameName) {
    return <EmptyState message={t('games:missingGame')} />;
  }

  if (isLoadingActiveGames && !game) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
        <ThemeHeader title={title} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontWeight: "700" }}>{t('common:loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      <ThemeHeader title={title} />

      <ClosedPopup
        visible={showClosedModal}
        onClose={() => {
          setShowClosedModal(false);
          navigation.goBack(); // kick back to list
        }}
        t={t}
      />

      <FlatList
        data={filteredSubGames}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <SubGameTile
            label={item.label}
            image={item.image}
            onPress={() => handlePressTile(item)}
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default GamesSubTypes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContent: {
    marginTop: 8,
  },

  // modal
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
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    borderWidth: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  modalMsg: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  modalOkBtn: {
    marginTop: 18,
    width: "75%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalOkText: {
    fontSize: 18,
    fontWeight: "800",
  },
});