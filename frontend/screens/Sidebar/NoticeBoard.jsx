import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import GreenHeader from "../../components/GreenHeader";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#3FA16C";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://example.com/api";

const Section = ({ title, points }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>

    {points?.length ? (
      points.map((p, idx) => (
        <View key={idx} style={styles.pointRow}>
          <MaterialCommunityIcons
            name="thumb-up-outline"
            size={18}
            color="#E39D05"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.pointText}>{p}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.sectionText}>No details available</Text>
    )}
  </View>
);

const NoticeBoard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");

  const fetchNotices = async () => {
    setError("");
    try {
      setLoading(true);
      // Expected response shape:
      // [{ title: "Withdraw information", points: ["line1","line2",...] }, ...]
      const res = await fetch(`${API_URL}/noticeboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Unable to load notice board data");
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  return (
    <View style={styles.container}>
      <GreenHeader title="Notice Board" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchNotices} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {sections.length > 0 ? (
            sections.map((section, idx) => (
              <React.Fragment key={idx}>
                <Section title={section.title} points={section.points} />
                {idx !== sections.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.center}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={70}
                color="#555"
              />
              <Text style={styles.emptyText}>No notices found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default NoticeBoard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: { color: "#c0392b", marginBottom: 12 },
  retryBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: "#fff", fontWeight: "700" },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    lineHeight: 22,
  },
  divider: {
    height: 2,
    backgroundColor: "#00000030",
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#444",
    marginTop: 10,
  },
});