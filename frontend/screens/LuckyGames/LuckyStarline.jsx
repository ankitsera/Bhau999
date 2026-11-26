// screens/Dashboards/LuckyStarline.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DynamicHeader from '../../components/DynamicHeader';
import LuckyGamesCard from '../../components/games/LuckyGamesCard';

import { ThemeColor, FONT } from '../../contexts/Themes';

const GREEN = ThemeColor;
const BG = '#F3F3F3';

const LuckyStarline = ({ navigation }) => {
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  // TODO: replace with API response
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // TODO: call your Lucky Starline games API here
        // const res = await GameService.getLuckyStarlineGames();
        // setGames(res?.data || []);

        // mock UI data (remove later)
        setGames([
          {
            id: '10am',
            timeLabel: '10:00 AM',
            statusLabel: 'Close for today',
            statusColor: '#D32F2F',
            resultLabel: '667 - 9',
            canPlay: false,
          },
          {
            id: '11am',
            timeLabel: '11:00 AM',
            statusLabel: 'Close for today',
            statusColor: '#D32F2F',
            resultLabel: '444 - 2',
            canPlay: false,
          },
          {
            id: '12pm',
            timeLabel: '12:00 PM',
            statusLabel: 'Close for today',
            statusColor: '#D32F2F',
            resultLabel: '146 - 1',
            canPlay: false,
          },
          {
            id: '1pm',
            timeLabel: '01:00 PM',
            statusLabel: 'Close for today',
            statusColor: '#D32F2F',
            resultLabel: '467 - 7',
            canPlay: false,
          },
          {
            id: '2pm',
            timeLabel: '02:00 PM',
            statusLabel: 'Close for today',
            statusColor: '#D32F2F',
            resultLabel: '247 - 3',
            canPlay: false,
          },
          {
            id: '3pm',
            timeLabel: '03:00 PM',
            statusLabel: 'Running Now',
            statusColor: GREEN,
            resultLabel: '*** - *',
            canPlay: true,
          },
          {
            id: '4pm',
            timeLabel: '04:00 PM',
            statusLabel: 'Running Now',
            statusColor: GREEN,
            resultLabel: '*** - *',
            canPlay: true,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    };

    fetchGames();
  }, []);

  const onPressPlay = item => {
    if (!item?.canPlay) {
      Alert.alert('Closed', 'This game is closed for today.');
      return;
    }

    // TODO: navigate to play screen with API-provided params
    // navigation?.navigate("StarlineGame", { gameId: item.id, ... })
    Alert.alert('Play', `Play ${item.timeLabel} (wire navigation later)`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <DynamicHeader title="Lucky Starline" />

        {/* Top row (History + Notification) */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.historyBtn}
            activeOpacity={0.85}
            onPress={() => Alert.alert('History', 'Wire this later')}
          >
            <MaterialCommunityIcons name="history" size={24} color="#111" />
            <Text style={styles.topRowText}>History</Text>
          </TouchableOpacity>

          <View style={styles.notifyWrap}>
            <Text style={styles.topRowText}>Notification</Text>
            <Switch
              value={notifyEnabled}
              onValueChange={setNotifyEnabled}
              thumbColor="#FFF"
              trackColor={{ false: '#CFCFCF', true: GREEN }}
            />
          </View>
        </View>

        {/* Games list */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {games.map(item => (
            <LuckyGamesCard
              key={item.id}
              timeLabel={item.timeLabel}
              statusLabel={item.statusLabel}
              statusColor={item.statusColor}
              resultLabel={item.resultLabel}
              canPlay={item.canPlay}
              onPressPlay={() => onPressPlay(item)}
            />
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LuckyStarline;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topRowText: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: '#222',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
});
