import React, { useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import ThemeHeader from '../components/Header';
import EmptyState from '../components/EmptyState';
import { GameContext } from '../contexts/GameContext';
import { ThemeColor } from '../contexts/Themes';

const Row = ({ name, onPanel }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>
        {String(name || '').toUpperCase()}
      </Text>

      <View style={styles.actions}>
        {/* Jodi removed ✅ */}
        <Pressable style={styles.btn} onPress={onPanel}>
          <Text style={styles.btnText}>Panel</Text>
        </Pressable>
      </View>
    </View>
  );
};

const MatkaChart = () => {
  const navigation = useNavigation();
  const { activeGamesUi, isLoadingActiveGames, loadActiveGames } =
    useContext(GameContext);

  useFocusEffect(
    useCallback(() => {
      // keep it fresh when user opens this screen
      loadActiveGames?.();
    }, [loadActiveGames]),
  );

  const list = useMemo(() => {
    const arr = Array.isArray(activeGamesUi) ? activeGamesUi : [];
    // simple sort A-Z
    return arr
      .slice()
      .sort((a, b) =>
        String(a?.gameName || '').localeCompare(String(b?.gameName || '')),
      );
  }, [activeGamesUi]);

  const onRefresh = useCallback(async () => {
    await loadActiveGames?.();
  }, [loadActiveGames]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ThemeHeader title="Game Chart List" />

      <View style={styles.body}>
        {isLoadingActiveGames && list.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={ThemeColor} />
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item, idx) => String(item?.gameName || idx)}
            renderItem={({ item }) => (
              <Row
                name={item?.gameName}
                onPanel={() =>
                  navigation.navigate('GameChartPanel', {
                    gameName: String(item?.gameName || '').toUpperCase(),
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={!!isLoadingActiveGames}
                onRefresh={onRefresh}
              />
            }
            ListEmptyComponent={<EmptyState text="No games found" />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MatkaChart;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F6' },
  body: { flex: 1 },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: { color: '#111', fontWeight: '700' },

  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  name: {
    flex: 1,
    color: '#111',
    fontWeight: '900',
    fontSize: 18,
    paddingRight: 10,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  btn: {
    backgroundColor: ThemeColor,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,

    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});
