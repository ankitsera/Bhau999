// screens/SubGames/TwoDigitPana.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import BottomBetBar from "../../components/games/BottomBetBar";
import EasyModeTable from "../../components/games/EasyModeTable";

// Maps
import { ALL_SINGLE_PANA } from "../../data/singlePanaMap";
import { ALL_DOUBLE_PANA } from "../../data/doublePanaMap";
import { ALL_TRIPLE_PANA } from "../../data/triplePanaMap";

const GREEN = "#3FA16C";

// 00..99 suggestions by first digit: "3" -> ["30".."39"]
const FIRST_DIGIT_MAP = Array.from({ length: 10 }, (_, d) => {
  const values = Array.from({ length: 10 }, (_, i) => `${d}${i}`);
  return [String(d), values];
}).reduce((acc, [k, v]) => {
  acc[k] = v;
  return acc;
}, {});

// Combine all pana once (unique + sorted)
const ALL_PANA = Array.from(
  new Set([...(ALL_SINGLE_PANA || []), ...(ALL_DOUBLE_PANA || []), ...(ALL_TRIPLE_PANA || [])])
).sort((a, b) => Number(a) - Number(b));

function buildDigitCount(str) {
  const c = {};
  for (const ch of String(str)) {
    c[ch] = (c[ch] || 0) + 1;
  }
  return c;
}

function satisfiesCounts(pana, requiredCounts) {
  const have = buildDigitCount(pana);
  for (const k of Object.keys(requiredCounts)) {
    if ((have[k] || 0) < requiredCounts[k]) return false;
  }
  return true;
}

function getPanasForTwoDigit(twoDigit) {
  const clean = String(twoDigit || "").replace(/[^0-9]/g, "");
  if (clean.length !== 2) return [];

  const req = buildDigitCount(clean);
  return ALL_PANA.filter((p) => satisfiesCounts(p, req));
}

const TwoDigitPana = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.gameName || 'GAME';

  const allowedTypes = ["OPEN", "CLOSE"]; // later from game state/timing
  const balance = 0; // later from wallet context

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || "OPEN");
  const [digit, setDigit] = useState(""); // 2-digit input
  const [points, setPoints] = useState("");
  const [bets, setBets] = useState([]); // { id, digit(pana), points, type }

  const totals = useMemo(() => {
    const bids = bets.length;
    const pts = bets.reduce((sum, b) => sum + (Number(b.points) || 0), 0);
    return { bids, points: pts };
  }, [bets]);

  // suggestions only when user typed exactly 1 digit
  const suggestions = useMemo(() => {
    const clean = String(digit || "").replace(/[^0-9]/g, "");
    if (clean.length !== 1) return [];
    return FIRST_DIGIT_MAP[clean] || [];
  }, [digit]);

  const handleAdd = () => {
    Keyboard.dismiss();

    const cleanDigit = String(digit || "").replace(/[^0-9]/g, "");
    if (cleanDigit.length !== 2) {
      Alert.alert("Validation", "Please enter a valid 2-digit number.");
      return;
    }

    const pts = Number(points);
    if (!pts || pts <= 0) {
      Alert.alert("Validation", "Please enter a valid point amount.");
      return;
    }

    const panas = getPanasForTwoDigit(cleanDigit);

    if (panas.length === 0) {
      Alert.alert("No results", "No pana found for this 2-digit input.");
      return;
    }

    const typeLower = selectedType.toLowerCase();

    setBets((prev) => {
      const map = new Map(prev.map((b) => [b.id, b]));

      panas.forEach((p) => {
        const id = `${p}-${typeLower}`;
        map.set(id, {
          id,
          digit: p,
          points: pts,
          type: typeLower,
        });
      });

      return Array.from(map.values()).sort((a, b) => Number(a.digit) - Number(b.digit));
    });

    setDigit("");
  };

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (totals.bids === 0) {
      Alert.alert("No bets", "Please add at least one bet.");
      return;
    }

    if (totals.points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const payload = {
      gameId,
      subGame: "TWO_DIGIT_PANA",
      type: selectedType,
      bets: bets.map((b) => ({
        pana: b.digit,
        points: Number(b.points) || 0,
        type: b.type,
      })),
    };

    try {
      console.log("Submitting Two Digit Pana payload:", payload);
      Alert.alert("Success", "Bets submitted (mock).");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - TWO DIGIT`} />

        <View style={styles.content}>
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={allowedTypes}
            onChangeGameType={setSelectedType}
          />

          {/* Digit row (with dropdown suggestions) */}
          <View style={styles.pointInputRow}>
            <Text style={styles.label}>Enter Digit:</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                maxLength={2}
                value={digit}
                onChangeText={setDigit}
                placeholder="Digit"
                placeholderTextColor="#999"
              />

              {suggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {/* Keep this scroll; it's not a VirtualizedList, so it's fine */}
                  <View>
                    {suggestions.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.suggestionItem}
                        onPress={() => setDigit(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Points row */}
          <View style={styles.pointInputRow}>
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

          {/* Add button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>

          {/* Table area (scrolls internally) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel="Pana"
            />
          </View>
        </View>

        <BottomBetBar bids={totals.bids} points={totals.points} onSubmit={handleSubmit} />
      </View>
    </SafeAreaView>
  );
};

export default TwoDigitPana;

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

  pointInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },

  inputWrapper: {
    width: 180,
    position: "relative",
  },
  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },

  suggestionBox: {
    position: "absolute",
    top: 44 + 2,
    left: 0,
    right: 0,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    maxHeight: 160,
    zIndex: 999,
    elevation: 8,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },

  addButton: {
    marginTop: 6,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    width: 180,
  },
  addText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});