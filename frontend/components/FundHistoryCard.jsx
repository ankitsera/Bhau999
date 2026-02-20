import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeColor } from "../contexts/Themes";

const STATUS_COLORS = {
  pending: "#F29F05",
  success: "#2E7D32",
  failed: "#D32F2F",
};

const FundHistoryCard = ({
  createdAt,        // string like "10/11/2025 11:19 PM"
  status = "pending", // 'pending' | 'success' | 'failed'
  amount = 0,         // number or string
  orderId = "",
  requestType = "Credit",
  depositMode = "UPI / Bank",
}) => {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

  const statusIcon =
    status === "success" ? "check-decagram-outline"
    : status === "failed" ? "close-octagon-outline"
    : "timer-sand-complete"; // pending

  const statusText =
    status === "success" ? "Success"
    : status === "failed" ? "Failed"
    : "Pending";

  return (
    <View style={styles.card}>
      {/* top row: date + status */}
      <View style={styles.topRow}>
        <Text style={styles.date}>{createdAt}</Text>

        <View style={styles.statusWrap}>
          <MaterialCommunityIcons name={statusIcon} size={16} color={color} />
          <Text style={[styles.statusText, { color }]}>{statusText}</Text>
        </View>
      </View>

      {/* amount + order id */}
      <View style={styles.amountRow}>
        <Text style={styles.amount}>₹{amount}</Text>

        <View style={{ flex: 1 }} />

        <View>
          <Text style={styles.metaLabel}>Order id</Text>
          <Text style={styles.orderId}>{orderId}</Text>
        </View>
      </View>

      <View style={styles.hr} />

      {/* request type + deposit mode */}
      <View style={styles.bottomRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Request Type</Text>
          <Text style={styles.metaValue}>{requestType}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Deposit Mode</Text>
          <Text style={styles.metaValue}>{depositMode}</Text>
        </View>
      </View>
    </View>
  );
};

export default FundHistoryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    color: "#222",
    fontSize: 13,
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
    backgroundColor: "transparent",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  amount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
  },
  metaLabel: {
    color: "#666",
    fontSize: 12,
  },
  orderId: {
    color: "#111",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

  hr: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 10,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaBlock: {
    width: "48%",
  },
  metaValue: {
    color: "#111",
    fontWeight: "800",
    marginTop: 2,
  },
});