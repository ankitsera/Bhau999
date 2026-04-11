import React, {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from 'react-i18next';
import ThemeHeader from '../components/ThemeHeader';
import PaginationBar from '../components/PaginationBar';
import LoadingView from '../components/LoadingView';

import { AuthContext } from '../contexts/AuthContext';
import { GameContext } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';

import DateFilterRow, { matchesSingleDateFilter } from '../components/DateFilterRow';

const PAGE_SIZE = 8;

const parseLocalDateTime = val => {
  if (!val || typeof val !== 'string') return null;
  const [datePart, timePart] = val.split('T');
  if (!datePart || !timePart) return null;

  const [y, m, d] = datePart.split('-').map(x => Number(x));
  const [hh, mm, ssRaw] = timePart.split(':');
  const H = Number(hh);
  const M = Number(mm);
  const S = Number(String(ssRaw || '0').split('.')[0]);

  if (![y, m, d, H, M].every(Number.isFinite)) return null;
  return new Date(y, (m || 1) - 1, d || 1, H || 0, M || 0, S || 0);
};

const formatDatePretty = dt => {
  if (!(dt instanceof Date)) return '--';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dd = String(dt.getDate()).padStart(2, '0');
  const mon = months[dt.getMonth()] || '--';
  const yyyy = dt.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
};

const formatTime12h = dt => {
  if (!(dt instanceof Date)) return '--:--';
  let h = dt.getHours();
  const m = dt.getMinutes();
  const s = dt.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s,
  ).padStart(2, '0')} ${ampm}`;
};

const normOC = v => {
  const s = String(v || '').trim();
  return s ? s.toUpperCase() : '';
};

// normalize result for filtering + UI
const normResult = v => {
  const s = String(v ?? '').trim().toUpperCase();
  return s; // could be "", "WON", "LOST", etc.
};

const sortNewestFirst = (a, b) => {
  const da = parseLocalDateTime(a?.betTime || a?.bet_time);
  const db = parseLocalDateTime(b?.betTime || b?.bet_time);

  const ta = da ? da.getTime() : 0;
  const tb = db ? db.getTime() : 0;

  if (ta !== tb) return tb - ta;

  const ia = Number(a?.id || 0);
  const ib = Number(b?.id || 0);
  return ib - ia;
};

const buildTitle = item => {
  const name = String(item?.gameName || 'GAME').toUpperCase();
  const oc = normOC(item?.openClose || item?.open_close);
  
  // Don't show OC if game type contains "JODI" or "SANGAM"
  const gameType = String(item?.type || '').toUpperCase();
  const shouldHideOC = gameType.includes('JODI') || gameType.includes('SANGAM');
  const displayOC = shouldHideOC ? '' : oc;
  
  return displayOC ? `${name}  (${displayOC})` : name;
};

const makeSig = x => {
  // Signature to dedupe + key rows uniquely even if backend repeats rows
  const game = x?.gameName ?? '';
  const id = x?.id ?? '';
  const t = x?.betTime ?? x?.bet_time ?? '';
  const type = x?.type ?? '';
  const amt = x?.amount ?? '';
  const val = x?.betValue ?? x?.bet_value ?? '';
  const oc = x?.openClose ?? x?.open_close ?? '';
  const res = x?.result ?? '';
  return `${game}|${id}|${t}|${type}|${amt}|${val}|${oc}|${res}`;
};

const ResultPill = ({ result }) => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors } = useTheme();

  const r = String(result || '')
    .trim()
    .toUpperCase();
  if (!r) return null;

  const isWon = r === 'WON';
  const bg = isWon ? '#E9FFF2' : '#FFECEC';
  const fg = isWon ? '#0E8F4D' : '#C62828';

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{r}</Text>
    </View>
  );
};

const InfoBlock = ({ label, value, align = 'left' }) => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.infoBlock,
        align === 'center' && styles.center,
        align === 'right' && styles.right,
      ]}
    >
      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{t(label)}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const BidHistoryCard = ({ item, t }) => {
  const { colors } = useTheme();

  const gameType = String(item?.type || '--');
  const digit = item?.betValue ?? item?.bet_value ?? '--';
  const points = item?.amount ?? '--';
  const bidId = item?.id ?? '--';

  const dt = parseLocalDateTime(item?.betTime || item?.bet_time);
  const bidDate = dt ? formatDatePretty(dt) : '--';
  const txnTime = dt ? formatTime12h(dt) : '--:--';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <View style={[styles.cardTop, { backgroundColor: colors.primary }]}>
        <Text style={[styles.cardTopTitle, { color: colors.text }]}>{buildTitle(item)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.rowTopMeta}>
          <ResultPill result={item?.result} />
        </View>

        <View style={styles.row3}>
          <InfoBlock label="games:gameType" value={gameType} align="left" />
          <InfoBlock label="games:digit" value={String(digit)} align="center" />
          <InfoBlock label="games:points" value={String(points)} align="right" />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.row2}>
          <InfoBlock label="screens:bidId" value={String(bidId)} align="left" />
          <InfoBlock label="screens:bidDate" value={bidDate} align="right" />
        </View>

        <Text style={[styles.txnTime, { color: colors.textTertiary }]}>{t('screens:transactionTime')} : {txnTime}</Text>
      </View>
    </View>
  );
};

const EmptyState = ({ text }) => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors } = useTheme();

  return (
    <View style={styles.emptyWrap}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t(text)}</Text>
    </View>
  );
};

// tiny checkbox (no extra deps)
const CheckRow = ({ label, checked, onToggle }) => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors } = useTheme();

  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <View
        style={[
          styles.checkbox,
          { borderColor: colors.textTertiary, backgroundColor: colors.background },
          checked && [styles.checkboxOn, { borderColor: colors.primary, backgroundColor: colors.surface }],
        ]}
      >
        {checked ? <Text style={[styles.tick, { color: colors.success }]}>✓</Text> : null}
      </View>
      <Text style={[styles.checkLabel, { color: colors.text }]} numberOfLines={1}>
        {t(label)}
      </Text>
    </Pressable>
  );
};

// maps UI filters to actual backend values
const matchesResultFilter = (item, wantedSet) => {
  if (!wantedSet || wantedSet.size === 0) return true;

  const r = normResult(item?.result);

  // WIN => "WON"
  const isWin = r === 'WON';

  // LOOSE => "LOST"/"LOSE"/"LOOSE" (handle typos + variants)
  const isLoose = r === 'LOST' || r === 'LOSE' || r === 'LOOSE';

  // PENDING => null/empty OR explicit "PENDING"
  const isPending = !r || r === 'PENDING';

  if (wantedSet.has('WIN') && isWin) return true;
  if (wantedSet.has('LOOSE') && isLoose) return true;
  if (wantedSet.has('PENDING') && isPending) return true;

  return false;
};

const matchesOpenCloseFilter = (item, wantedSet) => {
  if (!wantedSet || wantedSet.size === 0) return true;
  const oc = normOC(item?.openClose || item?.open_close);
  return wantedSet.has(oc); // "OPEN"/"CLOSE"
};

const matchesGameFilter = (item, wantedSet) => {
  if (!wantedSet || wantedSet.size === 0) return true;
  const name = String(item?.gameName || '').trim().toUpperCase();
  return wantedSet.has(name);
};

const BidHistory = () => {
  const { t } = useTranslation(['games', 'screens', 'common']);
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { bidHistory, isLoadingBidHistory, loadBidHistoryByUser } =
    useContext(GameContext);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Filter modal state (kept in-screen for now; later can move into ThemeHeader)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // applied filters (these affect list)
  const [filters, setFilters] = useState({
    openClose: new Set(), // "OPEN","CLOSE"
    result: new Set(), // "WIN","LOOSE","PENDING"
    games: new Set(), // "TIME BAZAR", ...
    date: null, // Date | null
  });

  // draft filters (used inside modal before hitting "Filter")
  const [draft, setDraft] = useState({
    openClose: new Set(),
    result: new Set(),
    games: new Set(),
    date: null,
  });

  const fetchData = useCallback(async () => {
    if (!mobileNumber) return;
    await loadBidHistoryByUser?.(mobileNumber);
  }, [mobileNumber, loadBidHistoryByUser]);

  useFocusEffect(
    useCallback(() => {
      fetchData?.();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData?.();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // list of games for filter UI (from what we received)
  const allGames = useMemo(() => {
    const arr = Array.isArray(bidHistory) ? bidHistory : [];
    const set = new Set();
    for (let i = 0; i < arr.length; i++) {
      const name = String(arr[i]?.gameName || '').trim().toUpperCase();
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [bidHistory]);

  // apply filters BEFORE dedupe/sort/pagination so UX is clean
  const filteredRaw = useMemo(() => {
    const arr = Array.isArray(bidHistory) ? bidHistory : [];

    const hasAny =
      filters.openClose.size ||
      filters.result.size ||
      filters.games.size ||
      (filters.date instanceof Date);

    if (!hasAny) return arr;

    return arr.filter(it => {
      if (!matchesResultFilter(it, filters.result)) return false;
      if (!matchesOpenCloseFilter(it, filters.openClose)) return false;
      if (!matchesGameFilter(it, filters.games)) return false;

      // Date filter
      const dt = parseLocalDateTime(it?.betTime || it?.bet_time);
      if (!matchesSingleDateFilter(dt, filters.date)) return false;

      return true;
    });
  }, [bidHistory, filters]);

  // dedupe + sort (this fixes your "same key" warning AND duplicate cards)
  const sorted = useMemo(() => {
    const arr = Array.isArray(filteredRaw) ? filteredRaw : [];

    const seen = new Set();
    const uniq = [];
    for (let i = 0; i < arr.length; i++) {
      const sig = makeSig(arr[i]);
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniq.push(arr[i]);
    }

    return uniq.sort(sortNewestFirst);
  }, [filteredRaw]);

  const totalPages = useMemo(() => {
    const n = sorted.length;
    return n === 0 ? 1 : Math.max(1, Math.ceil(n / PAGE_SIZE));
  }, [sorted.length]);

  const safePage = Math.min(Math.max(1, page), totalPages);

  // keep page valid when data size changes (prevents 5/1 weirdness)
  useEffect(() => {
    setPage(p => {
      const next = Math.min(Math.max(1, p), totalPages);
      return next;
    });
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return sorted.slice(start, end);
  }, [sorted, safePage]);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const activeFilterCount = useMemo(() => {
    const dateCount = filters.date instanceof Date ? 1 : 0;
    return filters.openClose.size + filters.result.size + filters.games.size + dateCount;
  }, [filters]);

  const openFilter = useCallback(() => {
    // sync current applied filters into draft
    setDraft({
      openClose: new Set(filters.openClose),
      result: new Set(filters.result),
      games: new Set(filters.games),
      date: filters.date instanceof Date ? new Date(filters.date) : null,
    });
    setIsFilterOpen(true);
  }, [filters]);

  const closeFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const applyFilter = useCallback(() => {
    setFilters({
      openClose: new Set(draft.openClose),
      result: new Set(draft.result),
      games: new Set(draft.games),
      date: draft.date instanceof Date ? new Date(draft.date) : null,
    });
    setIsFilterOpen(false);
    setPage(1);
  }, [draft]);

  const clearDraft = useCallback(() => {
    setDraft({
      openClose: new Set(),
      result: new Set(),
      games: new Set(),
      date: null,
    });
  }, []);

  const toggleDraftSet = useCallback((key, value) => {
    setDraft(prev => {
      const next = {
        openClose: new Set(prev.openClose),
        result: new Set(prev.result),
        games: new Set(prev.games),
        date: prev.date instanceof Date ? new Date(prev.date) : null,
      };
      const set = next[key];
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return next;
    });
  }, []);

  const loading = isLoadingBidHistory && sorted.length === 0;

  return (
    <LoadingView loading={loading}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ThemeHeader title={t('games:bidHistory')} />

        {/* Filter button kept inside screen (later can move into ThemeHeader) */}
        <View style={styles.filterBar}>
          <Pressable style={[styles.filterBtn, { backgroundColor: colors.primary }]} onPress={openFilter}>
            <View style={styles.filterBtnContent}>
              <MaterialCommunityIcons name="filter" size={30} color={colors.text} />
              {activeFilterCount ? (
                <View style={[styles.filterBadge, { backgroundColor: colors.background }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.primary }]}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </View>
        </Pressable>

        {activeFilterCount ? (
          <Pressable
            style={[styles.clearBtn, { backgroundColor: colors.surface }]}
            onPress={() => {
              setFilters({ openClose: new Set(), result: new Set(), games: new Set(), date: null });
              setPage(1);
            }}
          >
            <Text style={[styles.clearBtnText, { color: colors.text }]}>{t('screens:clear')}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <FlatList
            data={pageItems}
            keyExtractor={item => makeSig(item)}
            renderItem={({ item }) => <BidHistoryCard item={item} t={t} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                text={mobileNumber ? t('screens:noBidHistoryYet') : t('screens:userNotFound')}
              />
            }
          />
      </View>

      <PaginationBar
        page={`${safePage}/${totalPages}`}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && setPage(p => Math.max(1, p - 1))}
        onNext={() => hasNext && setPage(p => Math.min(totalPages, p + 1))}
      />

      {/* Filter Modal */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFilter}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeFilter} />

        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <Text style={styles.modalHeaderText}>{t('common:filter')}</Text>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Date filter row */}
            <DateFilterRow
              label={t('screens:byDate')}
              value={draft.date}
              onChange={date => setDraft(prev => ({ ...prev, date }))}
            />

            <View style={[styles.hr, { backgroundColor: colors.divider }]} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('screens:byGameType')}</Text>
            <View style={styles.row2Col}>
              <CheckRow
                label={t('games:open')}
                checked={draft.openClose.has('OPEN')}
                onToggle={() => toggleDraftSet('openClose', 'OPEN')}
              />
              <CheckRow
                label={t('games:close')}
                checked={draft.openClose.has('CLOSE')}
                onToggle={() => toggleDraftSet('openClose', 'CLOSE')}
              />
            </View>

            <View style={[styles.hr, { backgroundColor: colors.divider }]} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('screens:byWinningStatus')}</Text>
            <View style={styles.row3Col}>
              <CheckRow
                label={t('screens:win')}
                checked={draft.result.has('WIN')}
                onToggle={() => toggleDraftSet('result', 'WIN')}
              />
              <CheckRow
                label={t('screens:loose')}
                checked={draft.result.has('LOOSE')}
                onToggle={() => toggleDraftSet('result', 'LOOSE')}
              />
              <CheckRow
                label={t('screens:pending')}
                checked={draft.result.has('PENDING')}
                onToggle={() => toggleDraftSet('result', 'PENDING')}
              />
            </View>

            <View style={[styles.hr, { backgroundColor: colors.divider }]} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('screens:byGames')}</Text>
            <View style={styles.gamesWrap}>
              {allGames.length === 0 ? (
                <Text style={[styles.noGamesText, { color: colors.textSecondary }]}>{t('games:noGamesFound')}</Text>
              ) : (
                allGames.map(g => {
                  const checked = draft.games.has(g);
                  return (
                    <Pressable
                      key={g}
                      style={[styles.gameRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => toggleDraftSet('games', g)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: colors.textTertiary, backgroundColor: colors.background },
                          checked && [styles.checkboxOn, { borderColor: colors.primary, backgroundColor: colors.surface }],
                        ]}
                      >
                        {checked ? <Text style={[styles.tick, { color: colors.success }]}>✓</Text> : null}
                      </View>
                      <Text style={[styles.gameText, { color: colors.text }]} numberOfLines={1}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
            <Pressable style={[styles.footerBtnLeft, { backgroundColor: colors.primary }]} onPress={closeFilter}>
              <Text style={styles.footerBtnText}>{t('common:cancel')}</Text>
            </Pressable>

            <Pressable
              style={[styles.footerBtnMid, { backgroundColor: colors.primaryTile }]}
              onPress={clearDraft}
            >
              <Text style={styles.footerBtnText}>{t('screens:reset')}</Text>
            </Pressable>

            <Pressable style={[styles.footerBtnRight, { backgroundColor: colors.primary }]} onPress={applyFilter}>
              <Text style={styles.footerBtnText}>{t('common:filter')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </LoadingView>
  );
};

export default BidHistory;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
  },

  // ✅ filter bar (kept below header for now)
  filterBar: {
    position: 'absolute',
    top: 35,
    right: 25,
    zIndex: 10,
    flexDirection: 'row',
    paddingTop: 2 ,
    paddingBottom: 2,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
  },
  filterBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontWeight: '900',
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  clearBtnText: {
    fontWeight: '900',
  },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 110, // space for absolute PaginationBar
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontWeight: '700',
  },

  card: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,

    elevation: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },

  cardTop: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  rowTopMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  row3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },

  infoBlock: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },

  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    marginVertical: 12,
  },

  txnTime: {
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '700',
  },

  emptyWrap: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: '800',
  },

  // ✅ modal styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    marginHorizontal: 14,
    marginTop: 70,
    marginBottom: 70,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  modalBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    maxHeight: 520,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },

  row2Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  row3Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },

  hr: {
    height: 1,
    marginVertical: 12,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingVertical: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {},
  tick: {
    fontWeight: '900',
    marginTop: -1,
  },
  checkLabel: {
    fontWeight: '800',
    flex: 1,
  },

  gamesWrap: {
    gap: 10,
    paddingBottom: 8,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  gameText: {
    fontWeight: '900',
    flex: 1,
  },
  noGamesText: {
    fontWeight: '800',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  footerBtnLeft: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnMid: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnRight: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: '900',
  },
});