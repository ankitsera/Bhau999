// screens/SubGames/SinglePanaBulk.jsx
import React, { useContext, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import GameTypePicker from "../../components/games/GameTypePicker";
import EasyModeTable from "../../components/games/EasyModeTable";

import { SINGLE_PANA_BY_RESULT_DIGIT } from "../../data/singlePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";

const GREEN = "#3FA16C";
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const SinglePanaBulk = ({ route }) => {
  const gameName = route?.params?.gameName || "GAME";

  const allowedTypes = ["OPEN", "CLOSE"]; // replace with backend data later

  const { user } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const [selectedType, setSelectedType] = useState(
    allowedTypes[0] || "OPEN"
  );

  const [points, setPoints] = useState("");
  const [pointsError, setPointsError] = useState(false);

  // { id, pana, points, type }
  const [bets, setBets] = useState([]);

  // totals for bottom bar
  const { bids, totalPoints } = useMemo(() => {
    const b = bets.length;
    const p = bets.reduce((sum, b) => sum + (Number(b.points) || 0), 0);
    return { bids: b, totalPoints: p };
  }, [bets]);

  const isPointsValid = () => {
    const val = Number(points);
    return !!val && val > 0;
  };

  const handlePointsChange = (text) => {
    const clean = text.replace(/[^0-9]/g, "");
    setPoints(clean);
    if (pointsError && clean) setPointsError(false);
  };

  const addBetsForDigit = (digitKey) => {
    if (!isPointsValid()) {
      setPointsError(true);
      return;
    }

    const panaList = SINGLE_PANA_BY_RESULT_DIGIT[digitKey] || [];
    if (panaList.length === 0) return;

    const pts = Number(points);
    const typeLower = selectedType.toLowerCase();

    const newBets = panaList.map((pana) => ({
      id: `${digitKey}-${pana}-${Date.now()}-${Math.random()}`,
      pana,
      points: pts,
      type: typeLower,
    }));

    setBets((prev) => [...prev, ...newBets]);
  };

  const handleDigitPress = (digit) => {
    addBetsForDigit(digit);
  };

  const handleDeleteBet = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (bids === 0) {
      Alert.alert("No bets", "Please add at least one bet.");
      return;
    }

    if (!mobileNumber) {
      Alert.alert("Login required", "Mobile number missing. Please login again.");
      return;
    }

    if (totalPoints > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "SINGLE_PANA",
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(), // OPEN/CLOSE
        amount: Number(b.points) || 0,
        betValue: String(b.pana),
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert("Success", "Bets placed successfully!");

      setBets([]);
      setPoints("");
      setPointsError(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to place bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SINGLE PANA BULK`} />

        <View style={styles.content}>
          {/* Game type dropdown */}
          <GameTypePicker
            label="Select Game Type:"
            value={selectedType}
            options={allowedTypes}
            onChange={setSelectedType}
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Points row */}
          <View style={styles.pointInputRow}>
            <Text style={styles.label}>Enter Points:</Text>
            <TextInput
              style={[
                styles.input,
                pointsError && styles.errorInput,
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={handlePointsChange}
              placeholder="Point"
              placeholderTextColor="#999"
            />
          </View>

          {/* Digit grid */}
          <View style={styles.grid}>
            {DIGITS.map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.digitTile}
                activeOpacity={0.85}
                onPress={() => handleDigitPress(d)}
              >
                <Text style={styles.digitText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Table of generated panas (scrolls internally) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets.map((b) => ({
                id: b.id,
                digit: String(b.pana),
                points: b.points,
                type: b.type,
              }))}
              onDelete={handleDeleteBet}
              digitHeaderLabel="Pana"
            />
          </View>
        </View>

        <BottomBetBar
          bids={bids}
          points={totalPoints}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default SinglePanaBulk;

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
    marginBottom: 12,
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
    writingDirection: "ltr",
    paddingHorizontal: 8,
  },
  errorInput: {
    borderColor: "#FF4D4F",
  },

  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  digitTile: {
    width: "18%", // 5 per row with gaps
    aspectRatio: 1.3,
    backgroundColor: GREEN,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  digitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});