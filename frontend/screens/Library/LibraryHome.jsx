import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  StatusBar,
  BackHandler,
  Linking,
  Alert,
  FlatList,
  ScrollView,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getWhatsappSupport } from "../../utils/AppConfigService";
import SideBarNavigation from "../../components/SideBarNavigation";
import BookCover from "../../components/library/BookCover";
import { BOOKS, BOOK_CATEGORIES } from "../../data/books";
import { FONT } from '../../contexts/Themes';

const ALL = "__all__";
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

// Home screen for limited-view users: a free reading library instead of the games list.
const LibraryHome = ({ navigation }) => {
  const { t } = useTranslation(["library", "common"]);
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { user, refreshBalance } = useContext(AuthContext);

  const [isSideBarVisible, setIsSideBarVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [whatsappPhone, setWhatsappPhone] = useState("");

  const searchRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    getWhatsappSupport()
      .then((wa) => wa && setWhatsappPhone(String(wa)))
      .catch(() => {});
  }, []);

  // Re-read the account on focus so an admin switch back to the full view lands here too.
  useFocusEffect(
    useCallback(() => {
      refreshBalance?.();
    }, [refreshBalance]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (Platform.OS === "android") {
          Alert.alert(t("common:quit"), t("common:quitMessage"), [
            { text: t("common:cancel"), style: "cancel" },
            { text: t("common:quit"), style: "destructive", onPress: () => BackHandler.exitApp() },
          ]);
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [t]),
  );

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BOOKS.filter(
      (b) =>
        (category === ALL || b.category === category) &&
        (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const scrollToTop = () => listRef.current?.scrollToOffset({ offset: 0, animated: true });

  const showLibrary = () => {
    setQuery("");
    setCategory(ALL);
    searchRef.current?.blur();
    scrollToTop();
  };

  const showSearch = () => {
    scrollToTop();
    searchRef.current?.focus();
  };

  const openSupport = () => {
    const digits = String(whatsappPhone).replace(/\D/g, "");
    if (!digits) return;
    Linking.openURL(`https://wa.me/91${digits}`).catch(() => {});
  };

  const firstName = String(user?.username || "").trim().split(/\s+/)[0];

  const renderBook = ({ item }) => (
    <Pressable
      style={styles.bookCell}
      onPress={() => navigation.navigate("Book Details", { bookId: item.id })}
    >
      <BookCover book={item} />
      <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.bookAuthor, { color: colors.textTertiary }]} numberOfLines={1}>
        {item.author}
      </Text>
      <View style={styles.bookMeta}>
        <View style={[styles.freeTag, { backgroundColor: colors.primaryIconBg }]}>
          <Text style={[styles.freeText, { color: colors.primaryDark }]}>{t("library:free")}</Text>
        </View>
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          {t("library:minRead", { count: item.readMinutes })}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary, paddingTop: STATUS_BAR_HEIGHT },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Modal
        visible={isSideBarVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setIsSideBarVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.sidebar, { backgroundColor: colors.background }]}>
            <SideBarNavigation
              navigation={navigation}
              closeSidebar={() => setIsSideBarVisible(false)}
            />
          </View>
          <Pressable style={styles.overlay} onPress={() => setIsSideBarVisible(false)} />
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.menuPill}
          onPress={() => setIsSideBarVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons name="menu" size={22} color={colors.onPrimary} />
          <MaterialCommunityIcons name="bookshelf" size={24} color={colors.onPrimary} />
          <Text style={[styles.headerTitle, { color: colors.onPrimary }]}>{t("library:title")}</Text>
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Text style={[styles.greetingTitle, { color: colors.onPrimary }]} numberOfLines={1}>
          {firstName ? t("library:greeting", { name: firstName }) : t("library:title")}
        </Text>
        <Text style={[styles.greetingSub, { color: colors.onPrimary }]}>{t("library:tagline")}</Text>
      </View>

      {/* Rounded sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textTertiary} />
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder={t("library:searchPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {[ALL, ...BOOK_CATEGORIES].map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.onPrimary : colors.textSecondary },
                    ]}
                  >
                    {c === ALL ? t("library:all") : c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          ref={listRef}
          data={books}
          keyExtractor={(b) => b.id}
          renderItem={renderBook}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>
              {category === ALL ? t("library:allBooks") : category}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="book-search-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t("library:noBooks")}</Text>
            </View>
          }
        />
      </View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, paddingBottom: bottom + 8 },
        ]}
      >
        <FooterTab icon="bookshelf" label={t("library:title")} active onPress={showLibrary} colors={colors} />
        <FooterTab icon="magnify" label={t("library:search")} onPress={showSearch} colors={colors} />
        <FooterTab icon="whatsapp" label={t("library:support")} onPress={openSupport} colors={colors} />
      </View>
    </View>
  );
};

const FooterTab = ({ icon, label, active = false, onPress, colors }) => (
  <Pressable style={styles.tab} onPress={onPress}>
    <MaterialCommunityIcons
      name={icon}
      size={26}
      color={active ? colors.primary : colors.textTertiary}
    />
    <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textTertiary }]}>
      {label}
    </Text>
  </Pressable>
);

export default LibraryHome;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  menuPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.75)",
  },
  headerTitle: {
    fontSize: FONT.title,
    fontWeight: "800",
  },

  greeting: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  greetingTitle: {
    fontSize: FONT.h2,
    fontWeight: "800",
  },
  greetingSub: {
    marginTop: 2,
    fontSize: FONT.label,
    opacity: 0.9,
  },

  sheet: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
    paddingTop: 18,
  },
  searchBar: {
    marginHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.label,
    paddingVertical: 0,
  },
  chips: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
  },
  chipText: {
    fontSize: FONT.caption,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT.title,
    fontWeight: "800",
    marginBottom: 12,
  },
  row: {
    gap: 16,
  },
  bookCell: {
    flex: 1,
    maxWidth: "50%",
    marginBottom: 22,
  },
  bookTitle: {
    marginTop: 10,
    fontSize: FONT.label,
    fontWeight: "700",
    lineHeight: 17,
  },
  bookAuthor: {
    marginTop: 2,
    fontSize: 12,
  },
  bookMeta: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  freeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  metaText: {
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    paddingTop: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: FONT.label,
  },

  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "70%",
    height: "100%",
    zIndex: 51,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 50,
  },
});
