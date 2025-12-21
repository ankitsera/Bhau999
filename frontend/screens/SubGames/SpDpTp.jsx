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
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import BottomBetBar from "../../components/games/BottomBetBar";
import EasyModeTable from "../../components/games/EasyModeTable";

// maps
import { SINGLE_PANA_BY_RESULT_DIGIT } from "../../data/singlePanaMap";
import { DOUBLE_PANA_BY_RESULT_DIGIT } from "../../data/doublePanaMap";
import { TRIPLE_PANA_BY_RESULT_DIGIT } from "../../data/triplePanaMap";

const GREEN = "#3FA16C";

const SpDpTp = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.name || 'GAME';

  const allowedTypes = ["OPEN", "CLOSE"]; // later from backend
  const balance = 0; // later from wallet

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || "OPEN");

  const [spChecked, setSpChecked] = useState(false);
  const [dpChecked, setDpChecked] = useState(false);
  const [tpChecked, setTpChecked] = useState(false);

  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");

  // EasyModeTable expects: { id, digit, points, type }
  const [bets, setBets] = useState([]);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const getListForDigit = (dChar) => {
    const key = String(Number(dChar)); // normalize

    const list = [];

    if (spChecked) {
      const sp =
        SINGLE_PANA_BY_RESULT_DIGIT?.[key] ||
        SINGLE_PANA_BY_RESULT_DIGIT?.[Number(key)] ||
        [];
      list.push(...sp.map(String));
    }

    if (dpChecked) {
      const dp =
        DOUBLE_PANA_BY_RESULT_DIGIT?.[key] ||
        DOUBLE_PANA_BY_RESULT_DIGIT?.[Number(key)] ||
        [];
      list.push(...dp.map((x) => String(x)));
    }

    if (tpChecked) {
      const tp =
        TRIPLE_PANA_BY_RESULT_DIGIT?.[key] ||
        TRIPLE_PANA_BY_RESULT_DIGIT?.[Number(key)] ||
        [];
      list.push(...tp.map((x) => String(x)));
    }

    // unique + sorted
    const unique = Array.from(new Set(list));
    unique.sort((a, b) => Number(a) - Number(b));
    return unique;
  };

  const handleGenerate = () => {
    if (!spChecked && !dpChecked && !tpChecked) {
      Alert.alert("Alert", "Please Select Atleast one SP, DP, TP");
      return;
    }

    const d = digit.replace(/[^0-9]/g, "");
    if (d.length !== 1) {
      Alert.alert("Validation", "Please enter a single digit (0-9).");
      return;
    }

    const pts = Number(points);
    if (!pts || pts <= 0) {
      Alert.alert("Validation", "Please enter valid points.");
      return;
    }

    const panas = getListForDigit(d);

    setBets((prev) => {
      // keep unique by "digit" (which is actually pana here)
      const map = new Map(prev.map((b) => [b.digit, b]));

      panas.forEach((pana) => {
        map.set(pana, {
          id: `${pana}-${Date.now()}`,
          digit: pana,
          points: pts,
          type: selectedType.toLowerCase(),
        });
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => Number(a.digit) - Number(b.digit));
      return merged;
    });
  };

  const handleSubmit = async () => {
    if (totals.bids === 0) {
      Alert.alert("No bets", "Please generate at least one bet.");
      return;
    }

    if (totals.points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const payload = {
      gameId,
      subGame: "SP_DP_TP",
      type: selectedType,
      bets: bets.map((b) => ({
        pana: b.digit,
        points: Number(b.points),
        type: b.type,
      })),
      meta: { sp: spChecked, dp: dpChecked, tp: tpChecked },
    };

    try {
      console.log("Submitting SP/DP/TP payload:", payload);
      Alert.alert("Success", "Bets submitted (mock).");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SP DP TP`} />

        <View style={styles.content}>
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={allowedTypes}
            onChangeGameType={setSelectedType}
          />

          {/* SP/DP/TP row */}
          <View style={styles.checkRow}>
            <CheckItem
              label="SP"
              checked={spChecked}
              onToggle={() => setSpChecked((p) => !p)}
            />
            <CheckItem
              label="DP"
              checked={dpChecked}
              onToggle={() => setDpChecked((p) => !p)}
            />
            <CheckItem
              label="TP"
              checked={tpChecked}
              onToggle={() => setTpChecked((p) => !p)}
            />
          </View>

          {/* Digit */}
          <View style={styles.pointInputRow}>
            <Text style={styles.label}>Enter Digit:</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={setDigit}
              placeholder="Digit"
              placeholderTextColor="#999"
            />
          </View>

          {/* Points */}
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

          {/* Generate */}
          <View style={styles.generateWrap}>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <Text style={styles.generateText}>Genrate</Text>
            </TouchableOpacity>
          </View>

          {/* Table area (scrolls internally) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel="Pana"
            />
          </View>
        </View>

        <BottomBetBar
          bids={totals.bids}
          points={totals.points}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default SpDpTp;

/** ---------- Small UI ---------- */
const CheckItem = ({ label, checked, onToggle }) => {
  return (
    <View style={styles.checkItem}>
      <Text style={styles.checkLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.checkBox, checked && styles.checkBoxChecked]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        {checked ? <MaterialIcons name="check" size={18} color="#FFF" /> : null}
      </TouchableOpacity>
    </View>
  );
};

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F3F3" },
  screen: { flex: 1, backgroundColor: "#F3F3F3" },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  checkRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  checkItem: { alignItems: "center", width: 80 },
  checkLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    fontWeight: "600",
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkBoxChecked: {
    backgroundColor: "#0E2B1E",
    borderColor: "#0E2B1E",
  },

  pointInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
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
    textAlign: "center", // This centers the text and cursor
    color: "#000",       // Ensures entered text is visible
    paddingHorizontal: 0, // Removes internal padding that might push the cursor
  },

  generateWrap: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 6,
  },
  generateBtn: {
    width: 180,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  generateText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});