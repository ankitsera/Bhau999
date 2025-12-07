import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import GameTypePicker from "../../components/games/GameTypePicker";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";

import JodiEasyForm from "../../components/games/jodi/JodiEasyForm";
import EasyModeTable from "../../components/games/EasyModeTable";
import SpecialModeGrid from "../../components/games/SpecialModeGrid";

// TODO: later hook contexts
// import { useGameContext } from "../../contexts/GameContext";
// import { useWalletContext } from "../../contexts/WalletContext";
// import { GameService } from "../../services/GameService";

const GREEN = "#3FA16C";
const BLACK = "#000";

// 00..99 once
const JODI_NUMBERS = Array.from({ length: 100 }, (_, i) =>
  i.toString().padStart(2, "0")
);

const Jodi = ({ route }) => {
  const gameId = route?.params?.gameId;
  const gameName = route?.params?.gameName || "GAME";

  // const { getGameState } = useGameContext();
  // const { balance } = useWalletContext();
  // const gameState = getGameState(gameId);
  // const allowedTypes = gameState.allowedTypes;
  // const balance = balanceFromContext;

  const allowedTypes = ["OPEN", "CLOSE"]; // temp
  const balance = 0; // temp

  const [mode, setMode] = useState("EASY"); // EASY | SPECIAL
  const [selectedType, setSelectedType] = useState(
    allowedTypes[0] || "OPEN"
  );

  // easy mode state
  const [jodiDigit, setJodiDigit] = useState("");
  const [easyPoints, setEasyPoints] = useState("");
  const [easyBets, setEasyBets] = useState([]); // {id, digit, points, type}

  // special mode state
  const [specialPointsByJodi, setSpecialPointsByJodi] = useState(() =>
    JODI_NUMBERS.reduce((acc, n) => {
      acc[n] = "";
      return acc;
    }, {})
  );

  // today label for special mode
  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  // totals
  const easyTotals = useMemo(() => {
    const bids = easyBets.length;
    const points = easyBets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0
    );
    return { bids, points };
  }, [easyBets]);

  const specialTotals = useMemo(() => {
    let bids = 0;
    let points = 0;
    JODI_NUMBERS.forEach((n) => {
      const p = Number(specialPointsByJodi[n] || 0);
      if (p > 0) {
        bids += 1;
        points += p;
      }
    });
    return { bids, points };
  }, [specialPointsByJodi]);

  const activeTotals = mode === "EASY" ? easyTotals : specialTotals;

  // handlers

  const handleAddEasyBet = () => {
    if (!jodiDigit || jodiDigit.length !== 2) {
      Alert.alert("Validation", "Please enter a valid 2-digit Jodi.");
      return;
    }

    const pts = Number(easyPoints);
    if (!pts || pts <= 0) {
      Alert.alert("Validation", "Please enter a valid point amount.");
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      digit: jodiDigit,
      points: pts,
      type: selectedType.toLowerCase(),
    };

    setEasyBets((prev) => [...prev, newBet]);
    setJodiDigit("");
    setEasyPoints("");
  };

  const handleDeleteEasyBet = (id) => {
    setEasyBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleChangeSpecialPoint = (jodi, value) => {
    setSpecialPointsByJodi((prev) => ({
      ...prev,
      [jodi]: value,
    }));
  };

  const handleSubmit = async () => {
    const { bids, points } = activeTotals;

    if (bids === 0) {
      Alert.alert("No bets", "Please add at least one bet.");
      return;
    }

    if (points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    let payload;

    if (mode === "EASY") {
      payload = {
        gameId,
        subGame: "SINGLE_PANA",
        mode: "EASY",
        type: selectedType,
        bets: easyBets.map((b) => ({
          jodi: b.digit,
          points: b.points,
          type: b.type,
        })),
      };
    } else {
      const bets = [];
      JODI_NUMBERS.forEach((n) => {
        const p = Number(specialPointsByJodi[n] || 0);
        if (p > 0) {
          bets.push({
            jodi: n,
            points: p,
            type: selectedType.toLowerCase(),
          });
        }
      });

      payload = {
        gameId,
        subGame: "SINGLE_PANA",
        mode: "SPECIAL",
        type: selectedType,
        bets,
      };
    }

    try {
      // await GameService.submitSinglePana(payload);
      console.log("Submitting Single Pana payload:", payload);
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
            {/* mode toggle */}
            <View style={styles.modeRow}>
              <ModeButton
                label="EASY MODE"
                active={mode === "EASY"}
                onPress={() => setMode("EASY")}
              />
              <ModeButton
                label="SPECIAL MODE"
                active={mode === "SPECIAL"}
                onPress={() => setMode("SPECIAL")}
              />
            </View>

            {mode === "EASY" && (
              <>
                <GameTypePicker
                  label="Select Game Type:"
                  value={selectedType}
                  options={allowedTypes}
                  onChange={setSelectedType}
                  containerStyle={{ marginBottom: 12 }}
                />

                <JodiEasyForm
                  jodi={jodiDigit}
                  onChangeJodi={setJodiDigit}
                  points={easyPoints}
                  onChangePoints={setEasyPoints}
                  onPressAdd={handleAddEasyBet}
                />

                <EasyModeTable
                  bets={easyBets}
                  onDelete={handleDeleteEasyBet}
                  digitHeaderLabel="Jodi"
                />
              </>
            )}

            {mode === "SPECIAL" && (
              <>
                <GameDateTypeRow
                  dateLabel={todayLabel}
                  gameTypeValue={selectedType}
                  gameTypeOptions={allowedTypes}
                  onChangeGameType={setSelectedType}
                />

                <SpecialModeGrid
                  digits={JODI_NUMBERS}
                  pointsByDigit={specialPointsByJodi}
                  onChangePoint={handleChangeSpecialPoint}
                />
              </>
            )}
          </ScrollView>
        </View>

        {/* bottom bar only in easy mode */}
        {mode === "EASY" ? (
          <BottomBetBar
            bids={activeTotals.bids}
            points={activeTotals.points}
            onSubmit={handleSubmit}
          />
        ) : (
          // special mode: full-width submit button like screenshot 3
          <View style={styles.specialBottom}>
            <TouchableOpacity
              style={styles.specialSubmitButton}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.specialSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Jodi;

const ModeButton = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[
      modeStyles.button,
      { backgroundColor: active ? BLACK : GREEN },
    ]}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <Text style={modeStyles.text}>{label}</Text>
  </TouchableOpacity>
);

const modeStyles = StyleSheet.create({
  button: {
    flex: 1,
    height: 46,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

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
  modeRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  specialBottom: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 16,
  },
  specialSubmitButton: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    alignSelf: "stretch",
  },
  specialSubmitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});