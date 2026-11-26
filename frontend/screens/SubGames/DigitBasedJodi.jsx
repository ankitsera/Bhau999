import React, { useMemo, useState, useContext } from "react";
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

import DynamicHeader from "../../components/DynamicHeader";
import BottomBetBar from "../../components/games/BottomBetBar";
import EasyModeTable from "../../components/games/EasyModeTable";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";
import { useTheme } from "../../contexts/ThemeContext";
import { FONT } from '../../contexts/Themes';

const DIGIT_ROWS = [
  ["1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "0"],
];

const DigitBasedJodi = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || "GAME";

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const { showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
  });
  const [points, setPoints] = useState("");
  const [bets, setBets] = useState([]); // { id, digit, points, type }
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

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

    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    const group = buildJodisForDigit(d);

    setBets((prev) => {
      const map = new Map(prev.map((b) => [b.id, b]));

      group.forEach((jodi) => {
        const id = `close-${jodi}`;
        if (map.has(id)) {
          map.set(id, { ...map.get(id), points: pts });
        } else {
          map.set(id, {
            id,
            digit: jodi,
            points: pts,
            type: 'CLOSE',
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
      Alert.alert(t('validation:noBets'), t('validation:pleaseAddDigitGroup'));
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

    // ✅ NEW: backend bet array
    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: 'Jodi',
        openClose: 'CLOSE',
        amount: Number(b.points) || 0,
        betValue: b.digit,
      })
    );

    try {
      const res = await placeBets(betsToSend); //API call
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

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
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - JODI`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        {/* MAIN CONTENT (no ScrollView) */}
        <View style={styles.content}>
          {/* Top controls (fixed) */}
          <View style={styles.pointRow}>
            <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={points}
              onChangeText={setPoints}
              placeholder={t('games:point')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.digitGrid}>
            {DIGIT_ROWS.map((row, idx) => (
              <View key={idx} style={styles.digitRow}>
                {row.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.digitBtn, { backgroundColor: colors.primary }]}
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
              digitHeaderLabel={t('games:jodi')}
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
  },
  screen: {
    flex: 1,
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
    fontSize: FONT.body,
    fontWeight: "500",
  },
  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: FONT.body,
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
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  digitText: {
    color: "#FFF",
    fontSize: FONT.title,
    fontWeight: "800",
  },

  tableArea: {
    flex: 1,
    paddingBottom: 10, // small breathing space above bottom bar
  },
});