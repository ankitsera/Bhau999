import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import GreenHeader from "../../components/GreenHeader";

const GREEN = "#3FA16C";

/** Replace with your real API url */
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://example.com/api";

/** --- Row component --- */
const TimeRow = ({ gameName, openTime, closeTime }) => (
  <View style={styles.rowCard}>
    <Text style={[styles.cell, styles.gameName]} numberOfLines={1}>
      {gameName}
    </Text>
    <Text style={[styles.cell, styles.timeText]}>{openTime}</Text>
    <Text style={[styles.cell, styles.timeText]}>{closeTime}</Text>
  </View>
);

const ListHeader = () => (
  <View style={styles.headerChip}>
    <Text style={[styles.headerText, { flex: 1.2 }]}>Game Name</Text>
    <Text style={[styles.headerText, { flex: 0.9 }]}>Open Time</Text>
    <Text style={[styles.headerText, { flex: 0.9, textAlign: "right" }]}>
      Close Time
    </Text>
  </View>
);

const TimeTable = ({ navigation }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      // EXPECTED API SHAPE:
      // [{ id, gameName, openTime, closeTime }, ...]
      const res = await fetch(`${API_URL}/timetable`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load time table");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TimeRow
      gameName={item.gameName}
      openTime={item.openTime}
      closeTime={item.closeTime}
    />
  );

  return (
    <View style={styles.container}>
      <GreenHeader navigation={navigation} title="Time Table" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: "#c0392b" }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(it, i) => String(it.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={ListHeader}
          ListHeaderComponentStyle={{ marginBottom: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default TimeTable;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F3F3" 
  },

  // Top green chip (column headers)
  headerChip: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  // Row card
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cell: { flex: 0.9 },
  gameName: { 
    flex: 1.2, 
    color: "#121212", 
    fontWeight: "800", 
    fontSize: 16 
  },
  timeText: { 
    color: "#1c1c1c", 
    fontSize: 15, 
    textAlign: "right" 
  },
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },
});