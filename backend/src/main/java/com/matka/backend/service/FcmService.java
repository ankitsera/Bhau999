package com.matka.backend.service;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.TopicManagementResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FcmService {
    private static final Logger log = LoggerFactory.getLogger(FcmService.class);

    public boolean subscribeTokenToTopic(String token, String topic) {
        try {
            TopicManagementResponse resp = FirebaseMessaging.getInstance().subscribeToTopic(List.of(token), topic);
            if (resp.getFailureCount() > 0) {
                log.warn("Failed to subscribe token to topic {}: failures={} errors={}", topic, resp.getFailureCount(), resp.getErrors());
                return false;
            }
            log.info("Subscribed token to topic {} successfully", topic);
            return true;
        } catch (FirebaseMessagingException e) {
            log.error("Firebase error subscribing to topic {}: {}", topic, e.getMessage());
            return false;
        } catch (Exception ex) {
            log.error("Unexpected error subscribing to topic {}: {}", topic, ex.getMessage());
            return false;
        }
    }

    public boolean unsubscribeTokenFromTopic(String token, String topic) {
        try {
            TopicManagementResponse resp = FirebaseMessaging.getInstance().unsubscribeFromTopic(List.of(token), topic);
            if (resp.getFailureCount() > 0) {
                log.warn("Failed to unsubscribe token from topic {}: failures={} errors={}", topic, resp.getFailureCount(), resp.getErrors());
                return false;
            }
            log.info("Unsubscribed token from topic {} successfully", topic);
            return true;
        } catch (FirebaseMessagingException e) {
            log.error("Firebase error unsubscribing from topic {}: {}", topic, e.getMessage());
            return false;
        } catch (Exception ex) {
            log.error("Unexpected error unsubscribing from topic {}: {}", topic, ex.getMessage());
            return false;
        }
    }
}
