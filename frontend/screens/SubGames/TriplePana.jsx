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

import { ALL_TRIPLE_PANA } from "../../data/triplePanaMap";

const GREEN = "#3FA16C";

const TriplePana = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.name || 'GAME';

  const allowedTypes = ["OPEN", "CLOSE"]; // later from game timings
  const balance = 0; // later from wallet context

  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  const [selectedType, setSelectedType] = useState(allowedTypes[0] || "OPEN");

  // points keyed by pana (same shape SpecialModeGrid expects)
  const [pointsByPana, setPointsByPana] = useState(() =>
    ALL_TRIPLE_PANA.reduce((acc, p) => {
      acc[p] = "";
      return acc;
    }, {})
  );

  const totals = useMemo(() => {
    let bids = 0;
    let points = 0;

    ALL_TRIPLE_PANA.forEach((p) => {
      const val = Number(pointsByPana[p] || 0);
      if (val > 0) {
        bids += 1;
        points += val;
      }
    });

    return { bids, points };
  }, [pointsByPana]);

  const handleChangePoint = (pana, value) => {
    setPointsByPana((prev) => ({
      ...prev,
      [pana]: value,
    }));
  };

  const handleSubmit = async () => {
    if (totals.bids === 0) {
      Alert.alert("No bets", "Please enter points for at least one pana.");
      return;
    }

    if (totals.points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    const bets = [];
    ALL_TRIPLE_PANA.forEach((p) => {
      const pts = Number(pointsByPana[p] || 0);
      if (pts > 0) {
        bets.push({
          pana: p,
          points: pts,
          type: selectedType.toLowerCase(),
        });
      }
    });

    const payload = {
      gameId,
      subGame: "TRIPLE_PANA",
      mode: "SPECIAL",
      type: selectedType,
      bets,
    };

    try {
      // await GameService.submitTriplePana(payload);
      console.log("Submitting Triple Pana payload:", payload);
      Alert.alert("Success", "Bets submitted (mock).");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - TRIPLE PANA`} />

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
            digits={ALL_TRIPLE_PANA}
            pointsByDigit={pointsByPana}
            onChangePoint={handleChangePoint}
          />

          <View style={styles.submitWrap}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TriplePana;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  submitWrap: {
    marginTop: 18,
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});