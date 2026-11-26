package com.matka.backend.service;

import com.matka.backend.Game;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Time rules for when a game takes bets and when its results may be declared.
 *
 * <p>The game day does not start at midnight: it runs from 02:00 to 02:00, because
 * {@link DailyRollupService} archives results and bets and resets every game at 02:00.
 * So a game with times after midnight (for example open 00:30, close 01:30) belongs to
 * the game day that started at 02:00 the previous calendar day, and 00:30 is "later"
 * than 23:00.
 *
 * <p>All comparisons therefore use the position of a time within the game day rather
 * than the raw clock time. Every time is Indian Standard Time (see {@code BackendApplication}).
 */
public final class GameSchedule {

    /** Must match the cron of {@link DailyRollupService#runDailyRollup()}. */
    public static final LocalTime DAY_START = LocalTime.of(2, 0);

    private static final long SECONDS_PER_DAY = Duration.ofDays(1).toSeconds();

    private GameSchedule() {}

    /** Seconds elapsed since the game day started at {@link #DAY_START}. */
    static long positionInDay(LocalTime time) {
        return Math.floorMod(time.toSecondOfDay() - DAY_START.toSecondOfDay(), SECONDS_PER_DAY);
    }

    /** True when {@code time} comes before {@code other} within the same game day. */
    public static boolean isBefore(LocalTime time, LocalTime other) {
        return positionInDay(time) < positionInDay(other);
    }

    /** True when {@code time} comes after {@code other} within the same game day. */
    public static boolean isAfter(LocalTime time, LocalTime other) {
        return positionInDay(time) > positionInDay(other);
    }

    /**
     * True when the times cross the 02:00 rollover, i.e. close comes before open within the
     * game day (for example open 00:45, close 10:00). Such a game cannot open and close within
     * one game day; saving it is rejected, see {@link #crossesDayStart}.
     */
    public static boolean crossesDayStart(LocalTime openTime, LocalTime closeTime) {
        return openTime != null && closeTime != null && isAfter(openTime, closeTime);
    }

    /**
     * Open time to enforce. For games saved before rollover-crossing times were rejected, the
     * open time is treated as already passed at 02:00, so they keep taking only "Close" bets
     * until they close, exactly as they behaved before game-day ordering was introduced.
     */
    public static LocalTime effectiveOpenTime(LocalTime openTime, LocalTime closeTime) {
        return crossesDayStart(openTime, closeTime) ? DAY_START : openTime;
    }

    /**
     * Bet types a game accepts at {@code now}: both before it opens, only "Close" between
     * open and close (inclusive), none after it closes.
     */
    public static List<String> allowedTypes(LocalTime openTime, LocalTime closeTime, LocalTime now) {
        openTime = effectiveOpenTime(openTime, closeTime);
        if (openTime != null && isBefore(now, openTime)) {
            return List.of("Open", "Close");
        }
        if (closeTime != null && isAfter(now, closeTime)) {
            return List.of();
        }
        return List.of("Close");
    }

    /** The game day {@code now} belongs to: before 02:00 it is still the previous calendar day. */
    public static LocalDate gameDate(LocalDateTime now) {
        return now.minusSeconds(DAY_START.toSecondOfDay()).toLocalDate();
    }

    /** Whether a game runs on {@code day}: every weekday, weekends only when its flag is set. */
    public static boolean runsOn(Game game, LocalDate day) {
        DayOfWeek dow = day.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY) return Boolean.TRUE.equals(game.getSaturday());
        if (dow == DayOfWeek.SUNDAY) return Boolean.TRUE.equals(game.getSunday());
        return true;
    }
}
