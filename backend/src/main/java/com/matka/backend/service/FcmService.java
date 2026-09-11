package com.matka.backend.service;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.TopicManagementResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.Callable;

@Service
public class FcmService {
    private static final Logger log = LoggerFactory.getLogger(FcmService.class);

    public boolean subscribeTokenToTopic(String token, String topic) {
        try {
            return withRetries(() -> {
                TopicManagementResponse resp = FirebaseMessaging.getInstance().subscribeToTopic(List.of(token), topic);
                if (resp.getFailureCount() > 0) {
                    log.warn("Failed to subscribe token to topic {}: failures={} errors={}", topic, resp.getFailureCount(), resp.getErrors());
                    return false;
                }
                log.info("Subscribed token to topic {} successfully", topic);
                return true;
            });
        } catch (Exception e) {
            log.error("Error subscribing token to topic {}: {}", topic, e.getMessage());
            return false;
        }
    }

    public boolean unsubscribeTokenFromTopic(String token, String topic) {
        try {
            return withRetries(() -> {
                TopicManagementResponse resp = FirebaseMessaging.getInstance().unsubscribeFromTopic(List.of(token), topic);
                if (resp.getFailureCount() > 0) {
                    log.warn("Failed to unsubscribe token from topic {}: failures={} errors={}", topic, resp.getFailureCount(), resp.getErrors());
                    return false;
                }
                log.info("Unsubscribed token from topic {} successfully", topic);
                return true;
            });
        } catch (Exception e) {
            log.error("Error unsubscribing token from topic {}: {}", topic, e.getMessage());
            return false;
        }
    }

    /**
     * Send a notification message to a topic. Returns the messageId on success, or null on failure.
     */
    public String sendToTopic(String topic, String title, String body, java.util.Map<String, String> data) {
        try {
            return withRetries(() -> {
                com.google.firebase.messaging.Notification notification = com.google.firebase.messaging.Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build();

                com.google.firebase.messaging.Message.Builder mb = com.google.firebase.messaging.Message.builder()
                        .setTopic(topic)
                        .setNotification(notification);

                if (data != null && !data.isEmpty()) {
                    mb.putAllData(data);
                }

                String messageId = FirebaseMessaging.getInstance().send(mb.build());
                log.info("Sent message to topic {} with messageId={}", topic, messageId);
                return messageId;
            });
        } catch (Exception e) {
            log.error("Error sending message to topic {}: {}", topic, e.getMessage());
            return null;
        }
    }

    /**
     * Send a DATA-ONLY message to specific device tokens.
     *
     * Data-only (no setNotification) matters: a notification message is rendered by
     * the FCM SDK itself and the app's JS never runs while backgrounded, so it cannot
     * be used to trigger a refresh. High priority is set so the message is not held
     * back by Android Doze.
     *
     * The payload deliberately carries only a signal ("something changed"), never the
     * new value - push delivery is unordered, so a value could arrive stale.
     *
     * @return tokens FCM reported as permanently invalid; the caller should clear them.
     */
    public List<String> sendDataToTokens(List<String> tokens, java.util.Map<String, String> data) {
        java.util.List<String> invalid = new java.util.ArrayList<>();
        if (tokens == null || tokens.isEmpty()) return invalid;

        // FCM accepts at most 500 tokens per multicast call.
        final int chunkSize = 500;
        for (int start = 0; start < tokens.size(); start += chunkSize) {
            List<String> chunk = tokens.subList(start, Math.min(start + chunkSize, tokens.size()));
            try {
                com.google.firebase.messaging.MulticastMessage.Builder mb =
                        com.google.firebase.messaging.MulticastMessage.builder()
                                .addAllTokens(chunk)
                                .setAndroidConfig(com.google.firebase.messaging.AndroidConfig.builder()
                                        .setPriority(com.google.firebase.messaging.AndroidConfig.Priority.HIGH)
                                        .build());

                if (data != null && !data.isEmpty()) {
                    mb.putAllData(data);
                }

                final com.google.firebase.messaging.MulticastMessage message = mb.build();
                BatchResponse resp = withRetries(() -> FirebaseMessaging.getInstance().sendEachForMulticast(message));

                if (resp == null) continue;

                for (int i = 0; i < resp.getResponses().size(); i++) {
                    com.google.firebase.messaging.SendResponse r = resp.getResponses().get(i);
                    if (r.isSuccessful()) continue;

                    FirebaseMessagingException ex = r.getException();
                    com.google.firebase.messaging.MessagingErrorCode code =
                            ex == null ? null : ex.getMessagingErrorCode();

                    // UNREGISTERED = app uninstalled or token rotated.
                    // INVALID_ARGUMENT = malformed token. Neither is worth retrying.
                    if (code == com.google.firebase.messaging.MessagingErrorCode.UNREGISTERED
                            || code == com.google.firebase.messaging.MessagingErrorCode.INVALID_ARGUMENT) {
                        invalid.add(chunk.get(i));
                    } else {
                        log.warn("FCM send failed for a token: {}", ex == null ? "unknown" : ex.getMessage());
                    }
                }

                log.info("Sent data message to {} tokens: success={} failure={}",
                        chunk.size(), resp.getSuccessCount(), resp.getFailureCount());
            } catch (Exception e) {
                log.error("Error sending data message to tokens: {}", e.getMessage());
            }
        }

        return invalid;
    }

    private <T> T withRetries(Callable<T> work) throws Exception {
        final int maxAttempts = 3;
        long delayMs = 500L;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return work.call();
            } catch (FirebaseMessagingException | RuntimeException ex) {
                // Last attempt -> rethrow
                if (attempt == maxAttempts) throw ex;
                log.warn("Attempt {}/{} failed: {} - retrying after {}ms", attempt, maxAttempts, ex.getMessage(), delayMs);
                try {
                    Thread.sleep(delayMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ie;
                }
                delayMs *= 2;
            }
        }
        return null;
    }
}
