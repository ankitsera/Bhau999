import React, { useContext, useMemo, useState } from "react";
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

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { isValidBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

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

  const { showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
  });

  // points keyed by jodi number
  const [pointsByJodi, setPointsByJodi] = useState(() =>
    RED_JODI_NUMBERS.reduce((acc, j) => {
      acc[j] = "";
      return acc;
    }, {})
  );
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

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
    if (!guard()) return;

    if (totals.bids === 0) {
      Alert.alert("No bets", "Please enter points for at least one Red Jodi.");
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

    const list = [];
    RED_JODI_NUMBERS.forEach((j) => {
      const p = Number(pointsByJodi[j] || 0);
      if (p > 0) {
        if (!isValidBetAmount(p, minAmount, maxAmount)) {
          Alert.alert('Invalid Bet Amount', `Bet amount must be between ₹${minAmount} and ₹${maxAmount}`);
          return;
        }
        list.push({ jodi: j, points: p });
      }
    });

    if (list.length === 0) {
      Alert.alert("No bets", "Please enter points for at least one Red Jodi.");
      return;
    }

    const betsToSend = list.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "Jodi",
        openClose: "CLOSE",
        amount: Number(b.points) || 0,
        betValue: b.jodi,
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert("Success", "Bets placed successfully!");

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      // clear points
      setPointsByJodi(
        RED_JODI_NUMBERS.reduce((acc, j) => {
          acc[j] = "";
          return acc;
        }, {})
      );
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

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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