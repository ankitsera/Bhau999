import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import gamesData from "../../data/games.json"; // <-- static local JSON

const GREEN = "#3FA16C";
const RED = "#EF4B3E";

const GameCard = ({ item, navigation }) => (
  <TouchableOpacity style={styles.card}
    onPress={() => {
      navigation.navigate("Games Sub Types", { game: item })
    }}
  >
    <View style={styles.cardTop}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.closedText}>Closed for today</Text>
    </View>

    <View style={styles.cardBody}>
      <View style={{ flex: 1 }}>
        <Text style={styles.result}>{item.resultNumber}</Text>
        <View style={styles.timeRow}>
          <View>
            <Text style={styles.timeLabel}>Open Bids</Text>
            <Text style={styles.timeValue}>{item.openTime}</Text>
          </View>
          <View style={{ marginLeft: 18 }}>
            <Text style={styles.timeLabel}>Close Bids</Text>
            <Text style={styles.timeValue}>{item.closeTime}</Text>
          </View>
        </View>
      </View>

      <View style={styles.redCircle}>
        <MaterialCommunityIcons name="close" size={28} color="#fff" />
      </View>
    </View>
  </TouchableOpacity>
);

const GamesList = ({navigation}) => {
  return (
    <FlatList
      data={gamesData}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item }) => <GameCard item={item} navigation={navigation} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default GamesList;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#141414",
  },
  closedText: {
    color: RED,
    fontSize: 14,
    fontWeight: "800",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  result: {
    fontSize: 22,
    fontWeight: "900",
    color: GREEN,
  },
  timeRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: "#2c2c2c",
    fontWeight: "700",
  },
  timeValue: {
    fontSize: 14,
    color: "#2f2f2f",
    fontWeight: "600",
  },
  redCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
});