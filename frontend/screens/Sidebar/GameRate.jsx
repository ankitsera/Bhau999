// screens/GameRate/GameRate.jsx
import React, { useContext, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from "react-native";
import GreenHeader from "../../components/GreenHeader";
import EmptyState from "../../components/EmptyState";
import { GameContext } from "../../contexts/GameContext";
import { getMinBetAmount } from "../../utils/AppConfigService";

const GREEN = "#3FA16C";

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const RateRow = ({ label, value }) => (
  <View style={styles.rateRow}>
    <Text style={styles.rateLabel}>{label}:</Text>
    <Text style={styles.rateValue}>{value}</Text>
  </View>
);

const GameRate = () => {
  const { rates, isLoadingRates, loadGameRates } = useContext(GameContext);

  const [minBetAmount, setMinBetAmount] = React.useState(null);
  const [isConfigLoading, setIsConfigLoading] = React.useState(false);

  // run once on mount → avoids infinite loop
  useEffect(() => {
    if (loadGameRates) loadGameRates();

    let mounted = true;
    const loadMinBet = async () => {
      try {
        setIsConfigLoading(true);
        const v = await getMinBetAmount(); // ✅ default handled inside AppConfigService
        if (!mounted) return;
        setMinBetAmount(v);
      } finally {
        if (mounted) setIsConfigLoading(false);
      }
    };
    loadMinBet();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const isLoading = isLoadingRates || isConfigLoading;

  return (
    <View style={styles.container}>
      <GreenHeader title="Game Rate" />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
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
        />
      )}
    </View>
  );
};

export default GameRate;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    backgroundColor: GREEN,
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
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    textAlign: "center",
  },
  rateLabel: {
    fontSize: 18,
    color: "#111",
    textAlign: "center",
  },
  rateValue: {
    fontSize: 18,
    color: "#111",
    fontWeight: "800",
    textAlign: "center",
  },
});