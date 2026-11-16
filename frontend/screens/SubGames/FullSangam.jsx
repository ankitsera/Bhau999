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
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from "react-native-safe-area-context";

import DynamicHeader from "../../components/DynamicHeader";
import { getAllPanaSuggestions } from "../../data/singlePanaMap";

import { AuthContext } from "../../contexts/AuthContext";
import { placeBets, makeBet } from "../../utils/GameService";
import BettingClosedModal from "../../components/BettingClosedModal";
import { useBettingGuard } from "../../utils/BettingGuard";
import { validateAndAlertBetAmount, fetchBetLimits } from "../../utils/BetValidationService";

import { useTheme } from "../../contexts/ThemeContext";

const normalizePana = (v) =>
  String(v || "")
    .replace(/[^0-9]/g, "")
    .slice(0, 3);

const isValidPana = (p) => /^\d{3}$/.test(p);

const FullSangam = ({ route }) => {
  const { t } = useTranslation(['games', 'validation', 'common']);
  const { colors } = useTheme();

  const gameName = route?.params?.gameName || t('games:defaultGameName');

  const { user, updateUser } = useContext(AuthContext);
  const balance = Number(user?.balance || 0);
  const mobileNumber = user?.mobileNumber;

  const { showClosedModal, closeClosedModal, guard } = useBettingGuard({
    gameName,
  });

  const [openPana, setOpenPana] = useState("");
  const [closePana, setClosePana] = useState("");
  const [points, setPoints] = useState("");
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(10000);

  React.useEffect(() => {
    fetchBetLimits().then(({ minAmount, maxAmount }) => {
      setMinAmount(minAmount);
      setMaxAmount(maxAmount);
    });
  }, []);

  const [focusedField, setFocusedField] = useState(null); // "OPEN" | "CLOSE" | null
  const [bets, setBets] = useState([]); // { id, sangam, points }

  const openSuggestions = useMemo(() => {
    const list = getAllPanaSuggestions(openPana) || [];
    return list.slice(0, 30);
  }, [openPana]);

  const closeSuggestions = useMemo(() => {
    const list = getAllPanaSuggestions(closePana) || [];
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
      Alert.alert(t('validation:validation'), t('validation:pleaseEnterValidOpenPana'));
      return;
    }
    if (!isValidPana(cp)) {
      Alert.alert(t('validation:validation'), t('validation:pleaseEnterValidClosePana'));
      return;
    }

    // ✅ ensure they are valid pana from your predefined list
    const opValid = (getAllPanaSuggestions(op[0]) || []).includes(op);
    const cpValid = (getAllPanaSuggestions(cp[0]) || []).includes(cp);

    if (!opValid || !cpValid) {
      Alert.alert(t('validation:validation'), t('validation:pleaseSelectValidPana'));
      return;
    }

    const pts = Number(points);
    if (!validateAndAlertBetAmount(pts, minAmount, maxAmount, t)) {
      return;
    }

    const sangam = `${op}-${cp}`;
    const newBet = {
      id: sangam, // stable id => prevents duplicates (same pair)
      sangam,
      points: pts,
      type: 'CLOSE',
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
    if (!guard()) return;

    if (bets.length === 0) {
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

    // Full Sangam is inherently a "close" style bet (it includes close pana).
    const openClose = "CLOSE";

    const betsToSend = bets.map((b) =>
      makeBet({
        mobileNumber,
        gameName,
        type: "Full Sangam",
        openClose,
        amount: Number(b.points) || 0,
        betValue: b.sangam, // "open-close"
      })
    );

    try {
      const res = await placeBets(betsToSend);
      Alert.alert(t('common:success'), t('games:betPlacedSuccessfully'));

      // Update balance safely
      const spent = Number(totalPoints) || 0;
      const nextBalance = Math.max(0, balance - spent);
      updateUser({ balance: nextBalance });

      setBets([]);
    } catch (e) {
      console.error(e);
      Alert.alert(t('common:error'), e?.message || t('games:betsFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DynamicHeader title={`${gameName} - FULL SANGAM`} />
        <BettingClosedModal visible={showClosedModal} onClose={closeClosedModal} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* OPEN PANA */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterOpenPana')}</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={openPana}
                  onChangeText={(text) => setOpenPana(normalizePana(text))}
                  placeholder={t('games:pana')}
                  placeholderTextColor={colors.textTertiary}
                  onFocus={() => setFocusedField("OPEN")}
                  onBlur={() => setTimeout(() => setFocusedField(null), 120)}
                />

                {focusedField === "OPEN" && openSuggestions.length > 0 && (
                  <SuggestionBox
                    items={openSuggestions}
                    onPick={(v) => handlePickSuggestion("OPEN", v)}
                    bg={colors.background}
                    border={colors.border}
                    text={colors.text}
                  />
                )}
              </View>
            </View>

            {/* CLOSE PANA */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterClosePana')}</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={closePana}
                  onChangeText={(text) => setClosePana(normalizePana(text))}
                  placeholder={t('games:pana')}
                  placeholderTextColor={colors.textTertiary}
                  onFocus={() => setFocusedField("CLOSE")}
                  onBlur={() => setTimeout(() => setFocusedField(null), 120)}
                />

                {focusedField === "CLOSE" && closeSuggestions.length > 0 && (
                  <SuggestionBox
                    items={closeSuggestions}
                    onPick={(v) => handlePickSuggestion("CLOSE", v)}
                    bg={colors.background}
                    border={colors.border}
                    text={colors.text}
                  />
                )}
              </View>
            </View>

            {/* POINTS */}
            <View style={styles.pointInputRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('games:enterPoints')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                keyboardType="number-pad"
                value={points}
                onChangeText={(text) =>
                  setPoints(String(text).replace(/[^0-9]/g, ""))
                }
                placeholder={t('games:point')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* ADD */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>{t('common:add')}</Text>
            </TouchableOpacity>

            {/* TABLE HEADER */}
            <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
              <Text style={[styles.th, { flex: 1.1, color: colors.onPrimary }]}>{t('games:sangam')}</Text>
              <Text style={[styles.th, { flex: 1, color: colors.onPrimary }]}>{t('funds:amount')}</Text>
              <Text style={[styles.th, { width: 70, textAlign: "center", color: colors.onPrimary }]}>
                {t('common:delete')}
              </Text>
            </View>

            {/* ROWS */}
            {bets.map((b) => (
              <View key={b.id} style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cell, { flex: 1.1, color: colors.text }]}>{b.sangam}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: "center", color: colors.text }]}>
                  {b.points}
                </Text>

                <TouchableOpacity
                  style={[styles.deleteCircle, { backgroundColor: colors.primary }]}
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
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>{t('common:submit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FullSangam;

/* ----------------------- small component ----------------------- */

const SuggestionBox = ({ items, onPick, bg, border, text }) => {
  return (
    <View style={[styles.suggestionBox, { backgroundColor: bg, borderColor: border }]}>
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
            <Text style={[styles.suggestionText, { color: text }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

/* ---------------------------- styles --------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
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
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },

  inputWrapper: {
    width: 150,
    position: "relative",
  },

  input: {
    height: 44,
    width: 150,
    borderRadius: 22,
    borderWidth: 1,
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
    borderWidth: 1,
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
  },

  addButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 6,
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
    borderRadius: 6,
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  th: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  rowCard: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    elevation: 2,
  },
  cell: {
    fontSize: 14,
  },

  deleteCircle: {
    width: 34,
    height: 34,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  bottomBar: {
    height: 70,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  submitBtn: {
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