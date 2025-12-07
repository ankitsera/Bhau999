import React from "react";
import { View, StyleSheet, FlatList, StatusBar } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import SubGameTile from "../components/games/SubGameTile";
import { SUB_GAME_TYPES } from "../data/SubGameType";
import GreenHeader from "../components/GreenHeader";

const GREEN = "#3FA16C";

const GamesSubTypes = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // route.params.game can be the item you clicked in GamesList
  const game = route.params?.game;
  const title = game?.name || "GAME";

  const handlePressTile = (item) => {
    navigation.navigate(item.routeName, {
      game,
      subGameKey: item.key,
      modes: item.modes,
    });
  };

  const renderItem = ({ item }) => (
    <SubGameTile
      label={item.label}
      icon={item.icon}
      onPress={() => handlePressTile(item)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <GreenHeader title= {title} />

      <FlatList
        data={SUB_GAME_TYPES}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default GamesSubTypes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEFEF",
  },
  header: {
    height: 70,
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: "center",
  },
  gridContent: {
    marginTop: 8,
  },
});