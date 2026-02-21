import React, { useContext, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from "react-native";
import ThemeHeader from "../../components/ThemeHeader";
import EmptyState from "../../components/EmptyState";
import { GameContext } from "../../contexts/GameContext";
import { getMinBetAmount } from "../../utils/AppConfigService";
import { useTheme } from "../../contexts/ThemeContext";

const SectionHeader = ({ title }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
};

const RateRow = ({ label, value }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.rateRow, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <Text style={[styles.rateLabel, { color: colors.text }]}>{label}:</Text>
      <Text style={[styles.rateValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const GameRate = () => {
  const { colors } = useTheme();

  const { rates, isLoadingRates, loadGameRates } = useContext(GameContext);

  const [minBetAmount, setMinBetAmount] = React.useState(null);
  const [isConfigLoading, setIsConfigLoading] = React.useState(false);

  const fetchAll = React.useCallback(
    async (options = {}) => {
      let mounted = true;
      try {
        setIsConfigLoading(true);

        await Promise.all([
          loadGameRates?.(),
          (async () => {
            const v = await getMinBetAmount(options); // ✅ default handled inside helper
            if (!mounted) return;
            setMinBetAmount(v);
          })(),
        ]);
      } finally {
        if (mounted) setIsConfigLoading(false);
      }

      return () => {
        mounted = false;
      };
    },
    [loadGameRates],
  );

  // run once on mount → avoids infinite loop
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setIsConfigLoading(true);

        await Promise.all([
          loadGameRates?.(),
          (async () => {
            const v = await getMinBetAmount(); // Cached ok on mount
            if (!mounted) return;
            setMinBetAmount(v);
          })(),
        ]);
      } finally {
        if (mounted) setIsConfigLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ pull-to-refresh
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadGameRates?.(),
        getMinBetAmount({ forceRefresh: true }), // ✅ bypass cache on manual refresh
      ]).then((vals) => {
        // vals[1] is min bet (from helper)
        const v = vals?.[1];
        if (v != null) setMinBetAmount(v);
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadGameRates]);

  const sections = useMemo(() => {
    if (!rates || rates.length === 0) return [];

    const minBet = Number(minBetAmount); // should already be a number from helper
    const safeMinBet = Number.isFinite(minBet) && minBet > 0 ? minBet : 0;

    return [
      {
        title: "Game Win Ratio for All Bids",
        data: rates.map((r) => {
          const gameName = r.type ?? "Unknown";
          const baseRateNum = Number(r.rate);
          const total = Number.isFinite(baseRateNum) ? baseRateNum : 0;

          const displayValue = `${safeMinBet} Ka ${total}`;

          return {
            label: gameName,
            value: displayValue,
          };
        }),
      },
    ];
  }, [rates, minBetAmount]);

  const isLoading = (isLoadingRates || isConfigLoading) && !refreshing;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title="Game Rate" />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState icon="chart-line-variant" message="NO RATE DATA FOUND" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => (item.label || "rate") + index}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          renderItem={({ item }) => (
            <RateRow label={item.label} value={item.value} />
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

export default GameRate;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    textAlign: "center",
  },
  rateLabel: {
    fontSize: 18,
    textAlign: "center",
  },
  rateValue: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
});