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
