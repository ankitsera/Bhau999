import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicHeader from '../../components/DynamicHeader';
import { getSinglePanaSuggestions } from '../../data/singlePanaMap';

const GREEN = '#3FA16C';

const HalfSangamB = ({ route }) => {
  const gameId = route?.params?.game?.id;
  const gameName = route?.params?.game?.gameName || 'GAME';

  // TODO: replace with WalletContext later
  const balance = 999999999;

  const [openAnk, setOpenAnk] = useState('');
  const [closePana, setClosePana] = useState('');
  const [points, setPoints] = useState('');

  const [showCloseSug, setShowCloseSug] = useState(false);

  const [bets, setBets] = useState([]); // {id, sangam, points}

  const closeSuggestions = useMemo(() => {
    if (!showCloseSug) return [];
    return getSinglePanaSuggestions(closePana);
  }, [closePana, showCloseSug]);

  const totals = useMemo(() => {
    const bids = bets.length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (Number(b.points) || 0),
      0,
    );
    return { bids, points: totalPoints };
  }, [bets]);

  const sanitizeDigits = val => (val || '').replace(/[^0-9]/g, '');

  const handleAdd = () => {
    Keyboard.dismiss();

    const ankVal = sanitizeDigits(openAnk);
    const panaVal = sanitizeDigits(closePana);
    const pts = Number(points);

    if (ankVal.length !== 1) {
      Alert.alert('Validation', 'Please enter a valid Open Ank (1 digit).');
      return;
    }

    if (panaVal.length !== 3) {
      Alert.alert('Validation', 'Please enter a valid Close Pana (3 digits).');
      return;
    }

    if (!pts || pts <= 0) {
      Alert.alert('Validation', 'Please enter a valid point amount.');
      return;
    }

    const bet = {
      id: Date.now().toString(),
      sangam: `${ankVal}-${panaVal}`,
      points: pts,
    };

    setBets(prev => [...prev, bet]);
    setOpenAnk('');
    setClosePana('');
    setPoints('');
    setShowCloseSug(false);
  };

  const handleDelete = id => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async () => {
    const { bids, points: totalPts } = totals;

    if (bids === 0) {
      Alert.alert('No bets', 'Please add at least one bet.');
      return;
    }

    if (totalPts > balance) {
      Alert.alert('Insufficient balance', 'Your wallet balance is too low.');
      return;
    }

    const payload = {
      gameId,
      subGame: 'HALF_SANGAM_B',
      bets: bets.map(b => ({
        sangam: b.sangam,
        points: b.points,
      })),
    };

    try {
      console.log('Submitting Half Sangam(B):', payload);
      Alert.alert('Success', 'Bets submitted (mock).');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit bets.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title={`${gameName} - HALF SANGAM(B)`} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Open Ank */}
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Open Ank:</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={openAnk}
                onChangeText={t => setOpenAnk(sanitizeDigits(t).slice(0, 1))}
                placeholder="Ank"
                placeholderTextColor="#999"
                maxLength={1}
              />
            </View>

            {/* Close Pana */}
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Close Pana:</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={closePana}
                  onChangeText={t =>
                    setClosePana(sanitizeDigits(t).slice(0, 3))
                  }
                  placeholder="Pana"
                  placeholderTextColor="#999"
                  maxLength={3}
                  onFocus={() => setShowCloseSug(true)}
                  onBlur={() => setShowCloseSug(false)}
                />

                {showCloseSug && closeSuggestions.length > 0 && (
                  <View style={styles.suggestionBox}>
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {closeSuggestions.map(item => (
                        <TouchableOpacity
                          key={item}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setClosePana(item);
                            setShowCloseSug(false);
                          }}
                        >
                          <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Points */}
            <View style={styles.pointInputRow}>
              <Text style={styles.label}>Enter Points:</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={points}
                onChangeText={t => setPoints(sanitizeDigits(t))}
                placeholder="Point"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>

            {/* Table */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>Sangam</Text>
              <Text style={[styles.headerCell, { flex: 0.9 }]}>Amount</Text>
              <Text style={[styles.headerCell, { flex: 0.7 }]}>Delete</Text>
            </View>

            {bets.map(b => (
              <View key={b.id} style={styles.rowCard}>
                <Text style={[styles.rowText, { flex: 1.2 }]}>{b.sangam}</Text>
                <Text
                  style={[styles.rowText, { flex: 0.9, textAlign: 'center' }]}
                >
                  {b.points}
                </Text>

                <View style={{ flex: 0.7, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.deleteCircle}
                    onPress={() => handleDelete(b.id)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 80 }} />
          </ScrollView>
        </View>

        {/* Bottom submit */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HalfSangamB;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputWrapper: {
    width: 180,
    position: 'relative',
  },
  input: {
    height: 44,
    width: 180,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  suggestionBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 8,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    marginTop: 6,
    height: 44,
    borderRadius: 6,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180,
    alignSelf: 'flex-end',
  },
  addText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeader: {
    marginTop: 14,
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCell: {
    color: '#000',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
  },
  rowCard: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  rowText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '500',
  },
  deleteCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  submitBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
