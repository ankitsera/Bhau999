package com.matka.backend.service;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.matka.backend.BackendApplication;
import com.matka.backend.repository.PropertiesRepository;
import com.matka.backend.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * The single place user withdrawal rules are read and enforced.
 *
 * The admin panel saves these settings under the keys below. Both the check on a new
 * withdrawal and the rules endpoint the app reads go through this class, so the admin
 * panel, the server and the app cannot end up on different key names again.
 */
@Service
public class WithdrawalRulesService {
    private static final Logger log = LoggerFactory.getLogger(WithdrawalRulesService.class);

    public static final String KEY_MIN_AMOUNT = "minimum_withdrawal_amount";
    public static final String KEY_TIME_START = "withdrawal_time_start";
    public static final String KEY_TIME_END = "withdrawal_time_end";
    public static final String KEY_MAX_PER_DAY = "max_withdrawls_in_a_day";
    public static final String KEY_TODAY = "today_withdrawls";
    public static final String KEY_SATURDAY = "saturday_withdrawls";
    public static final String KEY_SUNDAY = "sunday_withdrawls";

    static final int DEFAULT_MIN_AMOUNT = 1;
    static final int DEFAULT_MAX_PER_DAY = 5;

    private static final String INITIATOR_USER = "user";
    private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    /**
     * The rules in force right now, judged by the server clock.
     *
     * timeStart and timeEnd are both null when no window is configured, meaning any
     * time of day is allowed.
     */
    public record Rules(
            int minAmount,
            int maxPerDay,
            @JsonFormat(pattern = "HH:mm") LocalTime timeStart,
            @JsonFormat(pattern = "HH:mm") LocalTime timeEnd,
            boolean allowedToday,
            boolean withinTimeWindow) {
    }

    private final PropertiesRepository propertiesRepository;
    private final TransactionRepository transactionRepository;
    private final Clock clock;

    @Autowired
    public WithdrawalRulesService(PropertiesRepository propertiesRepository,
                                  TransactionRepository transactionRepository) {
        this(propertiesRepository, transactionRepository, Clock.system(BackendApplication.ZONE));
    }

    WithdrawalRulesService(PropertiesRepository propertiesRepository,
                           TransactionRepository transactionRepository,
                           Clock clock) {
        this.propertiesRepository = propertiesRepository;
        this.transactionRepository = transactionRepository;
        this.clock = clock;
    }

    public Rules currentRules() {
        LocalDateTime now = LocalDateTime.now(clock);

        LocalTime start = readTime(KEY_TIME_START);
        LocalTime end = readTime(KEY_TIME_END);
        if (start == null || end == null) {
            // Half a window is not a window - treat it as unrestricted.
            start = null;
            end = null;
        }

        return new Rules(
                readInt(KEY_MIN_AMOUNT, DEFAULT_MIN_AMOUNT),
                readInt(KEY_MAX_PER_DAY, DEFAULT_MAX_PER_DAY),
                start,
                end,
                isDayAllowed(now.getDayOfWeek()),
                start == null || isWithinWindow(now.toLocalTime(), start, end));
    }

    /**
     * Check a withdrawal the user is requesting against the rules.
     *
     * @param amount the amount being withdrawn, as a positive number
     * @return the error body to send back, or empty when the withdrawal is allowed
     */
    public Optional<Map<String, Object>> checkUserWithdrawal(String mobileNumber, int amount) {
        Rules rules = currentRules();

        if (!rules.allowedToday()) {
            return Optional.of(Map.of("message", "Withdrawals are closed today"));
        }

        if (!rules.withinTimeWindow()) {
            return Optional.of(Map.of(
                    "message", "Withdrawals are allowed only between "
                            + rules.timeStart().format(DISPLAY_TIME) + " and " + rules.timeEnd().format(DISPLAY_TIME),
                    "timeStart", rules.timeStart().toString(),
                    "timeEnd", rules.timeEnd().toString()));
        }

        if (amount < rules.minAmount()) {
            return Optional.of(Map.of(
                    "message", "Minimum withdrawal amount is ₹" + rules.minAmount(),
                    "minAmount", rules.minAmount()));
        }

        long withdrawalsToday = transactionRepository.countByMobileNumberAndAmountLessThanAndInitiatorIgnoreCaseAndTxDate(
                mobileNumber, 0, INITIATOR_USER, LocalDateTime.now(clock).toLocalDate());
        // The count excludes the request being checked, so block once the user already has maxPerDay.
        if (withdrawalsToday >= rules.maxPerDay()) {
            return Optional.of(Map.of(
                    "message", "You can make at most " + rules.maxPerDay() + " withdrawal requests per day",
                    "maxPerDay", rules.maxPerDay()));
        }

        return Optional.empty();
    }

    private boolean isDayAllowed(DayOfWeek day) {
        // "today" is a one-day override from the admin panel, reset each night by DailyRollupService.
        if (!readBoolean(KEY_TODAY)) return false;
        if (day == DayOfWeek.SATURDAY) return readBoolean(KEY_SATURDAY);
        if (day == DayOfWeek.SUNDAY) return readBoolean(KEY_SUNDAY);
        return true;
    }

    static boolean isWithinWindow(LocalTime now, LocalTime start, LocalTime end) {
        if (start.equals(end)) {
            // same start and end => treat as allowed all day
            return true;
        }
        if (start.isBefore(end)) {
            return !now.isBefore(start) && !now.isAfter(end);
        }
        // window crosses midnight (e.g. 22:00 - 06:00)
        return !now.isBefore(start) || !now.isAfter(end);
    }

    private Optional<String> read(String key) {
        return propertiesRepository.findById(key)
                .map(p -> p.getValue())
                .map(String::trim)
                .filter(v -> !v.isEmpty());
    }

    private int readInt(String key, int fallback) {
        Optional<String> value = read(key);
        if (value.isEmpty()) return fallback;
        try {
            return Integer.parseInt(value.get());
        } catch (NumberFormatException ex) {
            log.warn("Property {}='{}' is not a whole number, using {}", key, value.get(), fallback);
            return fallback;
        }
    }

    private LocalTime readTime(String key) {
        Optional<String> value = read(key);
        if (value.isEmpty()) return null;
        try {
            return LocalTime.parse(value.get());
        } catch (Exception ex) {
            log.warn("Property {}='{}' is not a valid time, ignoring it", key, value.get());
            return null;
        }
    }

    // Unset means allowed. The admin panel stores switches as "true"/"false".
    private boolean readBoolean(String key) {
        return read(key).map(Boolean::parseBoolean).orElse(true);
    }
}
