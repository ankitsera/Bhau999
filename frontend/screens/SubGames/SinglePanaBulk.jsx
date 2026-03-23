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
import { useTranslation } from 'react-i18next';

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import GameTypePicker from "../../components/games/GameTypePicker";
import EasyModeTable from "../../components/games/EasyModeTable";

import { SINGLE_PANA_BY_RESULT_DIGIT } from "../../data/singlePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

import { useTheme } from "../../contexts/ThemeContext";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const SinglePanaBulk = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || t('games:singlePanaBulk.title');

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const [selectedType, setSelectedType] = useState("OPEN");

  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
  });

  const [points, setPoints] = useState("");
  const [pointsError, setPointsError] = useState(false);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

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
    const pts = Number(points);
    if (!pts || pts <= minAmount - 1 || pts > maxAmount) {
      setPointsError(true);
      return;
    }
    setPointsError(false);

    const panaList = SINGLE_PANA_BY_RESULT_DIGIT[digitKey] || [];
    if (panaList.length === 0) return;

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
    if (!guard()) return;

    if (bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseAddBet'));
      return;
    }

    if (!mobileNumber) {
      Alert.alert(t('validation:loginRequired'), t('validation:mobileNumberMissing'));
      return;
    }

    if (totalPoints > balance) {
      Alert.alert(t('validation:insufficientBalance'), t('validation:walletBalanceTooLow'));
      return;
    }

    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "Single Pana",
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(), // OPEN/CLOSE
        amount: Number(b.points) || 0,
        betValue: String(b.pana),
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert("Success", "Bets placed successfully!");

      // Update balance safely
      const spent = Number(totalPoints) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
      setPoints("");
      setPointsError(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to place bets.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - SINGLE PANA BULK`} />
        <BettingClosedModal
          visible={showClosedModal}
          onClose={closeClosedModal}
        />

        <View style={styles.content}>
          {/* Game type dropdown */}
          <GameTypePicker
            label="Select Game Type:"
            value={selectedType}
            options={pickerOptions}
            onChange={setSelectedType}
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Points row */}
          <View style={styles.pointInputRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Enter Points:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
                pointsError && [styles.errorInput, { borderColor: colors.error }],
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={handlePointsChange}
              placeholder="Point"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Digit grid */}
          <View style={styles.grid}>
            {DIGITS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.digitTile, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => handleDigitPress(d)}
              >
                <Text style={[styles.digitText, { color: colors.text }]}>{d}</Text>
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
  },
  screen: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
    textAlign: "center",
    writingDirection: "ltr",
    paddingHorizontal: 8,
  },
  errorInput: {
  },

  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  digitTile: {
    width: "18%", // 5 per row with gaps
    aspectRatio: 1.6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  digitText: {
    fontSize: 18,
    fontWeight: "700",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});