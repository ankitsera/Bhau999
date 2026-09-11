package com.matka.backend.service;

import com.matka.backend.User;
import com.matka.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Sends the "your balance changed" push to specific users.
 *
 * Runs asynchronously and off the request thread: a single result declaration can
 * credit thousands of winners, and FCM calls (with retries) must never sit inside
 * the HTTP request or the surrounding database transaction.
 */
@Service
public class BalanceNotificationService {
    private static final Logger log = LoggerFactory.getLogger(BalanceNotificationService.class);

    /** Clients switch on this to decide what to refresh. */
    public static final String TYPE_BALANCE_CHANGED = "balance_changed";

    private final UserRepository userRepository;
    private final FcmService fcmService;

    @Autowired
    public BalanceNotificationService(UserRepository userRepository, FcmService fcmService) {
        this.userRepository = userRepository;
        this.fcmService = fcmService;
    }

    @Async
    public void pushBalanceChanged(Collection<String> mobileNumbers) {
        if (mobileNumbers == null || mobileNumbers.isEmpty()) return;

        try {
            List<User> users = userRepository.findByMobileNumberIn(mobileNumbers);
            List<String> tokens = new ArrayList<>();
            for (User u : users) {
                String token = u.getFcmToken();
                if (token != null && !token.isBlank()) tokens.add(token);
            }

            if (tokens.isEmpty()) {
                log.debug("No FCM tokens registered for {} user(s); nothing to push", mobileNumbers.size());
                return;
            }

            // Signal only - the client fetches the authoritative value itself.
            Map<String, String> data = Map.of("type", TYPE_BALANCE_CHANGED);

            List<String> invalid = fcmService.sendDataToTokens(tokens, data);
            clearInvalidTokens(invalid);
        } catch (Exception ex) {
            // A failed push is not fatal: the client also refreshes on foreground and
            // on screen focus, which is what catches a dropped message.
            log.error("Failed to push balance change: {}", ex.getMessage());
        }
    }

    /**
     * Drop tokens FCM has told us are dead (app uninstalled, token rotated), so we
     * stop paying to retry against them on every future balance change.
     */
    private void clearInvalidTokens(List<String> invalidTokens) {
        if (invalidTokens == null || invalidTokens.isEmpty()) return;

        try {
            List<User> owners = userRepository.findByFcmTokenIn(invalidTokens);
            if (owners.isEmpty()) return;

            for (User u : owners) {
                u.setFcmToken(null);
            }
            userRepository.saveAll(owners);
            log.info("Cleared {} dead FCM token(s)", owners.size());
        } catch (Exception ex) {
            log.warn("Failed to clear dead FCM tokens: {}", ex.getMessage());
        }
    }
}
