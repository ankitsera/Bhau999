import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import ThemeHeader from "../../components/ThemeHeader";
import { useTheme } from "../../contexts/ThemeContext";

const Row = ({ label, value, onChange }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.switchTrackOff, true: colors.primaryIconBg }}
        thumbColor={value ? colors.primary : colors.switchThumbOff}
      />
    </View>
  );
};

const Settings = ({ navigation }) => {
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title="Setting" />
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
        <View style={[styles.banner, { backgroundColor: colors.primary }]}>
          <Text style={styles.bannerText}>Notification Setting</Text>
        </View>

        <Row label="Game Notification:" value={game} onChange={setGame} />
        <View style={[styles.sep, { backgroundColor: colors.divider }]} />
        <Row label="Main Notification:" value={main} onChange={setMain} />
        {/* <View style={[styles.sep, { backgroundColor: colors.divider }]} />
        <Row label="Lucky Starline Notification" value={starline} onChange={setStarline} />
        <View style={[styles.sep, { backgroundColor: colors.divider }]} />
        <Row label="Lucky JackPot Notification" value={jackpot} onChange={setJackpot} /> */}
      </View>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    margin: 16,
    paddingBottom: 10,
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  banner: {
    margin: 12,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  bannerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
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
  },
  sep: {
    height: 1,
  },
});