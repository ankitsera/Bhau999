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
import java.time.LocalDateTime;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

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

        // Validate presence of mobileNumber (format validation handled by frontend)
        if (user.getMobileNumber() == null) {
            log.info("Signup failed: missing mobile number");
            return ResponseEntity.badRequest().body(Map.of("message", "mobileNumber is required"));
        }

        if (userRepository.findByMobileNumber(user.getMobileNumber()).isPresent()) {
            log.info("Signup failed: mobile number already exists: {}", user.getMobileNumber());
            return ResponseEntity.badRequest().body(Map.of("message", "Mobile number already exists"));
        }
    // Store password as-is (plain text) — NOT recommended for production
    // NOTE: this stores the password exactly as provided in the DB
    user.setPassword(user.getPassword());
    // set signup date
    user.setDateSignup(LocalDateTime.now());
    // mark approval as Approved by default
    user.setApprovalStatus("Approved");
        userRepository.save(user);
        log.info("Signup successful for mobile='{}'", user.getMobileNumber());
        return ResponseEntity.ok(Map.of("message", "Signup successful"));
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
                    u.getAccountHolderName(),
                    u.getAccountNumber(),
                    u.getIfscCode(),
                    u.getUpiId(),
                    u.getApprovalStatus()
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
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    // Note: mobile number format validation is delegated to frontend; controller only checks presence.

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
            return ResponseEntity.badRequest().body(Map.of("message", "Missing payload (mobileNumber, amount required)"));
        }

        var userOpt = userRepository.findByMobileNumber(request.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found: " + request.getMobileNumber()));
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
        return ResponseEntity.ok(Map.of("message", "Balance updated", "user", user));
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
        // Expect JSON body: { "mobileNumber": "<mobile>" }
        String mobile = body == null ? null : body.get("mobileNumber");
        log.info("Received checkUser request for '{}'", mobile);
        if (mobile == null) {
            log.info("checkUser failed: missing mobileNumber");
            return ResponseEntity.badRequest().body(Map.of("message", "mobileNumber is required"));
        }

        Optional<User> userOpt = userRepository.findByMobileNumber(mobile);
        if (userOpt.isPresent()) {
            log.info("checkUser: user exists for mobile='{}'", mobile);
            return ResponseEntity.ok(Map.of("message", "User exists"));
        }

        log.info("checkUser: mobile '{}' is not registered", mobile);
        return ResponseEntity.status(404).body(Map.of("message", "User not found"));
    }

    @PostMapping("/auth/UpdateDetails")
    public ResponseEntity<?> updateDetails(@RequestBody User user) {
        log.info("Received updateDetails request for mobile='{}'", user.getMobileNumber());

        if (user.getMobileNumber() == null) {
            log.info("updateDetails failed: missing mobile number");
            return ResponseEntity.badRequest().body(Map.of("message", "mobileNumber is required"));
        }

        Optional<User> existingUserOpt = userRepository.findByMobileNumber(user.getMobileNumber());
        if (existingUserOpt.isEmpty()) {
            log.info("updateDetails failed: user not found for mobile='{}'", user.getMobileNumber());
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        User existingUser = existingUserOpt.get();
        // Update fields if provided
        if (user.getUsername() != null) {
            existingUser.setUsername(user.getUsername());
        }
        if (user.getPassword() != null) {
            existingUser.setPassword(user.getPassword());
        }
        if( user.getAccountNumber() != null) {
            existingUser.setAccountNumber(user.getAccountNumber());
        }
        if( user.getAccountHolderName() != null) {
            existingUser.setAccountHolderName(user.getAccountHolderName());
        }
        if( user.getIfscCode() != null) {
            existingUser.setIfscCode(user.getIfscCode());
        }
        if( user.getUpiId() != null) {
            existingUser.setUpiId(user.getUpiId());
        }
        if( user.getApprovalStatus() != null) {
            existingUser.setApprovalStatus(user.getApprovalStatus());
        }
        userRepository.save(existingUser);
        log.info("updateDetails successful for mobile='{}'", user.getMobileNumber());
        return ResponseEntity.ok(Map.of("message", "User details updated"));
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
        private String accountHolderName;
        private String accountNumber;
        private String ifscCode;
        private String upiId;
        private String approvalStatus;

        public UserResponse(String mobileNumber, String username, LocalDateTime dateSignup, Integer balance, String accountHolderName, String accountNumber, String ifscCode, String upiId, String approvalStatus) {
            this.mobileNumber = mobileNumber;
            this.username = username;
            this.dateSignup = dateSignup;
            this.balance = balance;
            this.accountHolderName = accountHolderName;
            this.accountNumber = accountNumber;
            this.ifscCode = ifscCode;
            this.upiId = upiId;
            this.approvalStatus = approvalStatus;
        }

        public String getMobileNumber() { return mobileNumber; }
        public String getUsername() { return username; }
        public LocalDateTime getDateSignup() { return dateSignup; }
        public Integer getBalance() { return balance; }
        public String getAccountHolderName() { return accountHolderName; }
        public String getAccountNumber() { return accountNumber; }
        public String getIfscCode() { return ifscCode; }
        public String getUpiId() { return upiId; }
        public String getApprovalStatus() { return approvalStatus; }
    }

    // API to update bank details (partial update: only non-null fields are updated)
    @PostMapping("/users/bank")
    public ResponseEntity<?> setBankDetails(@RequestBody BankDetailsRequest req) {
        if (req == null || req.getMobileNumber() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "mobileNumber is required"));
        }
        var userOpt = userRepository.findByMobileNumber(req.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found: " + req.getMobileNumber()));
        }
        var user = userOpt.get();
        boolean changed = false;
        if (req.getAccountHolderName() != null) { user.setAccountHolderName(req.getAccountHolderName()); changed = true; }
        if (req.getAccountNumber() != null) { user.setAccountNumber(req.getAccountNumber()); changed = true; }
        if (req.getIfscCode() != null) { user.setIfscCode(req.getIfscCode()); changed = true; }
        if (req.getUpiId() != null) { user.setUpiId(req.getUpiId()); changed = true; }
        if (changed) {
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Bank details updated", "user", user));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "No updatable fields provided"));
    }

    public static class BankDetailsRequest {
        private String mobileNumber;
        private String accountHolderName;
        private String accountNumber;
        private String ifscCode;
        private String upiId;

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
        public String getAccountHolderName() { return accountHolderName; }
        public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }
        public String getAccountNumber() { return accountNumber; }
        public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
        public String getIfscCode() { return ifscCode; }
        public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
        public String getUpiId() { return upiId; }
        public void setUpiId(String upiId) { this.upiId = upiId; }
    }

    // Lookup IFSC via Razorpay public IFSC API: https://ifsc.razorpay.com/{IFSC}
    // Example: POST /api/ifsc with JSON { "ifsc": "ABHY0065001" }
    @PostMapping("/ifsc")
    public ResponseEntity<?> lookupIfsc(@RequestBody java.util.Map<String, String> body) {
        if (body == null || body.get("ifsc") == null || body.get("ifsc").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "IFSC is required"));
        }
        String code = body.get("ifsc").trim().toUpperCase();
        String url = "https://ifsc.razorpay.com/" + code;
        RestTemplate rt = new RestTemplate();
        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> resp = rt.getForObject(url, java.util.Map.class);
            if (resp == null || resp.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "IFSC not found"));
            }
            return ResponseEntity.ok(Map.of("message", "IFSC valid", "details", resp));
        } catch (HttpClientErrorException.NotFound nf) {
            return ResponseEntity.status(404).body(Map.of("message", "IFSC not found"));
        } catch (HttpClientErrorException he) {
            // other 4xx/5xx from remote
            return ResponseEntity.status(502).body(Map.of("message", "IFSC service error", "status", he.getStatusCode().value()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "IFSC lookup failed", "error", ex.getMessage()));
        }
    }
}
