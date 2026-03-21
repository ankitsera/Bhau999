package com.matka.backend.controller;

import com.matka.backend.Admin;
import com.matka.backend.repository.AdminRepository;
import com.matka.backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import com.matka.backend.service.FcmService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/users")
public class AdminController {
    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private FcmService fcmService;
    
    /**
     * Admin login endpoint - returns JWT token
     * POST /api/users/admin-login/
     * Body: { "username": "admin", "password": "password" }
     * Returns: { "token": "jwt_token_here" }
     */
    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@RequestBody AdminLoginRequest loginRequest) {
        log.info("Admin login attempt for username: {}", loginRequest.getUsername());
        
        if (loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            log.warn("Admin login failed: missing username or password");
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }
        
        Optional<Admin> adminOpt = adminRepository.findByUsername(loginRequest.getUsername());
        
        if (adminOpt.isEmpty()) {
            log.warn("Admin login failed: username not found: {}", loginRequest.getUsername());
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        
        Admin admin = adminOpt.get();
        
        // Plain text password comparison (as per user's existing pattern)
        if (!loginRequest.getPassword().equals(admin.getPassword())) {
            log.warn("Admin login failed: incorrect password for username: {}", loginRequest.getUsername());
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(admin.getUsername());
        log.info("Admin login successful for username: {}", admin.getUsername());
        
        return ResponseEntity.ok(Map.of("token", token));
    }
    
    /**
     * Change admin password endpoint
     * POST /api/users/change-password
     * Body: { "username": "admin", "password": "newPassword" }
     * Returns: { "message": "Password updated successfully" } or error message
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req) {
        log.info("Change password attempt for username: {}", req.getUsername());
        
        if (req.getUsername() == null || req.getPassword() == null) {
            log.warn("Change password failed: missing username or password");
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }
        
        Optional<Admin> adminOpt = adminRepository.findByUsername(req.getUsername());
        
        if (adminOpt.isEmpty()) {
            log.warn("Change password failed: username not found: {}", req.getUsername());
            return ResponseEntity.status(404).body(Map.of("message", "Admin user not found"));
        }
        
        Admin admin = adminOpt.get();
        admin.setPassword(req.getPassword());
        adminRepository.save(admin);
        
        log.info("Password updated successfully for username: {}", admin.getUsername());
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    // Admin API: send notification to all users topic
    // POST /api/users/notify-topic
    // Body: { "title": "Important", "message": "Hello users", "data": { "key": "value" } }
    @PostMapping("/notify-topic")
    public ResponseEntity<?> notifyTopic(@RequestBody NotificationRequest req) {
        if (req == null || req.getTitle() == null || req.getTitle().isBlank() || req.getMessage() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "title and message are required"));
        }

        try {
            String messageId = fcmService.sendToTopic("all_users", req.getTitle(), req.getMessage(), req.getData());
            if (messageId != null) {
                return ResponseEntity.ok(Map.of("message", "Notification sent", "messageId", messageId));
            } else {
                return ResponseEntity.status(500).body(Map.of("message", "Failed to send notification"));
            }
        } catch (Exception ex) {
            log.error("Error sending notification to topic: {}", ex.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Error sending notification", "error", ex.getMessage()));
        }
    }

    public static class NotificationRequest {
        private String title;
        private String message;
        private java.util.Map<String, String> data;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public java.util.Map<String, String> getData() { return data; }
        public void setData(java.util.Map<String, String> data) { this.data = data; }
    }
    
    /**
     * DTO for admin login request
     */
    public static class AdminLoginRequest {
        private String username;
        private String password;
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
    
    /**
     * DTO for change password request
     */
    public static class ChangePasswordRequest {
        private String username;
        private String password;
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
}
