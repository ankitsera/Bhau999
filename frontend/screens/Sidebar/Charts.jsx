import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import ThemeHeader from "../../components/ThemeHeader";
import EmptyState from "../../components/EmptyState";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

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
  const { colors } = useTheme();

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
    <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]} onPress={handlePress}>
      <View style={[styles.leftIconWrap, { backgroundColor: colors.primary }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
      </View>
      <View style={[styles.chevWrap, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const Charts = ({ navigation }) => {
  const { colors } = useTheme();

  const [selectedId, setSelectedId] = useState(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title="Game Chart" />
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
    flex: 1
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  leftIconWrap: {
    width: 44, 
    height: 44, 
    borderRadius: 22,
    alignItems: "center", 
    justifyContent: "center",
    marginRight: 12,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "500" 
  },
  subtitle: { 
    marginTop: 2,
    fontSize: 12,
  },
  chevWrap: {
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    alignItems: "center", 
    justifyContent: "center", 
    marginLeft: 12,
  },
});