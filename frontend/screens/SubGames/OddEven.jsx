import React, { useContext, useMemo, useState } from "react";
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
import EasyModeTable from "../../components/games/EasyModeTable";
import BottomBetBar from "../../components/games/BottomBetBar";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

const GREEN = "#3FA16C";

const ODD_DIGITS = ["1", "3", "5", "7", "9"];
const EVEN_DIGITS = ["0", "2", "4", "6", "8"];

const OddEven = ({ route }) => {
  const gameName = route?.params?.gameName || "GAME";

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [selectedType, setSelectedType] = useState("OPEN");  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);
  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
  });
  const [pick, setPick] = useState("ODD"); // "ODD" | "EVEN"
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

  const mergeUniqueBets = (prev, incoming) => {
    // uniqueness by digit + type
    const map = new Map();
    prev.forEach((b) => map.set(`${b.digit}-${b.type}`, b));
    incoming.forEach((b) => {
      const key = `${b.digit}-${b.type}`;
      if (!map.has(key)) map.set(key, b);
    });
    return Array.from(map.values());
  };

  const handleAdd = () => {
    Keyboard.dismiss();

    const pts = Number(points);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount)) {
      return;
    }

    const digits = pick === "ODD" ? ODD_DIGITS : EVEN_DIGITS;
    const typeLower = selectedType.toLowerCase();

    const newBets = digits.map((d) => ({
      id: `${Date.now()}-${d}-${typeLower}`,
      digit: d,
      points: pts,
      type: typeLower,
    }));

    setBets((prev) => mergeUniqueBets(prev, newBets));
  };

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    if (totals.bids === 0) {
      Alert.alert("No bets", "Please add at least one bet.");
      return;
    }

    if (!mobileNumber) {
      Alert.alert("Login required", "Mobile number missing. Please login again.");
      return;
    }

    if (totals.points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "Single Digit",
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(),
        amount: Number(b.points) || 0,
        betValue: b.digit,
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert("Success", "Bets placed successfully!");

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to place bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - ODD EVEN`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={pickerOptions}
            onChangeGameType={setSelectedType}
          />

          {/* Odd/Even picker */}
          <View style={styles.radioRow}>
            <RadioOption
              label="Odd Digit"
              active={pick === "ODD"}
              onPress={() => setPick("ODD")}
            />
            <RadioOption
              label="Even Digit"
              active={pick === "EVEN"}
              onPress={() => setPick("EVEN")}
            />
          </View>

          {/* Points */}
          <View style={styles.pointInputRow}>
            <Text style={styles.label}>Enter Points:</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={points}
              onChangeText={(t) => setPoints(String(t).replace(/[^0-9]/g, ""))}
              placeholder="Point"
              placeholderTextColor="#999"
            />
          </View>

          {/* Add */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>

          {/* Table */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel="Ank"
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

export default OddEven;

/* ---------------- small component ---------------- */

const RadioOption = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.radioOption}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.radioText}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ---------------- styles ---------------- */

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

  radioRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: "#111",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111",
  },
  radioText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
    writingDirection: "ltr",
    paddingHorizontal: 8,
  },

  addButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    width: 180,
    alignSelf: 'flex-end',
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