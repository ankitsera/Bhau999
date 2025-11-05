package com.matka.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")

public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        log.info("Received signup request for mobile='{}', username='{}'", user.getMobileNumber(), user.getUsername());

        // Validate mobile number: exactly 10 digits
        if (user.getMobileNumber() == null || !MOBILE_PATTERN.matcher(user.getMobileNumber()).matches()) {
            log.info("Signup failed: invalid mobile number format: {}", user.getMobileNumber());
            return ResponseEntity.badRequest().body(Map.of("code", "INVALID_MOBILE", "message", "Mobile number must be exactly 10 digits"));
        }

        if (userRepository.findByMobileNumber(user.getMobileNumber()).isPresent()) {
            log.info("Signup failed: mobile number already exists: {}", user.getMobileNumber());
            return ResponseEntity.badRequest().body(Map.of("code", "MOBILE_EXISTS", "message", "Mobile number already exists"));
        }
        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        log.info("Signup successful for mobile='{}'", user.getMobileNumber());
        return ResponseEntity.ok("Signup successful");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        log.info("Received login request for identifier='{}'", loginRequest.getMobile());
        // Try to find user by mobile number first
        Optional<User> userOpt = userRepository.findByMobileNumber(loginRequest.getMobile());
        if (userOpt.isPresent()) {
            boolean ok = passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword());
            if (ok) {
                log.info("Login successful for mobile='{}'", userOpt.get().getMobileNumber());
                return ResponseEntity.ok("Login successful");
            } else {
                log.info("Login failed (bad password) for identifier='{}'", loginRequest.getMobile());
            }
        } else {
            log.info("Login failed (user not found) for identifier='{}'", loginRequest.getMobile());
        }
        // If not found by mobile, you can attempt username-based login — but username is not unique now
        // so we avoid ambiguous username login. Return unauthorized.
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    // Pattern for exactly 10 digits
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^\\d{10}$");

    /**
     * Check user existence endpoint.
     * Accepts POST with JSON body: {"mobile":"<10-digit>"}
     * Returns 400 with {code, message} if invalid mobile format.
     * Returns 200 with {status: "NEW", message: ...} if not found.
     * Returns 200 with {status: "EXISTS", message: ..., username: <username>} if found.
     */
    @PostMapping("/checkUser")
    public ResponseEntity<?> checkUser(@RequestBody Map<String, String> body) {
        String mobile = body == null ? null : body.get("mobileNumber");
        log.info("Received checkUser request for '{}'", mobile);
        if (mobile == null || !MOBILE_PATTERN.matcher(mobile).matches()) {
            log.info("checkUser failed: invalid mobile '{}'", mobile);
            return ResponseEntity.badRequest().body(Map.of("code", "INVALID_MOBILE", "message", "Mobile number must be exactly 10 digits"));
        }

        Optional<User> userOpt = userRepository.findByMobileNumber(mobile);
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            log.info("checkUser: user exists for mobile='{}', username='{}'", mobile, u.getUsername());
            return ResponseEntity.ok(Map.of("status", "EXISTS", "message", "User exists", "username", u.getUsername()));
        }

        log.info("checkUser: mobile '{}' is new", mobile);
        return ResponseEntity.ok(Map.of("status", "NEW", "message", "Mobile not registered"));
    }

    public static class LoginRequest {
        private String mobile;
        private String password;
        public String getMobile() { return mobile; }
        public void setMobile(String mobile) { this.mobile = mobile; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
