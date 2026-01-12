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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import GreenHeader from '../components/GreenHeader';
import PaginationBar from '../components/PaginationBar';

import { AuthContext } from '../contexts/AuthContext';
import { GameContext } from '../contexts/GameContext';

const GREEN = '#3FA16C';
const PAGE_SIZE = 6;

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

const BidHistory = () => {
  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { bidHistory, isLoadingBidHistory, loadBidHistoryByUser } =
    useContext(GameContext);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

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

  // ✅ dedupe + sort (this fixes your "same key" warning AND duplicate cards)
  const sorted = useMemo(() => {
    const arr = Array.isArray(bidHistory) ? bidHistory : [];

    const seen = new Set();
    const uniq = [];
    for (let i = 0; i < arr.length; i++) {
      const sig = makeSig(arr[i]);
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniq.push(arr[i]);
    }

    return uniq.sort(sortNewestFirst);
  }, [bidHistory]);

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

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <GreenHeader title="Bid History" />

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
});
