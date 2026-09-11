package com.matka.backend.service;

import com.matka.backend.BackendApplication;
import com.matka.backend.Properties;
import com.matka.backend.repository.PropertiesRepository;
import com.matka.backend.repository.TransactionRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WithdrawalRulesServiceTest {

    // Friday 11 Sep 2026
    private static final LocalDate FRIDAY = LocalDate.of(2026, 9, 11);
    private static final LocalDate SATURDAY = FRIDAY.plusDays(1);
    private static final String MOBILE = "9000000001";

    private final Map<String, String> props = new HashMap<>();
    private final PropertiesRepository propertiesRepository = mock(PropertiesRepository.class);
    private final TransactionRepository transactionRepository = mock(TransactionRepository.class);

    WithdrawalRulesServiceTest() {
        when(propertiesRepository.findById(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            if (!props.containsKey(key)) return Optional.empty();
            Properties p = new Properties();
            p.setKey(key);
            p.setValue(props.get(key));
            return Optional.of(p);
        });
    }

    private WithdrawalRulesService at(LocalDate date, String time) {
        LocalDateTime now = LocalDateTime.of(date, LocalTime.parse(time));
        Clock clock = Clock.fixed(now.atZone(BackendApplication.ZONE).toInstant(), BackendApplication.ZONE);
        return new WithdrawalRulesService(propertiesRepository, transactionRepository, clock);
    }

    private void withdrawalsAlreadyMadeToday(long count) {
        when(transactionRepository.countByMobileNumberAndAmountLessThanAndInitiatorIgnoreCaseAndTxDate(
                eq(MOBILE), anyInt(), anyString(), any())).thenReturn(count);
    }

    @Test
    void enforcesMinimumAmountSavedByAdminPanel() {
        props.put("minimum_withdrawal_amount", "1000");
        var service = at(FRIDAY, "12:00");

        assertThat(service.checkUserWithdrawal(MOBILE, 100)).get()
                .extracting(body -> body.get("message")).isEqualTo("Minimum withdrawal amount is ₹1000");
        assertThat(service.checkUserWithdrawal(MOBILE, 1000)).isEmpty();
    }

    @Test
    void enforcesTimeWindowSavedByAdminPanel() {
        props.put("withdrawal_time_start", "10:00:00");
        props.put("withdrawal_time_end", "18:00:00");

        assertThat(at(FRIDAY, "09:59").checkUserWithdrawal(MOBILE, 500)).get()
                .extracting(body -> body.get("message"))
                .isEqualTo("Withdrawals are allowed only between 10:00 AM and 6:00 PM");
        assertThat(at(FRIDAY, "18:01").checkUserWithdrawal(MOBILE, 500)).isPresent();
        assertThat(at(FRIDAY, "10:00").checkUserWithdrawal(MOBILE, 500)).isEmpty();
        assertThat(at(FRIDAY, "18:00").checkUserWithdrawal(MOBILE, 500)).isEmpty();
    }

    @Test
    void supportsWindowCrossingMidnight() {
        props.put("withdrawal_time_start", "22:00");
        props.put("withdrawal_time_end", "06:00");

        assertThat(at(FRIDAY, "23:30").currentRules().withinTimeWindow()).isTrue();
        assertThat(at(FRIDAY, "05:00").currentRules().withinTimeWindow()).isTrue();
        assertThat(at(FRIDAY, "12:00").currentRules().withinTimeWindow()).isFalse();
    }

    @Test
    void missingOrHalfWindowMeansAnyTime() {
        props.put("withdrawal_time_start", "10:00:00");
        props.put("withdrawal_time_end", "");

        var rules = at(FRIDAY, "03:00").currentRules();
        assertThat(rules.timeStart()).isNull();
        assertThat(rules.timeEnd()).isNull();
        assertThat(rules.withinTimeWindow()).isTrue();
    }

    @Test
    void honoursDaySwitches() {
        props.put("saturday_withdrawls", "false");
        assertThat(at(FRIDAY, "12:00").checkUserWithdrawal(MOBILE, 500)).isEmpty();
        assertThat(at(SATURDAY, "12:00").checkUserWithdrawal(MOBILE, 500)).get()
                .extracting(body -> body.get("message")).isEqualTo("Withdrawals are closed today");

        props.put("today_withdrawls", "false");
        assertThat(at(FRIDAY, "12:00").currentRules().allowedToday()).isFalse();
    }

    @Test
    void enforcesDailyLimit() {
        props.put("max_withdrawls_in_a_day", "2");

        withdrawalsAlreadyMadeToday(1);
        assertThat(at(FRIDAY, "12:00").checkUserWithdrawal(MOBILE, 500)).isEmpty();

        withdrawalsAlreadyMadeToday(2);
        assertThat(at(FRIDAY, "12:00").checkUserWithdrawal(MOBILE, 500)).get()
                .extracting(body -> body.get("message")).isEqualTo("You can make at most 2 withdrawal requests per day");
    }

    @Test
    void fallsBackToDefaultsWhenNothingIsConfigured() {
        var rules = at(FRIDAY, "12:00").currentRules();

        assertThat(rules.minAmount()).isEqualTo(WithdrawalRulesService.DEFAULT_MIN_AMOUNT);
        assertThat(rules.maxPerDay()).isEqualTo(WithdrawalRulesService.DEFAULT_MAX_PER_DAY);
        assertThat(rules.allowedToday()).isTrue();
        assertThat(rules.withinTimeWindow()).isTrue();
    }

    @Test
    void ignoresMalformedValues() {
        props.put("minimum_withdrawal_amount", "abc");
        props.put("withdrawal_time_start", "10am");
        props.put("withdrawal_time_end", "18:00");

        var rules = at(FRIDAY, "03:00").currentRules();
        assertThat(rules.minAmount()).isEqualTo(WithdrawalRulesService.DEFAULT_MIN_AMOUNT);
        assertThat(rules.withinTimeWindow()).isTrue();
    }
}
