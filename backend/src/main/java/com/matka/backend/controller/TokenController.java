package com.matka.backend.controller;

import com.matka.backend.Token;
import com.matka.backend.User;
import com.matka.backend.repository.TokenRepository;
import com.matka.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/token")
public class TokenController {
    private static final Logger log = LoggerFactory.getLogger(TokenController.class);

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    // Create or update a user's FCM token
    // POST /api/token
    // Body: { "mobileNumber": "9876543210", "token": "..." }
    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody TokenRequest req) {
        if (req == null || req.getMobileNumber() == null || req.getMobileNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "mobileNumber is required"));
        }
        if (req.getToken() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "token is required"));
        }

        String mobile = req.getMobileNumber().trim();

        var userOpt = userRepository.findByMobileNumber(mobile);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found for mobile: " + mobile));
        }

        try {
            Token t = tokenRepository.findById(mobile).orElseGet(() -> new Token(mobile, req.getToken()));
            t.setToken(req.getToken());
            tokenRepository.save(t);
            log.info("Saved token for mobile={}", mobile);
            // Return only a success message to avoid serializing related User
            return ResponseEntity.ok(Map.of("message", "Token saved"));
        } catch (Exception ex) {
            log.error("Failed to save token for {}: {}", mobile, ex.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Failed to save token" , "error", ex.getMessage()));
        }
    }

    public static class TokenRequest {
        private String mobileNumber;
        private String token;

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }
}
