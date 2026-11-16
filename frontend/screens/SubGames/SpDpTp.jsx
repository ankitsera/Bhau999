import React, { useContext, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTranslation } from 'react-i18next';

import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import BottomBetBar from "../../components/games/BottomBetBar";
import EasyModeTable from "../../components/games/EasyModeTable";

// maps
import { SINGLE_PANA_BY_RESULT_DIGIT } from "../../data/singlePanaMap";
import { DOUBLE_PANA_BY_RESULT_DIGIT } from "../../data/doublePanaMap";
import { TRIPLE_PANA_BY_RESULT_DIGIT } from "../../data/triplePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

import { useTheme } from "../../contexts/ThemeContext";

function buildDigitCount(str) {
  const c = {};
  for (const ch of String(str)) {
    c[ch] = (c[ch] || 0) + 1;
  }
  return c;
}

const SpDpTp = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || t('games:defaultGameName');

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

  const [selectedType, setSelectedType] = useState("OPEN");

  const { pickerOptions, showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
    selectedType,
    setSelectedType,
  });

  const [spChecked, setSpChecked] = useState(false);
  const [dpChecked, setDpChecked] = useState(false);
  const [tpChecked, setTpChecked] = useState(false);

  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  // EasyModeTable expects: { id, digit, points, type }
  const [bets, setBets] = useState([]);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const handleDelete = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const getListForDigit = (dChar) => {
    const key = String(Number(dChar)); // normalize

    const list = [];

    if (spChecked) {
      const sp =
        SINGLE_PANA_BY_RESULT_DIGIT?.[key] ||
        SINGLE_PANA_BY_RESULT_DIGIT?.[Number(key)] ||
        [];
      list.push(...sp.map(String));
    }

    if (dpChecked) {
      const dp =
        DOUBLE_PANA_BY_RESULT_DIGIT?.[key] ||
        DOUBLE_PANA_BY_RESULT_DIGIT?.[Number(key)] ||
        [];
      list.push(...dp.map((x) => String(x)));
    }

    if (tpChecked) {
      const tp =
        TRIPLE_PANA_BY_RESULT_DIGIT?.[key] ||
        TRIPLE_PANA_BY_RESULT_DIGIT?.[Number(key)] ||
        [];
      list.push(...tp.map((x) => String(x)));
    }

    // unique + sorted
    const unique = Array.from(new Set(list));
    unique.sort((a, b) => Number(a) - Number(b));
    return unique;
  };

  const handleGenerate = () => {
    if (!spChecked && !dpChecked && !tpChecked) {
      Alert.alert(t('validation:validation'), t('validation:pleaseSelectAtLeastOne'));
      return;
    }

    const d = digit.replace(/[^0-9]/g, "");
    if (d.length !== 1) {
      Alert.alert(t('validation:validation'), t('validation:pleaseEnterSingleDigit'));
      return;
    }

    const pts = Number(points);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    const panas = getListForDigit(d);

    setBets((prev) => {
      // keep unique by "digit" (which is actually pana here)
      const map = new Map(prev.map((b) => [b.digit, b]));

      panas.forEach((pana) => {
        map.set(pana, {
          id: `${pana}-${Date.now()}`,
          digit: pana,
          points: pts,
          type: selectedType.toLowerCase(),
        });
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => Number(a.digit) - Number(b.digit));
      return merged;
    });
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    if (totals.bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseGenerateAtLeastOneBet'));
      return;
    }

    if (!mobileNumber) {
      Alert.alert(t('validation:loginRequired'), t('validation:mobileNumberMissing'));
      return;
    }

    if (totals.points > balance) {
      Alert.alert(t('validation:insufficientBalance'), t('validation:walletBalanceTooLow'));
      return;
    }

    // Detect bet type by digit-count pattern (Single/Double/Triple Pana)
    const detectType = (panaStr) => {
      const s = String(panaStr || "");
      if (!/^\d{3}$/.test(s)) return "Single Pana";
      const c = buildDigitCount(s);
      const max = Math.max(...Object.values(c));
      if (max === 3) return "Triple Pana"; // 000,111...
      if (max === 2) return "Double Pana"; // 112, 505...
      return "Single Pana";               // 123...
    };

    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: detectType(b.digit),
        openClose: String(b?.type || selectedType.toLowerCase()).toUpperCase(), // OPEN/CLOSE
        amount: Number(b.points) || 0,
        betValue: String(b.digit),
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
      setDigit("");
      setPoints("");
      setSpChecked(false);
      setDpChecked(false);
      setTpChecked(false);
    } catch (e) {
      console.error(e);
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - SP DP TP`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={pickerOptions}
            onChangeGameType={setSelectedType}
          />

          {/* SP/DP/TP row */}
          <View style={styles.checkRow}>
            <CheckItem
              label="SP"
              checked={spChecked}
              onToggle={() => setSpChecked((p) => !p)}
              colors={colors}
            />
            <CheckItem
              label="DP"
              checked={dpChecked}
              onToggle={() => setDpChecked((p) => !p)}
              colors={colors}
            />
            <CheckItem
              label="TP"
              checked={tpChecked}
              onToggle={() => setTpChecked((p) => !p)}
              colors={colors}
            />
          </View>

          {/* Digit */}
          <View style={styles.pointInputRow}>
            <Text style={[styles.label, { color: colors.text }]}>{t('games:enterDigit')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={setDigit}
              placeholder={t('games:digit')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Points */}
          <View style={styles.pointInputRow}>
            <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={setPoints}
              placeholder={t('games:point')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Generate */}
          <View style={styles.generateWrap}>
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: colors.primary }]}
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <Text style={[styles.generateText, { color: colors.onPrimary }]}>Generate</Text>
            </TouchableOpacity>
          </View>

          {/* Table area (scrolls internally) */}
          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDelete}
              digitHeaderLabel={t('games:pana')}
            />
          </View>
        </View>

        <BottomBetBar
          bids={totals.bids}
          points={totals.points}
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

export default SpDpTp;

/** ---------- Small UI ---------- */
const CheckItem = ({ label, checked, onToggle, colors }) => {
  return (
    <View style={styles.checkItem}>
      <Text style={[styles.checkLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.checkBox,
          {
            borderColor: colors.textSecondary,
            backgroundColor: colors.surface,
          },
          checked && [
            styles.checkBoxChecked,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ],
        ]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        {checked ? <MaterialIcons name="check" size={18} color={colors.onPrimary} /> : null}
      </TouchableOpacity>
    </View>
  );
};

/** ---------- Styles ---------- */
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

  checkRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  checkItem: { alignItems: "center", width: 80 },
  checkLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBoxChecked: {},

  pointInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
    textAlign: "center", // This centers the text and cursor
    paddingHorizontal: 0, // Removes internal padding that might push the cursor
  },

  generateWrap: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 6,
  },
  generateBtn: {
    width: 180,
    height: 44,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  generateText: {
    fontSize: 16,
    fontWeight: "700",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});