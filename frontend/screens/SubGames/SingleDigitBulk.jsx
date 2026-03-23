// screens/SubGames/SingleDigitBulk.jsx
import React, { useContext, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
} from "react-native";
import { useTranslation } from 'react-i18next';

import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import GameTypePicker from "../../components/games/GameTypePicker";

import DigitGrid from "../../components/games/DigitGrid";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

import { useTheme } from "../../contexts/ThemeContext";

const DIGITS = ["1","2","3","4","5","6","7","8","9","0"];

const SingleDigitBulk = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || "GAME";

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const [selectedType, setSelectedType] = useState("OPEN");

  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
  });

  // points input at top
  const [pointInput, setPointInput] = useState("");
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

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
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    setPointsByDigit((prev) => ({
      ...prev,
      [digit]: pts.toString(),
    }));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    if (bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseSelectDigit'));
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

    const list = [];
    DIGITS.forEach((d) => {
      const val = Number(pointsByDigit[d] || 0);
      if (val > 0) list.push({ digit: d, points: val });
    });

    const betsToSend = list.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "Single Digit",
        openClose: String(selectedType).toUpperCase(), // OPEN/CLOSE
        amount: Number(b.points) || 0,
        betValue: String(b.digit),
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      // Update balance safely
      const spent = Number(totalPoints) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      // reset
      setPointInput("");
      setPointsByDigit(
        DIGITS.reduce((acc, d) => {
          acc[d] = "";
          return acc;
        }, {})
      );
    } catch (e) {
      console.error(e);
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - SINGLE DIGIT BULK`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Select Game Type */}
            <GameTypePicker
              label={t('games:selectGameType')}
              value={selectedType}
              options={pickerOptions}
              onChange={setSelectedType}
              containerStyle={{ marginBottom: 12 }}
            />

            {/* Enter Points */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                ]}
                keyboardType="number-pad"
                value={pointInput}
                onChangeText={setPointInput}
                placeholder={t('games:point')}
                placeholderTextColor={colors.textTertiary}
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
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
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
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
});