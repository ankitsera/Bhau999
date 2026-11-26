import React, { useContext, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';

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

const JodiBulk = ({ route }) => {
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
  const [jodiDigit, setJodiDigit] = useState("");
  const [pointsError, setPointsError] = useState(false);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  // { id, digit, points, type }
  const [bets, setBets] = useState([]);

  const { bids, totalPoints } = useMemo(() => {
    const b = bets.length;
    const p = bets.reduce((sum, b) => sum + (Number(b.points) || 0), 0);
    return { bids: b, totalPoints: p };
  }, [bets]);

  const isPointsValid = () => {
    const val = Number(points);
    return validateAndAlertBetAmount(val, minAmount, maxAmount);
  };

  const addBet = (digitToUse) => {
    if (!digitToUse || digitToUse.length !== 2) return;

    if (!isPointsValid()) {
      setPointsError(true);
      return;
    }

    const newBet = {
      id: Date.now().toString(),
      digit: digitToUse,
      points: Number(points),
      type: 'CLOSE',
    };

    setBets((prev) => [...prev, newBet]);
    setJodiDigit("");
    setPointsError(false);
  };

  const handleDigitChange = (text) => {
    const clean = text.replace(/[^0-9]/g, "").slice(0, 2);
    setJodiDigit(clean);

    if (clean.length === 2) {
      if (isPointsValid()) {
        addBet(clean);
      } else {
        setPointsError(true);
      }
    }
  };

  const handlePointsChange = (text) => {
    const clean = text.replace(/[^0-9]/g, "");
    setPoints(clean);
    if (pointsError && clean) {
      setPointsError(false);
    }
  };

  const handleAddPress = () => {
    if (!jodiDigit || jodiDigit.length !== 2) return;
    addBet(jodiDigit);
  };

  const handleDeleteBet = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!guard()) return;

    if (bids === 0) {
      Alert.alert(t('validation:noBets'), t('validation:pleaseAddJodi'));
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
        type: "Jodi",
        openClose: "CLOSE",
        amount: Number(b.points) || 0,
        betValue: b.digit,
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      const spent = Number(totalPoints) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
      setJodiDigit("");
    } catch (e) {
      console.error(e);
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - JODI BULK`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <View style={styles.pointInputRow}>
            <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                pointsError && [styles.errorInput, { borderColor: colors.error }],
              ]}
              keyboardType="number-pad"
              value={points}
              onChangeText={handlePointsChange}
              placeholder={t('games:point')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.pointInputRow}>
            <Text style={[styles.label, { color: colors.text }]}>{t('games:enterJodiDigit')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={jodiDigit}
              onChangeText={handleDigitChange}
              placeholder={t('games:jodi')}
              maxLength={2}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.addButtonWrapper}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddPress}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>{t('common:add')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableArea}>
            <EasyModeTable
              bets={bets}
              onDelete={handleDeleteBet}
              digitHeaderLabel={t('games:jodi')}
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

export default JodiBulk;

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
    marginBottom: 8,
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
    marginBottom: 4,
    textAlign: "center",
    writingDirection: "ltr",
  },
  errorInput: {
    borderWidth: 2,
  },
  addButtonWrapper: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 4,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180,
    alignSelf: 'flex-end',
  },
  addText: {
    color: "#FFF",
    fontSize: FONT.body,
    fontWeight: "700",
  },
  tableArea: {
    flex: 1,
    paddingBottom: 10,
  },
});