import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import SpecialModeGrid from "../../components/games/SpecialModeGrid";

const GREEN = "#3FA16C";

// Order is IMPORTANT: even indexes render left column, odd indexes render right column
const RED_JODI_NUMBERS = [
  "00", "05",
  "11", "16",
  "22", "27",
  "33", "38",
  "44", "49",
  "50", "55",
  "61", "66",
  "72", "77",
  "83", "88",
  "94", "99",
];

const RedJodi = ({ route }) => {
  const gameId = route?.params?.gameId;
  const gameName = route?.params?.gameName || "GAME";

  const allowedTypes = ["OPEN", "CLOSE"]; // TODO: from backend/game timings
  const balance = Number.MAX_SAFE_INTEGER; // TODO: from wallet context

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || "OPEN");

  // points keyed by jodi number
  const [pointsByJodi, setPointsByJodi] = useState(() =>
    RED_JODI_NUMBERS.reduce((acc, j) => {
      acc[j] = "";
      return acc;
    }, {})
  );

  const totals = useMemo(() => {
    let bids = 0;
    let points = 0;

    RED_JODI_NUMBERS.forEach((j) => {
      const p = Number(pointsByJodi[j] || 0);
      if (p > 0) {
        bids += 1;
        points += p;
      }
    });

    return { bids, points };
  }, [pointsByJodi]);

  const handleChangePoint = (jodi, value) => {
    setPointsByJodi((prev) => ({
      ...prev,
      [jodi]: value,
    }));
  };

  const handleSubmit = async () => {
    if (totals.bids === 0) {
      Alert.alert("No bets", "Please enter points for at least one Red Jodi.");
      return;
    }

    if (totals.points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const bets = [];
    RED_JODI_NUMBERS.forEach((j) => {
      const p = Number(pointsByJodi[j] || 0);
      if (p > 0) {
        bets.push({
          jodi: j,
          points: p,
          type: selectedType.toLowerCase(),
        });
      }
    });

    const payload = {
      gameId,
      subGame: "RED_JODI",
      mode: "SPECIAL",
      type: selectedType,
      bets,
    };

    try {
      // await GameService.submitRedJodi(payload);
      console.log("Submitting Red Jodi payload:", payload);
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

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <GameDateTypeRow
              dateLabel={todayLabel}
              gameTypeValue={selectedType}
              gameTypeOptions={allowedTypes}
              onChangeGameType={setSelectedType}
            />

            <SpecialModeGrid
              digits={RED_JODI_NUMBERS}
              pointsByDigit={pointsByJodi}
              onChangePoint={handleChangePoint}
            />
          </ScrollView>
        </View>

        {/* Sticky bottom submit like screenshot */}
        <View style={styles.specialSubmitWrapper}>
            <TouchableOpacity
                style={styles.specialSubmitButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
            >
            <Text style={styles.specialSubmitText}>Submit</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RedJodi;

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
  specialSubmitWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  specialSubmitButton: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  specialSubmitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});