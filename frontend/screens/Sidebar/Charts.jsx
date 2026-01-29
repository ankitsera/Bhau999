import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import GreenHeader from "../../components/GreenHeader";
import EmptyState from "../../components/EmptyState";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#336952";

const ROWS = [
  {
    id: "Matka Chart",
    title: "Matka Chart",
    subtitle: "Jodi and Panel chart Result",
    icon: "chart-areaspline",
  },
  // {
  //   id: "Starline Chart",
  //   title: "Starline Chart",
  //   subtitle: "Starline Chart Date Time wise",
  //   icon: "star-outline",
  // },
  // {
  //   id: "Jackpot Chart",
  //   title: "Jackpot Chart",
  //   subtitle: "Jackpot Chart Date Time wise",
  //   icon: "trophy-variant-outline",
  // },
];

const Row = ({ item, navigation }) => {
  const handlePress = () => {
    if (item.id && navigation) {
      try {
        navigation.navigate(item.id, { name: item.id });
      } catch (error) {
        // Navigation failed - handle gracefully
        console.warn(`Navigation to ${item.id} failed:`, error);
      }
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handlePress}>
      <View style={styles.leftIconWrap}>
        <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.chevWrap}>
        <MaterialCommunityIcons name="chevron-right" size={26} color="#444" />
      </View>
    </TouchableOpacity>
  );
};

const Charts = ({ navigation }) => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <View style={styles.container}>
      <GreenHeader title="Game Chart" />
      {selectedId ? (
        <EmptyState
          icon="folder-alert-outline"
          message={`No chart available for ${selectedId}`}
        />
      ) : (
        <FlatList
          data={ROWS}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <Row item={item} navigation={navigation} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Charts;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F3F3" 
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  leftIconWrap: {
    width: 44, 
    height: 44, 
    borderRadius: 22,
    backgroundColor: GREEN, 
    alignItems: "center", 
    justifyContent: "center",
    marginRight: 12,
  },
  title: { 
    color: "#111", 
    fontSize: 20, 
    fontWeight: "800" 
  },
  subtitle: { 
    color: "#333", 
    marginTop: 2 
  },
  chevWrap: {
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: "#F1F1F1",
    alignItems: "center", 
    justifyContent: "center", 
    marginLeft: 12,
  },
});