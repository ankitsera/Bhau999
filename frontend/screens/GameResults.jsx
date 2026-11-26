import React, { useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';

import ThemeHeader from "../components/ThemeHeader";
import EmptyState from "../components/EmptyState";
import LoadingView from "../components/LoadingView";
import { GameContext } from "../contexts/GameContext";
import { ThemeColor, FONT } from "../contexts/Themes";

const sumDigitsMod10 = (val) => {
  if (val === null || val === undefined) return null;
  const s = String(val);
  const digits = s.replace(/\D/g, "").split("");
  if (digits.length === 0) return null;
  const sum = digits.reduce((acc, d) => acc + Number(d), 0);
  return String(sum % 10);
};

const pad3 = (n) => {
  if (n === null || n === undefined) return "***";
  const s = String(n);
  return s.padStart(3, "0").slice(-3);
};

const resultText = (openPana, closePana) => {
  const left = openPana === null || openPana === undefined ? "***" : pad3(openPana);
  const right = closePana === null || closePana === undefined ? "***" : pad3(closePana);

  const mid1 = sumDigitsMod10(openPana) ?? "*";
  const mid2 = sumDigitsMod10(closePana) ?? "*";

  return `${left}-${mid1}${mid2}-${right}`;
};

const ResultRow = ({ item }) => {
  const name = String(item?.gameName || "GAME").toUpperCase();

  // Active games API fields can be open_pana/close_pana (snake) or openPana/closePana (camel)
  const openPana = item?.raw?.openPana ?? item?.raw?.open_pana ?? null;
  const closePana = item?.raw?.closePana ?? item?.raw?.close_pana ?? null;

  return (
    <View style={styles.card}>
      <Text style={styles.gameName} numberOfLines={1}>
        {name}
      </Text>

      <Text style={styles.resultText} numberOfLines={1}>
        {resultText(openPana, closePana)}
      </Text>
    </View>
  );
};

const GameResults = () => {
  const { t } = useTranslation(['games', 'common']);
  const { activeGamesUi, isLoadingActiveGames, loadActiveGames } =
    useContext(GameContext);

  useFocusEffect(
    useCallback(() => {
      loadActiveGames?.();
    }, [loadActiveGames])
  );

  const onRefresh = useCallback(async () => {
    await loadActiveGames?.();
  }, [loadActiveGames]);

  const list = Array.isArray(activeGamesUi) ? activeGamesUi : [];
  const loading = isLoadingActiveGames && list.length === 0;

  return (
    <LoadingView loading={loading}>
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ThemeHeader title={t('games:marketResultHistory')} />

      <View style={styles.body}>
        {list.length === 0 && !isLoadingActiveGames ? (
          <EmptyState text={t('games:noResultsFound')} />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(it, i) => String(it?.gameName ?? i)}
            renderItem={({ item }) => <ResultRow item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={!!isLoadingActiveGames}
                onRefresh={onRefresh}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>
    </SafeAreaView>
    </LoadingView>
  );
};

export default GameResults;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  body: {
    flex: 1,
  },

  listContent: {
    padding: 14,
    paddingBottom: 24,
  },

  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  loaderText: {
    color: "#111",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  gameName: {
    flex: 1,
    marginRight: 12,
    color: ThemeColor,
    fontWeight: "900",
    fontSize: FONT.body,
    letterSpacing: 0.3,
  },

  resultText: {
    color: "#111",
    fontWeight: "900",
    fontSize: FONT.title,
    letterSpacing: 0.6,
  },
});