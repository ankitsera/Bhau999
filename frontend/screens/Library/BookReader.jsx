import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeHeader from "../../components/ThemeHeader";
import { getBookById } from "../../data/books";
import { FONT } from '../../contexts/Themes';

const MIN_FONT = 14;
const MAX_FONT = 26;
const SEPIA = { page: "#F4ECD8", text: "#4B3A2A", muted: "#8A7660" };

const BookReader = ({ navigation, route }) => {
  const { t } = useTranslation(["library"]);
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const book = getBookById(route?.params?.bookId);

  const [chapterIndex, setChapterIndex] = useState(route?.params?.chapterIndex || 0);
  const [fontSize, setFontSize] = useState(18);
  const [sepia, setSepia] = useState(false);
  const scrollRef = useRef(null);

  // a new chapter starts at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [chapterIndex]);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t("library:title")} />
      </View>
    );
  }

  const chapter = book.chapters[chapterIndex] || book.chapters[0];
  const isFirst = chapterIndex === 0;
  const isLast = chapterIndex >= book.chapters.length - 1;

  const pageColor = sepia ? SEPIA.page : colors.background;
  const textColor = sepia ? SEPIA.text : colors.text;
  const mutedColor = sepia ? SEPIA.muted : colors.textTertiary;

  const controls = (
    <View style={styles.controls}>
      <ControlButton
        icon="format-font-size-decrease"
        disabled={fontSize <= MIN_FONT}
        onPress={() => setFontSize((s) => Math.max(MIN_FONT, s - 2))}
        colors={colors}
      />
      <ControlButton
        icon="format-font-size-increase"
        disabled={fontSize >= MAX_FONT}
        onPress={() => setFontSize((s) => Math.min(MAX_FONT, s + 2))}
        colors={colors}
      />
      <ControlButton
        icon={sepia ? "white-balance-sunny" : "coffee-outline"}
        onPress={() => setSepia((v) => !v)}
        colors={colors}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: pageColor }]}>
      <ThemeHeader title={book.title} right={controls} />

      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: pageColor }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.chapterLabel, { color: mutedColor }]}>
          {t("library:chapter", { number: chapterIndex + 1 })}
        </Text>
        <Text style={[styles.chapterTitle, { color: textColor }]}>{chapter.title}</Text>

        {chapter.body.split("\n\n").map((para, i) => (
          <Text
            key={i}
            style={[
              styles.paragraph,
              { color: textColor, fontSize, lineHeight: Math.round(fontSize * 1.6) },
            ]}
          >
            {para}
          </Text>
        ))}

        {isLast ? (
          <View style={[styles.endCard, { borderColor: mutedColor }]}>
            <MaterialCommunityIcons name="book-check-outline" size={32} color={colors.primary} />
            <Text style={[styles.endText, { color: textColor }]}>{t("library:theEnd")}</Text>
            <Pressable
              style={[styles.endBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={[styles.endBtnText, { color: colors.onPrimary }]}>
                {t("library:backToLibrary")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.pager,
          { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, paddingBottom: bottom + 10 },
        ]}
      >
        <PagerButton
          icon="chevron-left"
          label={t("library:previous")}
          disabled={isFirst}
          onPress={() => setChapterIndex((i) => i - 1)}
          colors={colors}
        />
        <Text style={[styles.pagerCount, { color: colors.textTertiary }]}>
          {chapterIndex + 1} / {book.chapters.length}
        </Text>
        <PagerButton
          icon="chevron-right"
          label={t("library:next")}
          iconRight
          disabled={isLast}
          onPress={() => setChapterIndex((i) => i + 1)}
          colors={colors}
        />
      </View>
    </View>
  );
};

const ControlButton = ({ icon, onPress, disabled = false, colors }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={6}
    style={[
      styles.controlBtn,
      { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      disabled && styles.disabled,
    ]}
  >
    <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
  </Pressable>
);

const PagerButton = ({ icon, label, onPress, disabled, iconRight = false, colors }) => {
  const color = disabled ? colors.textTertiary : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.pagerBtn, disabled && styles.disabled]}
    >
      {!iconRight && <MaterialCommunityIcons name={icon} size={24} color={color} />}
      <Text style={[styles.pagerText, { color }]}>{label}</Text>
      {iconRight && <MaterialCommunityIcons name={icon} size={24} color={color} />}
    </Pressable>
  );
};

export default BookReader;

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 32,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  chapterTitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: FONT.h2,
    fontWeight: "800",
  },
  paragraph: {
    marginBottom: 16,
  },
  endCard: {
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 10,
  },
  endText: {
    fontSize: FONT.label,
    textAlign: "center",
    lineHeight: 19,
  },
  endBtn: {
    marginTop: 4,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
  },
  endBtnText: {
    fontSize: FONT.label,
    fontWeight: "800",
  },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  pagerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  pagerText: {
    fontSize: FONT.label,
    fontWeight: "700",
  },
  pagerCount: {
    fontSize: FONT.caption,
    fontWeight: "600",
  },
});
