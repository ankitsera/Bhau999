package com.matka.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.InputStream;

@Component
public class FirebaseInitializer {
    private static final Logger log = LoggerFactory.getLogger(FirebaseInitializer.class);

    @Value("${firebase.service-account-file:}")
    private String serviceAccountFile;

    @PostConstruct
    public void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream credStream = null;
                if (serviceAccountFile != null && !serviceAccountFile.isBlank()) {
                    log.info("Initializing Firebase using service account file: {}", serviceAccountFile);
                    credStream = new FileInputStream(serviceAccountFile);
                } else {
                    log.info("No firebase.service-account-file provided; attempting to load Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)");
                    credStream = null; // will use GoogleCredentials.getApplicationDefault()
                }

                GoogleCredentials credentials;
                if (credStream != null) {
                    credentials = GoogleCredentials.fromStream(credStream);
                } else {
                    credentials = GoogleCredentials.getApplicationDefault();
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("FirebaseApp initialized successfully");
            } else {
                log.info("FirebaseApp already initialized");
            }
        } catch (Exception ex) {
            log.error("Failed to initialize FirebaseApp: {}", ex.getMessage());
        }
    }
}
