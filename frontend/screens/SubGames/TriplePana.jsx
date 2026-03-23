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
import { useTranslation } from 'react-i18next';

import DynamicHeader from "../../components/DynamicHeader";
import GameDateTypeRow from "../../components/games/GameDateTypeRow";
import SpecialModeGrid from "../../components/games/SpecialModeGrid";

import { ALL_TRIPLE_PANA } from "../../data/triplePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

import { useTheme } from "../../contexts/ThemeContext";

const TriplePana = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || 'GAME';

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
    if (!guard()) return;

    if (totals.bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseEnterPointsPana'));
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

    const betsToSend = [];
    ALL_TRIPLE_PANA.forEach((p) => {
      const pts = Number(pointsByPana[p] || 0);
      if (pts > 0) {
        if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
          return;
        }
        betsToSend.push(
          makeBet({
            mobileNumber,
            gameName,
            type: "Triple Pana",
            openClose: String(selectedType).toUpperCase(), // OPEN/CLOSE
            amount: pts,
            betValue: String(p),
          })
        );
      }
    });

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      // Update balance safely
      const spent = Number(totals.points) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setPointsByPana(
        ALL_TRIPLE_PANA.reduce((acc, p) => {
          acc[p] = "";
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
        <DynamicHeader title={`${gameName} - TRIPLE PANA`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GameDateTypeRow
            dateLabel={todayLabel}
            gameTypeValue={selectedType}
            gameTypeOptions={pickerOptions}
            onChangeGameType={setSelectedType}
          />

          <SpecialModeGrid
            digits={ALL_TRIPLE_PANA}
            pointsByDigit={pointsByPana}
            onChangePoint={handleChangePoint}
          />

          <View style={styles.submitWrap}>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, shadowColor: colors.text }]}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text style={[styles.submitText, { color: colors.text }]}>{t('common:submit')}</Text>
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
  },
  screen: {
    flex: 1,
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
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
  },
});