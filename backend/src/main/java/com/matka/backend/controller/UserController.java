package com.matka.backend.controller;

import com.matka.backend.User;
import com.matka.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import com.matka.backend.TransactionEntity;
import com.matka.backend.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;
import java.util.Map;
import java.util.regex.Pattern;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;

    // Note: password encryption removed per user request; passwords will be stored and compared as plain text.

    @PostMapping("/auth/signup")
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
    // Store password as-is (plain text) — NOT recommended for production
    // NOTE: this stores the password exactly as provided in the DB
    user.setPassword(user.getPassword());
        // set signup date
        user.setDateSignup(LocalDateTime.now());
        userRepository.save(user);
        log.info("Signup successful for mobile='{}'", user.getMobileNumber());
        return ResponseEntity.ok("Signup successful");
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        log.info("Received login request for mobile='{}'", loginRequest.getMobileNumber());
        // Try to find user by mobile number first
        Optional<User> userOpt = userRepository.findByMobileNumber(loginRequest.getMobileNumber());
        if (userOpt.isPresent()) {
            boolean ok = loginRequest.getPassword() != null && loginRequest.getPassword().equals(userOpt.get().getPassword());
            if (ok) {
                log.info("Login successful for mobile='{}'", userOpt.get().getMobileNumber());
                User u = userOpt.get();
                UserResponse resp = new UserResponse(
                    u.getMobileNumber(),
                    u.getUsername(),
                    u.getDateSignup(),
                    u.getBalance(),
                    u.getAccountNumber(),
                    u.getIfscCode(),
                    u.getUpiId()
                );
                return ResponseEntity.ok(resp);
                } else {
                log.info("Login failed (bad password) for mobile='{}'", loginRequest.getMobileNumber());
            }
        } else {
            log.info("Login failed (user not found) for mobile='{}'", loginRequest.getMobileNumber());
        }
        // If not found by mobile, you can attempt username-based login — but username is not unique now
        // so we avoid ambiguous username login. Return unauthorized.
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    // Pattern for exactly 10 digits
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^\\d{10}$");

    // List all users (dev/admin) — moved here so UserController owns user-related APIs
    @GetMapping("/users")
    public ResponseEntity<java.util.List<User>> listAllUsers() {
        java.util.List<User> list = userRepository.findAll();
        return ResponseEntity.ok(list);
    }

    // Credit a user's balance (moved from BalanceController)
    @PostMapping("/users/balance/add")
    @Transactional
    public ResponseEntity<?> addToBalance(@RequestBody TransactionEntity request) {
        if (request == null || request.getMobileNumber() == null || request.getAmount() == null) {
            return ResponseEntity.badRequest().body("Missing payload (mobileNumber, amount required)");
        }

        var userOpt = userRepository.findByMobileNumber(request.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found: " + request.getMobileNumber());
        }

        var user = userOpt.get();
        Integer current = user.getBalance() == null ? 0 : user.getBalance();
        int newBalance = current + request.getAmount();
        user.setBalance(newBalance);
        userRepository.save(user);

        // record transaction (positive amount)
        TransactionEntity tx = new TransactionEntity();
        tx.setMobileNumber(request.getMobileNumber());
        tx.setAmount(request.getAmount());
        tx.setTxDate(request.getTxDate() == null ? LocalDate.now() : request.getTxDate());
        tx.setTxTime(request.getTxTime() == null ? LocalTime.now() : request.getTxTime());
        transactionRepository.save(tx);

        log.info("Credited user {} amount={} newBalance={}", user.getMobileNumber(), request.getAmount(), newBalance);
        return ResponseEntity.ok(user);
    }

    /**
     * Check user existence endpoint.
    * Accepts POST with JSON body: {"mobileNumber":"<10-digit>"}
     * Returns 400 with {code, message} if invalid mobile format.
     * Returns 200 with {status: "NEW", message: ...} if not found.
     * Returns 200 with {status: "EXISTS", message: ...} if found.
     */
    @PostMapping("/auth/checkUser")
    public ResponseEntity<?> checkUser(@RequestBody Map<String, String> body) {
        // Expect JSON body: { "mobileNumber": "<10-digit>" }
        String mobile = body == null ? null : body.get("mobileNumber");
        log.info("Received checkUser request for '{}'", mobile);
        if (mobile == null || !MOBILE_PATTERN.matcher(mobile).matches()) {
            log.info("checkUser failed: invalid mobile '{}'", mobile);
            return ResponseEntity.badRequest().body(Map.of("code", "INVALID_MOBILE", "message", "Mobile number must be exactly 10 digits"));
        }

        Optional<User> userOpt = userRepository.findByMobileNumber(mobile);
        if (userOpt.isPresent()) {
            log.info("checkUser: user exists for mobile='{}'", mobile);
            return ResponseEntity.ok(Map.of("status", "EXISTS", "message", "User exists"));
        }

        log.info("checkUser: mobile '{}' is new", mobile);
        return ResponseEntity.ok(Map.of("status", "NEW", "message", "Mobile not registered"));
    }

    public static class LoginRequest {
        private String mobileNumber;
        private String password;
        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    // Response DTO for successful login (sanitized)
    public static class UserResponse {
        private String mobileNumber;
        private String username;
        private LocalDateTime dateSignup;
        private Integer balance;
        private String accountNumber;
        private String ifscCode;
        private String upiId;

        public UserResponse(String mobileNumber, String username, LocalDateTime dateSignup, Integer balance, String accountNumber, String ifscCode, String upiId) {
            this.mobileNumber = mobileNumber;
            this.username = username;
            this.dateSignup = dateSignup;
            this.balance = balance;
            this.accountNumber = accountNumber;
            this.ifscCode = ifscCode;
            this.upiId = upiId;
        }

        public String getMobileNumber() { return mobileNumber; }
        public String getUsername() { return username; }
        public LocalDateTime getDateSignup() { return dateSignup; }
        public Integer getBalance() { return balance; }
        public String getAccountNumber() { return accountNumber; }
        public String getIfscCode() { return ifscCode; }
        public String getUpiId() { return upiId; }
    }
}
