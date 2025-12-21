import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import BottomBetBar from "../../components/games/BottomBetBar";
import EasyModeTable from "../../components/games/EasyModeTable";

const GREEN = "#3FA16C";

const DIGIT_ROWS = [
  ["1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "0"],
];

const DigitBasedJodi = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.name || 'GAME';

  const allowedTypes = ["OPEN", "CLOSE"]; // later from context
  const balance = 0; // later from wallet context

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || "OPEN");
  const [points, setPoints] = useState("");
  const [bets, setBets] = useState([]); // { id, digit, points, type }

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const buildJodisForDigit = (d) =>
    Array.from({ length: 10 }, (_, i) => `${d}${i}`);

  const handlePressDigit = (d) => {
    const pts = Number(points);

    if (!points || Number.isNaN(pts) || pts <= 0) {
      Alert.alert("Validation", "Enter points first.");
      return;
    }

    const group = buildJodisForDigit(d);
    const typeLower = selectedType.toLowerCase();

    setBets((prev) => {
      // id = `${type}-${jodi}` ensures no duplicates
      const map = new Map(prev.map((b) => [b.id, b]));

      group.forEach((jodi) => {
        const id = `${typeLower}-${jodi}`;
        if (map.has(id)) {
          map.set(id, { ...map.get(id), points: pts });
        } else {
          map.set(id, {
            id,
            digit: jodi,
            points: pts,
            type: typeLower,
          });
        }
      });

      return Array.from(map.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return Number(a.digit) - Number(b.digit);
      });
    });
  };

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (totals.bids === 0) {
      Alert.alert("No bets", "Please add at least one digit group.");
      return;
    }

    if (totals.points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const payload = {
      gameId,
      subGame: "DIGIT_BASED_JODI",
      type: selectedType,
      bets: bets.map((b) => ({
        jodi: b.digit,
        points: b.points,
        type: b.type,
      })),
    };

    try {
      console.log("Submitting DigitBasedJodi payload:", payload);
      Alert.alert("Success", "Bets submitted (mock).");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - JODI`} />

        {/* MAIN CONTENT (no ScrollView) */}
        <View style={styles.content}>
          {/* Top controls (fixed) */}
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={allowedTypes}
            onChangeGameType={setSelectedType}
          />

          <View style={styles.pointRow}>
            <Text style={styles.label}>Enter Points:</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={points}
              onChangeText={setPoints}
              placeholder="Point"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.digitGrid}>
            {DIGIT_ROWS.map((row, idx) => (
              <View key={idx} style={styles.digitRow}>
                {row.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.digitBtn}
                    activeOpacity={0.85}
                    onPress={() => handlePressDigit(d)}
                  >
                    <Text style={styles.digitText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Table area (this must be flex:1 so its internal ScrollView can scroll) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel="Jodi"
            />
          </View>
        </View>

        {/* Bottom fixed bar */}
        <BottomBetBar
          bids={totals.bids}
          points={totals.points}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default DigitBasedJodi;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    fontSize: 16,
    textAlign: "center",
  },

  digitGrid: {
    marginTop: 14,
  },
  digitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  digitBtn: {
    flex: 1,
    height: 56,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  digitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10, // small breathing space above bottom bar
  },
});