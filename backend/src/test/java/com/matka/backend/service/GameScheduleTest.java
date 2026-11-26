package com.matka.backend.service;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GameScheduleTest {

    private static final List<String> BOTH = List.of("Open", "Close");
    private static final List<String> CLOSE_ONLY = List.of("Close");
    private static final List<String> NONE = List.of();

    private static LocalTime t(String hhmm) {
        return LocalTime.parse(hhmm);
    }

    // A late-night game: open 12:30 am, close 1:30 am. Its business day starts at 2 am the
    // previous calendar day, so it is bookable all evening and closes at 1:30 am.
    private static List<String> lateNight(String now) {
        return GameSchedule.allowedTypes(t("00:30"), t("01:30"), t(now));
    }

    // A normal afternoon game: open 3 pm, close 5 pm.
    private static List<String> afternoon(String now) {
        return GameSchedule.allowedTypes(t("15:00"), t("17:00"), t(now));
    }

    @Test
    void lateNightGameTakesBothBetsDuringTheDay() {
        assertThat(lateNight("02:00")).isEqualTo(BOTH);
        assertThat(lateNight("14:00")).isEqualTo(BOTH);
        assertThat(lateNight("23:59")).isEqualTo(BOTH);
        assertThat(lateNight("00:10")).isEqualTo(BOTH);
    }

    @Test
    void lateNightGameTakesOnlyCloseBetsBetweenOpenAndClose() {
        assertThat(lateNight("00:30")).isEqualTo(CLOSE_ONLY);
        assertThat(lateNight("01:00")).isEqualTo(CLOSE_ONLY);
        assertThat(lateNight("01:30")).isEqualTo(CLOSE_ONLY);
    }

    @Test
    void lateNightGameIsClosedAfterItsCloseTimeUntilTheDayRollsOver() {
        assertThat(lateNight("01:31")).isEqualTo(NONE);
        assertThat(lateNight("01:59")).isEqualTo(NONE);
    }

    @Test
    void afternoonGameIsUnchanged() {
        assertThat(afternoon("02:00")).isEqualTo(BOTH);
        assertThat(afternoon("14:59")).isEqualTo(BOTH);
        assertThat(afternoon("15:00")).isEqualTo(CLOSE_ONLY);
        assertThat(afternoon("17:00")).isEqualTo(CLOSE_ONLY);
        assertThat(afternoon("17:01")).isEqualTo(NONE);
        assertThat(afternoon("23:59")).isEqualTo(NONE);
        // After midnight the afternoon game is still yesterday's, so it stays closed until 2 am.
        assertThat(afternoon("00:30")).isEqualTo(NONE);
        assertThat(afternoon("01:59")).isEqualTo(NONE);
    }

    @Test
    void gameSavedAcrossTwoAmKeepsItsOldCloseOnlyBehaviour() {
        // Live data has "RADHA MORNING" open 00:45, close 10:00.
        assertThat(GameSchedule.crossesDayStart(t("00:45"), t("10:00"))).isTrue();
        assertThat(GameSchedule.allowedTypes(t("00:45"), t("10:00"), t("05:00"))).isEqualTo(CLOSE_ONLY);
        assertThat(GameSchedule.allowedTypes(t("00:45"), t("10:00"), t("10:00"))).isEqualTo(CLOSE_ONLY);
        assertThat(GameSchedule.allowedTypes(t("00:45"), t("10:00"), t("10:01"))).isEqualTo(NONE);
        assertThat(GameSchedule.allowedTypes(t("00:45"), t("10:00"), t("23:00"))).isEqualTo(NONE);
        // Crossing midnight (but not 2 am) is fine.
        assertThat(GameSchedule.crossesDayStart(t("23:00"), t("00:30"))).isFalse();
        assertThat(GameSchedule.crossesDayStart(t("00:30"), t("01:30"))).isFalse();
    }

    @Test
    void gameDateRollsOverAtTwoAm() {
        // Thursday 19 Nov 2026
        assertThat(GameSchedule.gameDate(java.time.LocalDateTime.of(2026, 11, 20, 1, 59)))
                .isEqualTo(java.time.LocalDate.of(2026, 11, 19));
        assertThat(GameSchedule.gameDate(java.time.LocalDateTime.of(2026, 11, 20, 2, 0)))
                .isEqualTo(java.time.LocalDate.of(2026, 11, 20));
    }

    @Test
    void weekendFlagsDecideWhetherAGameRuns() {
        com.matka.backend.Game g = new com.matka.backend.Game();
        g.setSaturday(true);
        g.setSunday(false);
        assertThat(GameSchedule.runsOn(g, java.time.LocalDate.of(2026, 11, 19))).isTrue();  // Thu
        assertThat(GameSchedule.runsOn(g, java.time.LocalDate.of(2026, 11, 21))).isTrue();  // Sat
        assertThat(GameSchedule.runsOn(g, java.time.LocalDate.of(2026, 11, 22))).isFalse(); // Sun
    }

    @Test
    void gameWithoutTimesTakesCloseBets() {
        assertThat(GameSchedule.allowedTypes(null, null, t("12:00"))).isEqualTo(CLOSE_ONLY);
    }
}
