// screens/SubGames/SingleDigitBulk.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import GameTypePicker from "../../components/games/GameTypePicker";

import DigitGrid from "../../components/games/DigitGrid";

// TODO later:
// import { useGameContext } from "../../contexts/GameContext";
// import { useWalletContext } from "../../contexts/WalletContext";
// import { GameService } from "../../services/GameService";

const DIGITS = ["1","2","3","4","5","6","7","8","9","0"];
const GREEN = "#3FA16C";

const SingleDigitBulk = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.name || 'GAME';

  // const { getGameState } = useGameContext();
  // const { balance } = useWalletContext();
  // const gameState = getGameState(gameId);
  // const allowedTypes = gameState.allowedTypes;
  // const balance = balanceFromContext;

  const allowedTypes = ["OPEN", "CLOSE"]; // temp
  const balance = 0;                       // temp

  const [selectedType, setSelectedType] = useState(
    allowedTypes[0] || "OPEN"
  );

  // points input at top
  const [pointInput, setPointInput] = useState("");

  // digit -> points map
  const [pointsByDigit, setPointsByDigit] = useState(() =>
    DIGITS.reduce((acc, d) => {
      acc[d] = "";
      return acc;
    }, {})
  );

  // derived totals
  const { bids, totalPoints } = useMemo(() => {
    let b = 0;
    let p = 0;
    DIGITS.forEach((d) => {
      const val = Number(pointsByDigit[d] || 0);
      if (val > 0) {
        b += 1;
        p += val;
      }
    });
    return { bids: b, totalPoints: p };
  }, [pointsByDigit]);

  const handlePressDigit = (digit) => {
    const pts = Number(pointInput);
    if (!pts || pts <= 0) {
      Alert.alert("Validation", "Enter valid points first.");
      return;
    }

    setPointsByDigit((prev) => ({
      ...prev,
      [digit]: pts.toString(),
    }));
  };

  const handleSubmit = async () => {
    if (bids === 0) {
      Alert.alert("No bets", "Please select at least one digit.");
      return;
    }

    if (totalPoints > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const bets = [];
    DIGITS.forEach((d) => {
      const val = Number(pointsByDigit[d] || 0);
      if (val > 0) {
        bets.push({
          digit: d,
          points: val,
          type: selectedType.toLowerCase(),
        });
      }
    });

    const payload = {
      gameId,
      subGame: "SINGLE_DIGIT_BULK",
      type: selectedType,
      bets,
    };

    try {
      // await GameService.submitSingleDigitBulk(payload);
      console.log("Submitting Single Ank payload:", payload);
      Alert.alert("Success", "Bets submitted (mock).");
      // optionally reset or navigate
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SINGLE DIGIT BULK`} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Select Game Type */}
            <GameTypePicker
              label="Select Game Type:"
              value={selectedType}
              options={allowedTypes}
              onChange={setSelectedType}
              containerStyle={{ marginBottom: 12 }}
            />

            {/* Enter Points */}
            <View style={styles.pointInputRow}>
                <Text style={styles.label}>Enter Points:</Text>
                <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={pointInput}
                onChangeText={setPointInput}
                placeholder="Point"
                placeholderTextColor="#999"
                />
            </View>

            {/* Digit grid */}
            <DigitGrid
              digits={DIGITS}
              pointsByDigit={pointsByDigit}
              onPressDigit={handlePressDigit}
            />
          </ScrollView>
        </View>

        {/* Bottom bar like in screenshot */}
        <BottomBetBar
          bids={bids}
          points={totalPoints}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default SingleDigitBulk;

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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  pointInputRow:{
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
  },
});