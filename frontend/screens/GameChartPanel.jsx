import React, { useEffect, useMemo, useCallback, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';

import ThemeHeader from "../components/ThemeHeader";
import EmptyState from "../components/EmptyState";
import LoadingView from "../components/LoadingView";
import { GameContext } from "../contexts/GameContext";
import { useTheme } from "../contexts/ThemeContext";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function sumDigitsMod10(val) {
  if (val === null || val === undefined) return null;
  const s = String(val);
  const digits = s.replace(/\D/g, "").split("");
  if (digits.length === 0) return null;
  const sum = digits.reduce((acc, d) => acc + Number(d), 0);
  return String(sum % 10);
}

function pad3(n) {
  if (n === null || n === undefined) return "***";
  const s = String(n);
  // allow 1/2/3 digits coming from DB, but chart wants 3
  return s.padStart(3, "0").slice(-3);
}

function cellText(openPana, closePana) {
  const left = openPana === null || openPana === undefined ? "***" : pad3(openPana);
  const right = closePana === null || closePana === undefined ? "***" : pad3(closePana);

  const mid1 = sumDigitsMod10(openPana) ?? "*";
  const mid2 = sumDigitsMod10(closePana) ?? "*";

  // matches your “open - mid2 - close” idea
  return `${left}-${mid1}${mid2}-${right}`;
}

function parseLocalDate(val) {
  // backend sends LocalDate like "2026-01-26"
  if (!val || typeof val !== "string") return null;
  const [y, m, d] = val.split("-").map((x) => Number(x));
  if (![y, m, d].every(Number.isFinite)) return null;
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function formatDDMMYYYY(dt) {
  if (!(dt instanceof Date)) return "--";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function startOfWeekMonday(dt) {
  const d = new Date(dt);
  const jsDay = d.getDay(); // 0=Sun..6=Sat
  const diffToMon = (jsDay + 6) % 7; // Mon->0 ... Sun->6
  d.setDate(d.getDate() - diffToMon);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(dt, days) {
  const d = new Date(dt);
  d.setDate(d.getDate() + days);
  return d;
}

const HeaderRow = ({ t }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.tableHeader, { backgroundColor: colors.primaryTile }]}>
      <View style={[styles.cellDate, styles.hCell, { borderRightColor: colors.divider }]}>
        <Text style={[styles.hText, { color: colors.text }]}>{t('common:date')}</Text>
      </View>
      {DAYS.map((d) => (
        <View key={d} style={[styles.cellDay, styles.hCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.hText, { color: colors.text }]}>{d}</Text>
        </View>
      ))}
    </View>
  );
};

const WeekRow = ({ item }) => {
  const { colors } = useTheme();

  // item: { key, start, end, cells: { MON: "123-45-678", ... } }
  return (
    <View style={[styles.tableRow, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <View style={[styles.cellDate, { borderRightColor: colors.divider }]}>
        <Text style={[styles.dateText, { color: colors.text }]}>{formatDDMMYYYY(item.start)}</Text>
        <Text style={[styles.toText, { color: colors.textTertiary }]}>TO</Text>
        <Text style={[styles.dateText, { color: colors.text }]}>{formatDDMMYYYY(item.end)}</Text>
      </View>

      {DAYS.map((d) => (
        <View key={d} style={[styles.cellDay, { borderRightColor: colors.divider }]}>
          <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={2}>
            {item.cells?.[d] || "***-**-***"}
          </Text>
        </View>
      ))}
    </View>
  );
};

const GameChartPanel = () => {
  const { t } = useTranslation(['games', 'common']);
  const { colors } = useTheme();

  const route = useRoute();
  const gameName = String(route?.params?.gameName || "").toUpperCase();

  const { gameHistory, isLoadingGameHistory, loadGameHistory } =
    useContext(GameContext);

  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!gameName) return;
    await loadGameHistory?.();
  }, [gameName, loadGameHistory]);

  useEffect(() => {
    fetchHistory?.();
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchHistory?.();
    } finally {
      setRefreshing(false);
    }
  }, [fetchHistory]);

  // filter to selected game and normalize fields
  const filtered = useMemo(() => {
    const arr = Array.isArray(gameHistory) ? gameHistory : [];
    return arr
      .filter(
        (x) =>
          String(x?.gameName || x?.game_name || "")
            .toUpperCase() === gameName
      )
      .map((x) => {
        const dt = parseLocalDate(x?.histDate || x?.hist_date);
        return {
          gameName: gameName,
          histDate: dt,
          openPana: x?.openPana ?? x?.open ?? null,
          closePana: x?.closePana ?? x?.close ?? null,
        };
      })
      .filter((x) => x.histDate instanceof Date);
  }, [gameHistory, gameName]);

  // group by week (Mon-Sun) and build chart cells
  const weeks = useMemo(() => {
    if (!filtered.length) return [];

    // sort by date asc so grouping is stable
    const sorted = filtered
      .slice()
      .sort(
        (a, b) =>
          (a.histDate?.getTime?.() || 0) - (b.histDate?.getTime?.() || 0)
      );

    const map = new Map();

    for (let i = 0; i < sorted.length; i++) {
      const it = sorted[i];
      const start = startOfWeekMonday(it.histDate);
      const key = start.toISOString().slice(0, 10); // YYYY-MM-DD
      const end = addDays(start, 6);

      // day name (Mon..Sun)
      const jsDay = it.histDate.getDay(); // 0=Sun..6=Sat
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Mon=0..Sun=6
      const dayName = DAYS[dayIndex];

      const existing = map.get(key) || {
        key,
        start,
        end,
        cells: { MON: null, TUE: null, WED: null, THU: null, FRI: null, SAT: null, SUN: null },
      };

      existing.cells[dayName] = cellText(it.openPana, it.closePana);
      map.set(key, existing);
    }

    // for UI like screenshot: newest weeks on top
    const out = Array.from(map.values()).sort(
      (a, b) => (b.start?.getTime?.() || 0) - (a.start?.getTime?.() || 0)
    );

    return out;
  }, [filtered]);

  const loading = isLoadingGameHistory && weeks.length === 0;

  return (
    <LoadingView loading={loading}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ThemeHeader title={`${gameName || t('games:game').toUpperCase()} ${t('games:gameChart').toUpperCase()}`} />

      <View style={styles.body}>
        {weeks.length === 0 && !isLoadingGameHistory ? (
          <EmptyState text={t('games:noChartData')} />
        ) : (
          // horizontal scroll so table never squishes
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableWrap}>
              <HeaderRow t={t} />
              <FlatList
                data={weeks}
                keyExtractor={(it) => it.key}
                renderItem={({ item }) => <WeekRow item={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.tableList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
    </LoadingView>
  );
};

export default GameChartPanel;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },

  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: { fontWeight: "700" },

  tableWrap: {
    padding: 10,
  },

  tableHeader: {
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
  },

  tableRow: {
    flexDirection: "row",
    marginTop: 6,
    borderRadius: 6,
    overflow: "hidden",

    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },

  hCell: {
    paddingVertical: 10,
  },
  hText: {
    fontWeight: "600",
  },

  cellDate: {
    width: 88,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },

  cellDay: {
    width: 74,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },

  dateText: {
    fontWeight: "900",
    fontSize: 12,
  },
  toText: {
    fontWeight: "900",
    marginVertical: 4,
    fontSize: 11,
  },

  cellText: {
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },

  tableList: {
    paddingBottom: 16,
  },
});