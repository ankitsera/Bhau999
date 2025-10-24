package com.matka.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

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
        if (userRepository.findByMobileNumber(user.getMobileNumber()).isPresent()) {
            log.info("Signup failed: mobile number already exists: {}", user.getMobileNumber());
            return ResponseEntity.badRequest().body("Mobile number already exists");
        }
        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        log.info("Signup successful for mobile='{}'", user.getMobileNumber());
        return ResponseEntity.ok("Signup successful");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        log.info("Received login request for identifier='{}'", loginRequest.getUsernameOrMobile());
        // Try to find user by mobile number first
        Optional<User> userOpt = userRepository.findByMobileNumber(loginRequest.getUsernameOrMobile());
        if (userOpt.isPresent()) {
            boolean ok = passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword());
            if (ok) {
                log.info("Login successful for mobile='{}'", userOpt.get().getMobileNumber());
                return ResponseEntity.ok("Login successful");
            } else {
                log.info("Login failed (bad password) for identifier='{}'", loginRequest.getUsernameOrMobile());
            }
        } else {
            log.info("Login failed (user not found) for identifier='{}'", loginRequest.getUsernameOrMobile());
        }
        // If not found by mobile, you can attempt username-based login — but username is not unique now
        // so we avoid ambiguous username login. Return unauthorized.
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    public static class LoginRequest {
        private String usernameOrMobile;
        private String password;
        public String getUsernameOrMobile() { return usernameOrMobile; }
        public void setUsernameOrMobile(String usernameOrMobile) { this.usernameOrMobile = usernameOrMobile; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
