import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import GreenHeader from "../../components/GreenHeader";

const GREEN = "#3FA16C";

const Row = ({ label, value, onChange }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#d6d6d6", true: "#bfe8cf" }}
      thumbColor={value ? GREEN : "#f4f3f4"}
    />
  </View>
);

const Settings = ({ navigation }) => {
  const [game, setGame] = useState(true);
  const [main, setMain] = useState(true);
  const [starline, setStarline] = useState(true);
  const [jackpot, setJackpot] = useState(true);

  useEffect(() => {
    // TODO: read preferences from storage/api
  }, []);
  useEffect(() => {
    // TODO: persist preferences
  }, [game, main, starline, jackpot]);

  return (
    <View style={styles.container}>
      <GreenHeader title="Setting" />
      <View style={styles.card}>
        <View style={styles.banner}><Text style={styles.bannerText}>Notification Setting</Text></View>

        <Row label="Game Notification:" value={game} onChange={setGame} />
        <View style={styles.sep} />
        <Row label="Main Notification:" value={main} onChange={setMain} />
        <View style={styles.sep} />
        <Row label="Lucky Starline Notification" value={starline} onChange={setStarline} />
        <View style={styles.sep} />
        <Row label="Lucky JackPot Notification" value={jackpot} onChange={setJackpot} />
      </View>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F3F3" 
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    paddingBottom: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  banner: {
    backgroundColor: GREEN,
    margin: 12,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  bannerText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "800" 
  },
  row: {
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    paddingHorizontal: 16, 
    paddingVertical: 16,
  },
  rowLabel: { 
    fontSize: 16, 
    color: "#111" 
  },
  sep: { 
    height: 1, 
    backgroundColor: "#eee" 
  },
});