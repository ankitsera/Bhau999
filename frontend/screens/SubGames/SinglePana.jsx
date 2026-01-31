import React, { useMemo, useState, useContext } from "react"; // ✅ CHANGED (added useContext)
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";

import GameTypePicker from "../../components/games/GameTypePicker";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";

import EasyModeTable from "../../components/games/EasyModeTable";
import SpecialModeGrid from "../../components/games/SpecialModeGrid";

import {
  ALL_SINGLE_PANA,
  SINGLE_PANA_BY_RESULT_DIGIT,
  getSinglePanaSuggestions,
} from "../../data/singlePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

const GREEN = "#3FA16C";
const BLACK = "#000";

const GROUP_KEYS = Object.keys(SINGLE_PANA_BY_RESULT_DIGIT); // "0".."9"

const SinglePana = ({ route }) => {
  const gameName = route?.params?.gameName || 'GAME';

  const { user, updateUser } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber; 
  const balance = Number(user?.balance || 0);

  // today's date label (static style dd-mm-yyyy)
  const todayLabel = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  // -------- STATE --------
  const [mode, setMode] = useState("EASY"); // "EASY" | "SPECIAL"
  const [selectedType, setSelectedType] = useState("OPEN");
  const [minAmount, setMinAmount] = useState(10);
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

  // Easy mode
  const [easyPana, setEasyPana] = useState("");
  const [easyPoints, setEasyPoints] = useState("");
  const [easyBets, setEasyBets] = useState([]); // { id, pana, points, type }

  // Special mode (points per pana)
  const [specialPointsByPana, setSpecialPointsByPana] = useState(() =>
    ALL_SINGLE_PANA.reduce((acc, p) => {
      acc[p] = "";
      return acc;
    }, {})
  );

  // -------- DERIVED TOTALS --------
  const easyTotals = useMemo(() => {
    const bids = easyBets.length;
    const points = easyBets.reduce((sum, b) => sum + (Number(b.points) || 0), 0);
    return { bids, points };
  }, [easyBets]);

  const specialTotals = useMemo(() => {
    let bids = 0;
    let points = 0;
    ALL_SINGLE_PANA.forEach((pana) => {
      const p = Number(specialPointsByPana[pana] || 0);
      if (p > 0) {
        bids += 1;
        points += p;
      }
    });
    return { bids, points };
  }, [specialPointsByPana]);

  const activeTotals = mode === "EASY" ? easyTotals : specialTotals;

  // -------- HANDLERS --------
  const handleAddEasyBet = () => {
    if (!easyPana || easyPana.trim() === "") {
      Alert.alert("Validation", "Please enter a pana.");
      return;
    }

    const clean = easyPana.replace(/[^0-9]/g, "");
    if (clean.length !== 3) {
      Alert.alert("Validation", "Pana must be a 3-digit number.");
      return;
    }

    const pts = Number(easyPoints);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount)) {
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      pana: clean,
      points: pts,
      type: selectedType.toLowerCase(), // "open"/"close"
    };

    setEasyBets((prev) => [...prev, newBet]);
    setEasyPana("");
    setEasyPoints("");
  };

  const handleDeleteEasyBet = (id) => {
    setEasyBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleChangeSpecialPoint = (pana, value) => {
    setSpecialPointsByPana((prev) => ({
      ...prev,
      [pana]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    const { bids, points } = activeTotals;

    if (bids === 0) {
      Alert.alert("No bets", "Please add at least one bet.");
      return;
    }

    // ✅ NEW: basic auth validation
    if (!mobileNumber) {
      Alert.alert("Login required", "Mobile number not found. Please login again.");
      return;
    }

    // ✅ CHANGED: don’t block when balance is still temp=0
    if (Number.isFinite(balance) && balance > 0 && points > balance) {
      Alert.alert("Insufficient balance", "Your wallet balance is too low.");
      return;
    }

    // ✅ NEW: build API payload (array), per backend controller
    // backend expects: [{ mobileNumber, gameName, type, open_close, amount, betValue }]
    let betsToSend = [];

    if (mode === "EASY") {
      betsToSend = easyBets.map((b) =>
        makeBet({
          mobileNumber,
          gameName,
          type: "Single Pana",
          openClose: String(b.type || "").toUpperCase(), // ✅ NEW: open_close per row
          amount: Number(b.points) || 0, // ✅ CHANGED: amount instead of points
          betValue: b.pana, // ✅ NEW: betValue
        })
      );
    } else {
      const list = [];
      ALL_SINGLE_PANA.forEach((pana) => {
        const p = Number(specialPointsByPana[pana] || 0);
        if (p > 0) {
          list.push(
            makeBet({
              mobileNumber,
              gameName,
              type: "Single Pana",
              openClose: selectedType,
              amount: p,
              betValue: pana,
            })
          );
        }
      });
      betsToSend = list;
    }

    try {
      // API call
      const res = await placeBets(betsToSend);
      Alert.alert("Success", "Bets placed successfully!");

      // Update balance safely
      const spent = Number(activeTotals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      // optional small reset (kept minimal)
      if (mode === "EASY") {
        setEasyBets([]);
      } else {
        setSpecialPointsByPana((prev) => {
          const next = { ...prev };
          ALL_SINGLE_PANA.forEach((p) => (next[p] = ""));
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err?.message || "Failed to place bets.");
    }
  };

  // -------- RENDER --------
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - SINGLE PANA`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        {/* MAIN CONTENT */}
        <View style={styles.content}>
          {/* Mode toggle */}
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

          {/* EASY MODE: label + dropdown */}
          {mode === "EASY" && (
            <GameTypePicker
              label="Select Game Type:"
              value={selectedType}
              options={pickerOptions}
              onChange={setSelectedType}
              containerStyle={{ marginBottom: 12 }}
            />
          )}

          {/* SPECIAL MODE: date + dropdown row */}
          {mode === "SPECIAL" && (
            <GameDateTypeRow
              dateLabel={todayLabel}
              gameTypeValue={selectedType}
              gameTypeOptions={pickerOptions}
              onChangeGameType={setSelectedType}
            />
          )}

          {mode === "EASY" ? (
            <>
              <SinglePanaEasyForm
                pana={easyPana}
                onChangePana={setEasyPana}
                points={easyPoints}
                onChangePoints={setEasyPoints}
                onPressAdd={handleAddEasyBet}
              />

              <View style={styles.tableArea}>
                <EasyModeTable
                  bets={easyBets.map((b) => ({
                    id: b.id,
                    digit: b.pana,
                    points: b.points,
                    type: b.type,
                  }))}
                  onDelete={handleDeleteEasyBet}
                  digitHeaderLabel="Pana"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.specialArea}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  contentContainerStyle={styles.specialScrollContent}
                >
                  {/* GROUPED SPECIAL MODE GRID */}
                  <View style={styles.groupsWrapper}>
                    {GROUP_KEYS.map((key) => {
                      const panas = SINGLE_PANA_BY_RESULT_DIGIT[key];
                      return (
                        <View key={key} style={styles.groupSection}>
                          <View style={styles.groupHeaderPill}>
                            <Text style={styles.groupHeaderText}>{key}</Text>
                          </View>

                          <SpecialModeGrid
                            digits={panas}
                            pointsByDigit={specialPointsByPana}
                            onChangePoint={handleChangeSpecialPoint}
                          />
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.specialSubmitWrapper}>
                    <TouchableOpacity
                      style={styles.specialSubmitButton}
                      onPress={handleSubmit}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.specialSubmitText}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </View>

        {/* Bottom bar ONLY for Easy mode */}
        {mode === "EASY" && (
          <BottomBetBar
            bids={activeTotals.bids}
            points={activeTotals.points}
            onSubmit={handleSubmit}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default SinglePana;

// ---------- inline Easy Form (with pana suggestions) ----------

const SinglePanaEasyForm = ({
  pana,
  onChangePana,
  points,
  onChangePoints,
  onPressAdd,
}) => {
  const suggestions = useMemo(
    () => getSinglePanaSuggestions(pana),
    [pana]
  );

  return (
    <View style={formStyles.container}>
      {/* Enter Single Pana row */}
      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Single Pana:</Text>

        <View style={formStyles.inputWrapper}>
          <TextInput
            style={formStyles.input}
            keyboardType="number-pad"
            maxLength={3}
            value={pana}
            onChangeText={onChangePana}
            placeholder="Pana"
            placeholderTextColor="#999"
          />

          {suggestions.length > 0 && pana.length > 0 && pana.length < 3 && (
            <View style={formStyles.dropdown}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {suggestions.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={formStyles.item}
                    onPress={() => onChangePana(val)}
                  >
                    <Text style={formStyles.itemText}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Points row */}
      <View style={formStyles.pointInputRow}>
        <Text style={formStyles.label}>Enter Points:</Text>
        <TextInput
          style={formStyles.input}
          keyboardType="number-pad"
          value={points}
          onChangeText={onChangePoints}
          placeholder="Point"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={formStyles.addButton}
        onPress={onPressAdd}
        activeOpacity={0.85}
      >
        <Text style={formStyles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------- small UI components ----------

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

// ---------- styles ----------

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

  modeRow: {
    flexDirection: "row",
    marginBottom: 16,
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },

  specialArea: {
    flex: 1,
  },
  specialScrollContent: {
    paddingBottom: 12,
  },

  groupsWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  groupSection: {
    marginBottom: 18,
  },
  groupHeaderPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#002010",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  groupHeaderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  specialSubmitWrapper: {
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

const formStyles = StyleSheet.create({
  container: {
    marginTop: 12,
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
    writingDirection: 'ltr',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dropdown: {
    position: "absolute",
    top: 44 + 4,
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    maxHeight: 180,
    zIndex: 10,
    elevation: 5,
    overflow: "hidden",
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 14,
    color: "#333",
  },
  addButton: {
    marginTop: 4,
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
});