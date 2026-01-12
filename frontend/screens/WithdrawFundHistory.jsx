import React, {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
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
import { useFocusEffect } from '@react-navigation/native';

import GreenHeader from '../components/GreenHeader';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';

import { AuthContext } from '../contexts/AuthContext';
import { PaymentsContext } from '../contexts/PaymentsContext';

const PAGE_SIZE = 10;

const parseTxDateTime = (txDate, txTime) => {
  if (!txDate) return null;
  const [y, m, d] = String(txDate).split('-').map(Number);
  if (![y, m, d].every(Number.isFinite)) return null;

  const rawTime = String(txTime || '00:00:00');
  const timePart = rawTime.split('.')[0];
  const [hh, mm, ss] = timePart.split(':').map(Number);

  return new Date(
    y,
    (m || 1) - 1,
    d || 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    Number.isFinite(ss) ? ss : 0,
  );
};

const formatDate = dt => {
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
  return `${String(dt.getDate()).padStart(2, '0')} ${
    months[dt.getMonth()] || '--'
  } ${dt.getFullYear()}`;
};

const formatTime = dt => {
  if (!(dt instanceof Date)) return '--:--';
  let h = dt.getHours();
  const m = String(dt.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const makeKey = (x, idx) =>
  `${x?.id ?? 'noid'}_${x?.txDate ?? 'nod'}_${x?.txTime ?? 'not'}_${
    x?.amount ?? 'noa'
  }_${idx}`;

const isPending = s =>
  String(s || '')
    .toLowerCase()
    .includes('pend');
const isAccepted = s =>
  String(s || '')
    .toLowerCase()
    .includes('accept');

const WithdrawCard = ({ item, GREEN }) => {
  const id = item?.id ?? '--';
  const amountNum = Number(item?.amount || 0) || 0;
  const showAmt = Math.abs(amountNum);

  const status = item?.status ? String(item.status) : 'Pending';
  const remark = item?.remarks != null ? String(item.remarks) : '';
  const mode = item?.initiator ? String(item.initiator) : 'Other';

  const dt = parseTxDateTime(item?.txDate, item?.txTime);

  const leftColor = isPending(status) ? '#C62828' : GREEN;
  const rightColor = isAccepted(status)
    ? GREEN
    : isPending(status)
    ? '#C62828'
    : '#777';

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={[styles.id, { color: leftColor }]} numberOfLines={1}>
          {id}
        </Text>
        <Text style={[styles.amt, { color: leftColor }]} numberOfLines={1}>
          ₹{showAmt}
        </Text>
      </View>

      <View style={styles.mid}>
        <Text style={styles.text}>Payment Mode: {mode}</Text>
        <Text style={[styles.status, { color: rightColor }]}>{status}</Text>
      </View>

      {remark ? <Text style={styles.text}>Remark: {remark}</Text> : null}

      <Text style={styles.date}>
        {formatDate(dt)} • {formatTime(dt)}
      </Text>
    </View>
  );
};

const WithdrawFundHistory = () => {
  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { GREEN, withdrawals, isLoadingWithdrawals, loadWithdrawals } =
    useContext(PaymentsContext);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const didFetchOnFocusRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!mobileNumber) return;
    await loadWithdrawals?.();
  }, [mobileNumber, loadWithdrawals]);

  useFocusEffect(
    useCallback(() => {
      if (!didFetchOnFocusRef.current) {
        didFetchOnFocusRef.current = true;
        fetchData();
      }
      return () => {
        didFetchOnFocusRef.current = false;
      };
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(withdrawals) ? withdrawals : [];
    return arr.slice().sort((a, b) => {
      const ta = parseTxDateTime(a?.txDate, a?.txTime)?.getTime?.() || 0;
      const tb = parseTxDateTime(b?.txDate, b?.txTime)?.getTime?.() || 0;
      if (ta !== tb) return tb - ta;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [withdrawals]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePage]);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <View style={styles.container}>
      <GreenHeader title="Withdraw Fund History" />

      {isLoadingWithdrawals && sorted.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={GREEN} />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      ) : sorted.length === 0 ? (
        <EmptyState message="NO WITHDRAW HISTORY FOUND" />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item, idx) => makeKey(item, idx)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <WithdrawCard item={item} GREEN={GREEN} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <PaginationBar
        page={`${safePage}/${totalPages}`}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && setPage(p => p - 1)}
        onNext={() => hasNext && setPage(p => p + 1)}
      />
    </View>
  );
};

export default WithdrawFundHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  listContent: {
    padding: 12,
    paddingBottom: 120,
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },

  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  id: {
    fontSize: 16,
    fontWeight: '900',
  },
  amt: {
    fontSize: 16,
    fontWeight: '900',
  },

  mid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  text: {
    color: '#111',
    fontWeight: '800',
  },
  status: {
    fontWeight: '900',
  },

  date: {
    marginTop: 8,
    color: '#111',
    fontWeight: '800',
  },
});
