import React, { useMemo, useState, useContext } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import { getSinglePanaSuggestions } from "../../data/singlePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";

const GREEN = "#3FA16C";

const normalizePana = (v) =>
  String(v || "")
    .replace(/[^0-9]/g, "")
    .slice(0, 3);

const isValidPana = (p) => /^\d{3}$/.test(p);

const FullSangam = ({ route }) => {
  const gameName = route?.params?.gameName || "GAME";

  const { user } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const [openPana, setOpenPana] = useState("");
  const [closePana, setClosePana] = useState("");
  const [points, setPoints] = useState("");

  const [focusedField, setFocusedField] = useState(null); // "OPEN" | "CLOSE" | null
  const [bets, setBets] = useState([]); // { id, sangam, points }

  const openSuggestions = useMemo(() => {
    const list = getSinglePanaSuggestions(openPana) || [];
    return list.slice(0, 30);
  }, [openPana]);

  const closeSuggestions = useMemo(() => {
    const list = getSinglePanaSuggestions(closePana) || [];
    return list.slice(0, 30);
  }, [closePana]);

  const totalPoints = useMemo(
    () => bets.reduce((sum, b) => sum + (Number(b.points) || 0), 0),
    [bets]
  );

  const handlePickSuggestion = (type, value) => {
    if (type === "OPEN") setOpenPana(value);
    else setClosePana(value);

    setFocusedField(null);
    Keyboard.dismiss();
  };

  const handleAdd = () => {
    Keyboard.dismiss();

    const op = normalizePana(openPana);
    const cp = normalizePana(closePana);

    if (!isValidPana(op)) {
      Alert.alert("Validation", "Enter a valid 3-digit Open Pana.");
      return;
    }
    if (!isValidPana(cp)) {
      Alert.alert("Validation", "Enter a valid 3-digit Close Pana.");
      return;
    }

    // ✅ ensure they are valid pana from your predefined list
    const opValid = (getSinglePanaSuggestions(op[0]) || []).includes(op);
    const cpValid = (getSinglePanaSuggestions(cp[0]) || []).includes(cp);

    if (!opValid || !cpValid) {
      Alert.alert("Validation", "Please select valid Pana from suggestions.");
      return;
    }

    const pts = Number(points);
    if (!pts || pts <= 0) {
      Alert.alert("Validation", "Enter a valid point amount.");
      return;
    }

    const sangam = `${op}-${cp}`;
    const newBet = {
      id: sangam, // stable id => prevents duplicates (same pair)
      sangam,
      points: pts,
    };

    setBets((prev) => {
      const map = new Map(prev.map((b) => [b.id, b]));
      map.set(newBet.id, newBet); // overwrite => update points if exists
      return Array.from(map.values());
    });

    // reset fields (points reset like your screenshot style)
    setOpenPana("");
    setClosePana("");
    setPoints("");
    setFocusedField(null);
  };

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (bets.length === 0) {
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

    // Full Sangam is inherently a "close" style bet (it includes close pana).
    const openClose = "CLOSE";

    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "FULL_SANGAM",
        openClose,
        amount: Number(b.points) || 0,
        betValue: b.sangam, // "open-close"
      })
    );

    try {
      const res = await placeBets(betsToSend);
      console.log("Submitting Full Sangam bets:", res);
      Alert.alert("Success", "Bets placed successfully!");
      setBets([]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to place bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - FULL SANGAM`} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* OPEN PANA */}
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Open Pana:</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={openPana}
                  onChangeText={(t) => setOpenPana(normalizePana(t))}
                  placeholder="Pana"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedField("OPEN")}
                  onBlur={() => setTimeout(() => setFocusedField(null), 120)}
                />

                {focusedField === "OPEN" && openSuggestions.length > 0 && (
                  <SuggestionBox
                    items={openSuggestions}
                    onPick={(v) => handlePickSuggestion("OPEN", v)}
                  />
                )}
              </View>
            </View>

            {/* CLOSE PANA */}
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Close Pana:</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={closePana}
                  onChangeText={(t) => setClosePana(normalizePana(t))}
                  placeholder="Pana"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedField("CLOSE")}
                  onBlur={() => setTimeout(() => setFocusedField(null), 120)}
                />

                {focusedField === "CLOSE" && closeSuggestions.length > 0 && (
                  <SuggestionBox
                    items={closeSuggestions}
                    onPick={(v) => handlePickSuggestion("CLOSE", v)}
                  />
                )}
              </View>
            </View>

            {/* POINTS */}
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Points:</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={points}
                onChangeText={(t) =>
                  setPoints(String(t).replace(/[^0-9]/g, ""))
                }
                placeholder="Point"
                placeholderTextColor="#999"
              />
            </View>

            {/* ADD */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>

            {/* TABLE HEADER */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.4 }]}>Sangam</Text>
              <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
              <Text style={[styles.th, { width: 70, textAlign: "center" }]}>
                Delete
              </Text>
            </View>

            {/* ROWS */}
            {bets.map((b) => (
              <View key={b.id} style={styles.rowCard}>
                <Text style={[styles.cell, { flex: 1.4 }]}>{b.sangam}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: "center" }]}>
                  {b.points}
                </Text>

                <TouchableOpacity
                  style={styles.deleteCircle}
                  onPress={() => handleDelete(b.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* spacer for sticky submit */}
            <View style={{ height: 90 }} />
          </ScrollView>
        </View>

        {/* STICKY SUBMIT */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FullSangam;

/* ----------------------- small component ----------------------- */

const SuggestionBox = ({ items, onPick }) => {
  return (
    <View style={styles.suggestionBox}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.suggestionItem}
            activeOpacity={0.8}
            onPress={() => onPick(item)}
          >
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

/* ---------------------------- styles --------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F3F3" },
  screen: { flex: 1, backgroundColor: "#F3F3F3" },
  content: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
    writingDirection: "ltr",
    paddingHorizontal: 8,
  },

  suggestionBox: {
    position: "absolute",
    top: 44 + 4,
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    maxHeight: 160,
    zIndex: 50,
    elevation: 8,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
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
    fontWeight: "700" 
  },

  tableHeader: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 6,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  th: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  rowCard: {
    marginTop: 12,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  cell: {
    fontSize: 18,
    color: "#222",
  },

  deleteCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  bottomBar: {
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#D9D9D9",
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  submitBtn: {
    backgroundColor: GREEN,
    borderRadius: 6,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});