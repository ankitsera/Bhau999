import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from "react-native";
import GreenHeader from "../../components/GreenHeader";
import EmptyState from "../../components/EmptyState";

const GREEN = "#3FA16C";

// Make a mock API call to fetch game rates
async function fetchGameRates() {
  // Simulated API response with fixed game rates
  await new Promise((r) => setTimeout(r, 500));

  return {
    title: "Game Win Ratio for All Bids",
    sections: [
      {
        header: "Game Win Ratio for All Bids",
        items: [
          { label: "Single Ank", value: "10 Ka 95" },
          { label: "Jodi", value: "10 Ka 950" },
          { label: "Single Pana", value: "10 Ka 1500" },
          { label: "Double Pana", value: "10 Ka 3000" },
          { label: "Triple Pana", value: "10 Ka 6000" },
          { label: "Half Sangam", value: "10 Ka 12000" },
          { label: "Full Sangam", value: "10 Ka 120000" },
        ],
      },
      {
        header: "Starline Win Ratio for All Bids",
        items: [
          { label: "Single Ank", value: "10 Ka 100" },
          { label: "Single Pana", value: "10 Ka 1500" },
          { label: "Double Pana", value: "10 Ka 3000" },
          { label: "Triple Pana", value: "10 Ka 6000" },
        ],
      },
    ],
  };
}

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

const GameRate = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGameRates();
      const transformed = (res.sections || []).map((sec) => ({
        title: sec.header,
        data: sec.items || [],
      }));
      setSections(transformed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <GreenHeader navigation={navigation} title="Game Rate" />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
      ) : sections.length === 0 ? (
        <EmptyState icon="chart-line-variant" message="NO RATE DATA FOUND" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.label + index}
          renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
          renderItem={({ item }) => <RateRow label={item.label} value={item.value} />}
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
    justifyContent: "center" 
  },

  sectionHeader: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "800" 
  },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  rateLabel: { 
    fontSize: 18, 
    color: "#111" 
  },
  rateValue: { 
    fontSize: 18, 
    color: "#111", 
    fontWeight: "800", 
  },
});