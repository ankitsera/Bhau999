import React, { useMemo, useState, useContext } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import BottomBetBar from "../../components/games/BottomBetBar";
import EasyModeTable from "../../components/games/EasyModeTable";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";

const GREEN = "#3FA16C";

const DIGIT_ROWS = [
  ["1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "0"],
];

const DigitBasedJodi = ({ route }) => {
  const gameName = route?.params?.gameName || "GAME";

  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
    onClosed: () => navigation.goBack(),
  });

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

  const [selectedType, setSelectedType] = useState('OPEN');
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

  const buildJodisForDigit = (d) =>
    Array.from({ length: 10 }, (_, i) => `${d}${i}`);

  const handlePressDigit = (d) => {
    const pts = Number(points);

    if (!points || Number.isNaN(pts) || pts <= 0) {
      Alert.alert("Validation", "Enter points first.");
      return;
    }

    const group = buildJodisForDigit(d);
    const typeLower = selectedType.toLowerCase();

    setBets((prev) => {
      const map = new Map(prev.map((b) => [b.id, b]));

      group.forEach((jodi) => {
        const id = `${typeLower}-${jodi}`;
        if (map.has(id)) {
          map.set(id, { ...map.get(id), points: pts });
        } else {
          map.set(id, {
            id,
            digit: jodi,
            points: pts,
            type: typeLower,
          });
        }
      });

      return Array.from(map.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return Number(a.digit) - Number(b.digit);
      });
    });
  };

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    if (totals.bids === 0) {
      Alert.alert("No bets", "Please add at least one digit group.");
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

    // ✅ NEW: backend bet array
    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: 'Jodi',
        openClose: String(b.type).toUpperCase(),
        amount: Number(b.points) || 0,
        betValue: b.digit,
      })
    );

    try {
      const res = await placeBets(betsToSend); //API call
      Alert.alert("Success", "Bets placed successfully!");

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      // minimal reset
      setBets([]);
      // keep points (optional UX), but you can clear if you want:
      setPoints("");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to place bets.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - JODI`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        {/* MAIN CONTENT (no ScrollView) */}
        <View style={styles.content}>
          {/* Top controls (fixed) */}
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={pickerOptions}
            onChangeGameType={setSelectedType}
          />

          <View style={styles.pointRow}>
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

          <View style={styles.digitGrid}>
            {DIGIT_ROWS.map((row, idx) => (
              <View key={idx} style={styles.digitRow}>
                {row.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.digitBtn}
                    activeOpacity={0.85}
                    onPress={() => handlePressDigit(d)}
                  >
                    <Text style={styles.digitText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Table area (this must be flex:1 so its internal ScrollView can scroll) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel="Jodi"
            />
          </View>
        </View>

        {/* Bottom fixed bar */}
        <BottomBetBar
          bids={totals.bids}
          points={totals.points}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default DigitBasedJodi;

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

  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
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
  },

  digitGrid: {
    marginTop: 14,
  },
  digitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  digitBtn: {
    flex: 1,
    height: 56,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  digitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10, // small breathing space above bottom bar
  },
});