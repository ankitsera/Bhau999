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
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import GreenHeader from '../components/GreenHeader';
import PaginationBar from '../components/PaginationBar';

import { AuthContext } from '../contexts/AuthContext';
import { GameContext } from '../contexts/GameContext';

const GREEN = '#3FA16C';
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

// ✅ normalize result for filtering + UI
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
  return oc ? `${name}  (${oc})` : name;
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
  return (
    <View
      style={[
        styles.infoBlock,
        align === 'center' && styles.center,
        align === 'right' && styles.right,
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const BidHistoryCard = ({ item }) => {
  const gameType = String(item?.type || '--');
  const digit = item?.betValue ?? item?.bet_value ?? '--';
  const points = item?.amount ?? '--';
  const bidId = item?.id ?? '--';

  const dt = parseLocalDateTime(item?.betTime || item?.bet_time);
  const bidDate = dt ? formatDatePretty(dt) : '--';
  const txnTime = dt ? formatTime12h(dt) : '--:--';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTopTitle}>{buildTitle(item)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.rowTopMeta}>
          <ResultPill result={item?.result} />
        </View>

        <View style={styles.row3}>
          <InfoBlock label="Game Type" value={gameType} align="left" />
          <InfoBlock label="Digit" value={String(digit)} align="center" />
          <InfoBlock label="Points" value={String(points)} align="right" />
        </View>

        <View style={styles.divider} />

        <View style={styles.row2}>
          <InfoBlock label="Bid Id" value={String(bidId)} align="left" />
          <InfoBlock label="Bid Date" value={bidDate} align="right" />
        </View>

        <Text style={styles.txnTime}>Transaction Time : {txnTime}</Text>
      </View>
    </View>
  );
};

const EmptyState = ({ text }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

// ✅ tiny checkbox (no extra deps)
const CheckRow = ({ label, checked, onToggle }) => {
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.tick}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

// ✅ maps UI filters to actual backend values
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
  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { bidHistory, isLoadingBidHistory, loadBidHistoryByUser } =
    useContext(GameContext);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Filter modal state (kept in-screen for now; later can move into GreenHeader)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ✅ applied filters (these affect list)
  const [filters, setFilters] = useState({
    openClose: new Set(), // "OPEN","CLOSE"
    result: new Set(), // "WIN","LOOSE","PENDING"
    games: new Set(), // "TIME BAZAR", ...
  });

  // ✅ draft filters (used inside modal before hitting "Filter")
  const [draft, setDraft] = useState({
    openClose: new Set(),
    result: new Set(),
    games: new Set(),
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

  // ✅ list of games for filter UI (from what we received)
  const allGames = useMemo(() => {
    const arr = Array.isArray(bidHistory) ? bidHistory : [];
    const set = new Set();
    for (let i = 0; i < arr.length; i++) {
      const name = String(arr[i]?.gameName || '').trim().toUpperCase();
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [bidHistory]);

  // ✅ apply filters BEFORE dedupe/sort/pagination so UX is clean
  const filteredRaw = useMemo(() => {
    const arr = Array.isArray(bidHistory) ? bidHistory : [];
    if (
      filters.openClose.size === 0 &&
      filters.result.size === 0 &&
      filters.games.size === 0
    ) {
      return arr;
    }

    return arr.filter(it => {
      if (!matchesResultFilter(it, filters.result)) return false;
      if (!matchesOpenCloseFilter(it, filters.openClose)) return false;
      if (!matchesGameFilter(it, filters.games)) return false;
      return true;
    });
  }, [bidHistory, filters]);

  // ✅ dedupe + sort (this fixes your "same key" warning AND duplicate cards)
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

  // ✅ keep page valid when data size changes (prevents 5/1 weirdness)
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
    return filters.openClose.size + filters.result.size + filters.games.size;
  }, [filters]);

  const openFilter = useCallback(() => {
    // sync current applied filters into draft
    setDraft({
      openClose: new Set(filters.openClose),
      result: new Set(filters.result),
      games: new Set(filters.games),
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
    });
    setIsFilterOpen(false);
    setPage(1);
  }, [draft]);

  const clearDraft = useCallback(() => {
    setDraft({
      openClose: new Set(),
      result: new Set(),
      games: new Set(),
    });
  }, []);

  const toggleDraftSet = useCallback((key, value) => {
    setDraft(prev => {
      const next = {
        openClose: new Set(prev.openClose),
        result: new Set(prev.result),
        games: new Set(prev.games),
      };
      const set = next[key];
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <GreenHeader title="Bid History" />

      {/* ✅ Filter button kept inside screen (later can move into GreenHeader) */}
      <View style={styles.filterBar}>
        <Pressable style={styles.filterBtn} onPress={openFilter}>
          <View style={styles.filterBtnContent}>
            <Ionicons name="funnel-sharp" size={24} color="black" />
            {activeFilterCount ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        {activeFilterCount ? (
          <Pressable
            style={styles.clearBtn}
            onPress={() => {
              setFilters({ openClose: new Set(), result: new Set(), games: new Set() });
              setPage(1);
            }}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        {isLoadingBidHistory && sorted.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={GREEN} />
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={pageItems}
            keyExtractor={item => makeSig(item)}
            renderItem={({ item }) => <BidHistoryCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                text={mobileNumber ? 'No bid history yet' : 'User not found'}
              />
            }
          />
        )}
      </View>

      <PaginationBar
        page={`${safePage}/${totalPages}`}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && setPage(p => Math.max(1, p - 1))}
        onNext={() => hasNext && setPage(p => Math.min(totalPages, p + 1))}
      />

      {/* ✅ Filter Modal */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFilter}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeFilter} />

        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Filter Type</Text>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>By Game Type</Text>
            <View style={styles.row2Col}>
              <CheckRow
                label="Open"
                checked={draft.openClose.has('OPEN')}
                onToggle={() => toggleDraftSet('openClose', 'OPEN')}
              />
              <CheckRow
                label="Close"
                checked={draft.openClose.has('CLOSE')}
                onToggle={() => toggleDraftSet('openClose', 'CLOSE')}
              />
            </View>

            <View style={styles.hr} />

            <Text style={styles.sectionTitle}>By Winning Status</Text>
            <View style={styles.row3Col}>
              <CheckRow
                label="Win"
                checked={draft.result.has('WIN')}
                onToggle={() => toggleDraftSet('result', 'WIN')}
              />
              <CheckRow
                label="Loose"
                checked={draft.result.has('LOOSE')}
                onToggle={() => toggleDraftSet('result', 'LOOSE')}
              />
              <CheckRow
                label="Pending"
                checked={draft.result.has('PENDING')}
                onToggle={() => toggleDraftSet('result', 'PENDING')}
              />
            </View>

            <View style={styles.hr} />

            <Text style={styles.sectionTitle}>By Games</Text>
            <View style={styles.gamesWrap}>
              {allGames.length === 0 ? (
                <Text style={styles.noGamesText}>No games found</Text>
              ) : (
                allGames.map(g => {
                  const checked = draft.games.has(g);
                  return (
                    <Pressable
                      key={g}
                      style={styles.gameRow}
                      onPress={() => toggleDraftSet('games', g)}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked ? <Text style={styles.tick}>✓</Text> : null}
                      </View>
                      <Text style={styles.gameText} numberOfLines={1}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable style={styles.footerBtnLeft} onPress={closeFilter}>
              <Text style={styles.footerBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={styles.footerBtnMid}
              onPress={clearDraft}
            >
              <Text style={styles.footerBtnText}>Reset</Text>
            </Pressable>

            <Pressable style={styles.footerBtnRight} onPress={applyFilter}>
              <Text style={styles.footerBtnText}>Filter</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BidHistory;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  body: {
    flex: 1,
  },

  // ✅ filter bar (kept below header for now)
  filterBar: {
    position: 'absolute',
    top: 45,
    right: 25,
    zIndex: 10,
    flexDirection: 'row',
    paddingTop: 2 ,
    paddingBottom: 2,
  },
  filterBtn: {
    backgroundColor: GREEN,
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
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: GREEN,
    fontWeight: '900',
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#EAEAEA',
  },
  clearBtnText: {
    color: '#111',
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
    color: '#111',
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,

    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },

  cardTop: {
    backgroundColor: '#3FA16C',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopTitle: {
    color: '#111',
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
    color: '#777',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoValue: {
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 12,
  },

  txnTime: {
    marginTop: 10,
    textAlign: 'center',
    color: '#777',
    fontWeight: '700',
  },

  emptyWrap: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#444',
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
    backgroundColor: '#F0F0F0',
  },
  modalHeader: {
    backgroundColor: '#3FA16C',
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
    color: '#111',
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
    backgroundColor: '#D8D8D8',
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
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: {
    borderColor: '#3FA16C',
    backgroundColor: '#E9FFF2',
  },
  tick: {
    fontWeight: '900',
    color: '#0E8F4D',
    marginTop: -1,
  },
  checkLabel: {
    fontWeight: '800',
    color: '#111',
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
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  gameText: {
    fontWeight: '900',
    color: '#111',
    flex: 1,
  },
  noGamesText: {
    color: '#555',
    fontWeight: '800',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#F0F0F0',
  },
  footerBtnLeft: {
    flex: 1,
    backgroundColor: '#3FA16C',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnMid: {
    flex: 1,
    backgroundColor: '#2F7A54',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnRight: {
    flex: 1,
    backgroundColor: '#3FA16C',
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