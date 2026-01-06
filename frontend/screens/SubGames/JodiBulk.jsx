import React, { useContext, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import GameTypePicker from "../../components/games/GameTypePicker";
import EasyModeTable from "../../components/games/EasyModeTable";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";

const GREEN = "#3FA16C";

const JodiBulk = ({ route }) => {
  const gameName = route?.params?.gameName || "GAME";

  const allowedTypes = ["OPEN", "CLOSE"]; // or from backend

  const { user } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || "OPEN");

  const [points, setPoints] = useState("");
  const [jodiDigit, setJodiDigit] = useState("");
  const [pointsError, setPointsError] = useState(false);

  // { id, digit, points, type }
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

  const addBet = (digitToUse) => {
    if (!digitToUse || digitToUse.length !== 2) return;

    if (!isPointsValid()) {
      setPointsError(true);
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      digit: digitToUse,
      points: Number(points),
      type: selectedType.toLowerCase(), // open/close
    };

    setBets((prev) => [...prev, newBet]);
    setJodiDigit(""); // reset only digit
    setPointsError(false); // clear error, keep points
  };

  const handleDigitChange = (text) => {
    const clean = text.replace(/[^0-9]/g, "").slice(0, 2);
    setJodiDigit(clean);

    if (clean.length === 2) {
      if (isPointsValid()) {
        addBet(clean);
      } else {
        setPointsError(true);
      }
    }
  };

  const handlePointsChange = (text) => {
    const clean = text.replace(/[^0-9]/g, "");
    setPoints(clean);
    if (pointsError && clean) {
      setPointsError(false);
    }
  };

  const handleAddPress = () => {
    if (!jodiDigit || jodiDigit.length !== 2) {
      // silently ignore; UX requirement was just visual cue for points
      return;
    }
    addBet(jodiDigit);
  };

  const handleDeleteBet = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (bids === 0) {
      Alert.alert("No bets", "Please add at least one Jodi.");
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
        type: "JODI_BULK",
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(),
        amount: Number(b.points) || 0,
        betValue: b.digit,
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert("Success", "Bets placed successfully!");
      setBets([]);
      setJodiDigit("");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to place bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - JODI BULK`} />

        <View style={styles.content}>
          {/* Game type selector like other screens */}
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

          {/* Jodi row */}
          <View style={styles.pointInputRow}>
            <Text style={styles.label}>Enter Jodi Digit:</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={jodiDigit}
              onChangeText={handleDigitChange}
              placeholder="Jodi"
              maxLength={2}
              placeholderTextColor="#999"
            />
          </View>

          {/* Add button aligned right */}
          <View style={styles.addButtonWrapper}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPress}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Table */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDeleteBet}
              digitHeaderLabel="Jodi"
            />
          </View>
        </View>

        {/* Bottom summary bar */}
        <BottomBetBar
          bids={bids}
          points={totalPoints}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default JodiBulk;

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
    marginBottom: 8,
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
    marginBottom: 4,
    textAlign: "center",
    writingDirection: "ltr",
  },
  errorInput: {
    borderColor: "#FF4D4F",
  },
  addButtonWrapper: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: GREEN,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
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