import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeHeader from "../../components/ThemeHeader";
import BookCover from "../../components/library/BookCover";
import { getBookById } from "../../data/books";
import { FONT } from '../../contexts/Themes';

const BookDetails = ({ navigation, route }) => {
  const { t } = useTranslation(["library"]);
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const book = getBookById(route?.params?.bookId);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t("library:title")} />
      </View>
    );
  }

  const openChapter = (chapterIndex) =>
    navigation.navigate("Book Reader", { bookId: book.id, chapterIndex });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={book.title} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BookCover book={book} size="large" />
          <Text style={[styles.title, { color: colors.heading }]}>{book.title}</Text>
          <Text style={[styles.author, { color: colors.textTertiary }]}>{book.author}</Text>

          <View style={styles.stats}>
            <Stat icon="tag-outline" label={t("library:free")} colors={colors} />
            <Stat icon="shape-outline" label={book.category} colors={colors} />
            <Stat
              icon="clock-outline"
              label={t("library:minRead", { count: book.readMinutes })}
              colors={colors}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.heading }]}>{t("library:about")}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{book.description}</Text>

        <Text style={[styles.sectionTitle, { color: colors.heading }]}>
          {t("library:contents")}
        </Text>
        {book.chapters.map((chapter, index) => (
          <Pressable
            key={chapter.title}
            onPress={() => openChapter(index)}
            style={[styles.chapterRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            <View style={[styles.chapterNumber, { backgroundColor: colors.primaryIconBg }]}>
              <Text style={[styles.chapterNumberText, { color: colors.primaryDark }]}>{index + 1}</Text>
            </View>
            <View style={styles.chapterText}>
              <Text style={[styles.chapterLabel, { color: colors.textTertiary }]}>
                {t("library:chapter", { number: index + 1 })}
              </Text>
              <Text style={[styles.chapterTitle, { color: colors.text }]} numberOfLines={1}>
                {chapter.title}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, paddingBottom: bottom + 12 },
        ]}
      >
        <Pressable
          style={[styles.readBtn, { backgroundColor: colors.primary }]}
          onPress={() => openChapter(0)}
        >
          <MaterialCommunityIcons name="book-open-variant" size={22} color={colors.onPrimary} />
          <Text style={[styles.readText, { color: colors.onPrimary }]}>{t("library:readNow")}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const Stat = ({ icon, label, colors }) => (
  <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
    <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
    <Text style={[styles.statText, { color: colors.textSecondary }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

export default BookDetails;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  hero: {
    alignItems: "center",
    paddingTop: 8,
  },
  title: {
    marginTop: 18,
    fontSize: FONT.h3,
    fontWeight: "800",
    textAlign: "center",
  },
  author: {
    marginTop: 4,
    fontSize: FONT.label,
  },
  stats: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: FONT.subtitle,
    fontWeight: "800",
  },
  description: {
    fontSize: FONT.label,
    lineHeight: 19,
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumberText: {
    fontSize: FONT.label,
    fontWeight: "800",
  },
  chapterText: {
    flex: 1,
  },
  chapterLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  chapterTitle: {
    fontSize: FONT.label,
    fontWeight: "700",
    marginTop: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  readBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  readText: {
    fontSize: FONT.body,
    fontWeight: "800",
  },
});
