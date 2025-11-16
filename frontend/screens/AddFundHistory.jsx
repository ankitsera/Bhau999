import React, { useMemo, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import GreenHeader from "../components/GreenHeader";
import FundHistoryCard from "../components/FundHistoryCard";
import PaginationBar from "../components/PaginationBar";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 10;

const mockData = Array.from({ length: 23 }).map((_, i) => ({
  id: `txn_${i + 1}`,
  createdAt: "10/11/2025 11:19 PM",
  status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "success" : "failed",
  amount: [1000, 500, 2000, 1500][i % 4],
  orderId: `NPTXN2025111023${(1900 + i).toString().padStart(4, "0")}`,
  requestType: "Credit",
  depositMode: "UPI / Bank",
}));

const AddFundHistory = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const showEmpty = mockData.length === 1;

  const totalPages = Math.ceil(mockData.length / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const visibleRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return mockData.slice(start, start + PAGE_SIZE);
  }, [page]);

  return (
    <View style={styles.container}>
      <GreenHeader navigation={navigation} title="Add Fund History" />

      {showEmpty ? (
        <EmptyState message="NO FUND HISTORY FOUND" />
      ) : (
        <>
            <FlatList
                data={visibleRows}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                <FundHistoryCard
                    createdAt={item.createdAt}
                    status={item.status}
                    amount={item.amount}
                    orderId={item.orderId}
                    requestType={item.requestType}
                    depositMode={item.depositMode}
                />
                )}
                showsVerticalScrollIndicator={false}
            />
        </>
      )}
      <PaginationBar
        page={page}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && setPage((p) => p - 1)}
        onNext={() => hasNext && setPage((p) => p + 1)}
      />
    </View>
  );
};

export default AddFundHistory;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  listContent: { padding: 12, paddingBottom: 120 },
});