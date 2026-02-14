package com.matka.backend.controller;

import com.matka.backend.TransactionEntity;
import com.matka.backend.repository.TransactionRepository;
import com.matka.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import com.matka.backend.repository.PropertiesRepository;

@RestController
@RequestMapping("/api/transaction")
public class TransactionController {
    private static final Logger log = LoggerFactory.getLogger(TransactionController.class);

    private static final String INITIATOR_USER = "user";
    private static final String INITIATOR_ADMIN = "admin";

    // Lightweight DTO for transaction responses to avoid lazy or sensitive fields
    private static class TransactionResponse {
        public Long id;
        public String mobileNumber;
        public Integer amount;
        public java.time.LocalDate txDate;
        public java.time.LocalTime txTime;
        public String initiator;
        public String status;
        public String remarks;

        public TransactionResponse() {}
        public TransactionResponse(TransactionEntity t) {
            if (t == null) return;
            this.id = t.getId();
            this.mobileNumber = t.getMobileNumber();
            this.amount = t.getAmount();
            this.txDate = t.getTxDate();
            this.txTime = t.getTxTime();
            this.initiator = t.getInitiator();
            this.status = t.getStatus();
            this.remarks = t.getRemarks();
        }
    }

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertiesRepository propertiesRepository;

    @Autowired
    private com.matka.backend.controller.GatewayPaymentController gatewayPaymentController;

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody TransactionEntity tx) {
        if (tx == null || tx.getMobileNumber() == null || tx.getAmount() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message","Missing transaction payload or required fields"));
        }

        // verify user exists
        var userOpt = userRepository.findByMobileNumber(tx.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found for mobile: " + tx.getMobileNumber());
        }

        // set date/time if not provided
        if (tx.getTxDate() == null) tx.setTxDate(LocalDate.now());
        if (tx.getTxTime() == null) tx.setTxTime(LocalTime.now());

        // update user's balance atomically
        var user = userOpt.get();
        Integer current = user.getBalance() == null ? 0 : user.getBalance();
        Integer newBalance = current + tx.getAmount();

        // withdrawals (amount < 0) initiated by user must meet min_withdrawl_amount
        String initiator = tx.getInitiator();
        if (initiator == null) initiator = INITIATOR_USER; // default to user if not supplied
        if (tx.getAmount() != null && tx.getAmount() < 0 && INITIATOR_USER.equalsIgnoreCase(initiator)) {
            // read min_withdrawl_amount from properties table (fallback to 1)
            int minWithdraw = 1;
            try {
                var p = propertiesRepository.findById("minimim_withdrawl_amount");
                if (p.isPresent() && p.get().getValue() != null && !p.get().getValue().isBlank()) {
                    minWithdraw = Integer.parseInt(p.get().getValue());
                }
            } catch (Exception ex) {
                // ignore and use default
            }

            if (Math.abs(tx.getAmount()) < minWithdraw) {
                return ResponseEntity.status(400).body(java.util.Map.of("message", "Withdrawal amount must be >= min_withdrawl_amount", "min_withdrawl_amount", minWithdraw));
            }

            // check withdrawl_time_start and withdrawl_time_end (both stored in properties table)
            try {
                var startProp = propertiesRepository.findById("withdrawl_time_start");
                var endProp = propertiesRepository.findById("withdrawl_time_end");
                if (startProp.isPresent() && endProp.isPresent()
                        && startProp.get().getValue() != null && !startProp.get().getValue().isBlank()
                        && endProp.get().getValue() != null && !endProp.get().getValue().isBlank()) {

                    LocalTime start = LocalTime.parse(startProp.get().getValue());
                    LocalTime end = LocalTime.parse(endProp.get().getValue());
                    LocalTime now = LocalTime.now();

                    boolean allowed;
                    if (start.equals(end)) {
                        // same start and end => treat as allowed all day
                        allowed = true;
                    } else if (start.isBefore(end)) {
                        // normal window within same day
                        allowed = !now.isBefore(start) && !now.isAfter(end);
                    } else {
                        // window crosses midnight (e.g. 22:00 - 06:00)
                        allowed = !now.isBefore(start) || !now.isAfter(end);
                    }

                    if (!allowed) {
                        return ResponseEntity.status(400).body(java.util.Map.of(
                                "message", "Withdrawals are allowed only between configured withdrawl_time_start and withdrawl_time_end",
                                "withdrawl_time_start", start.toString(),
                                "withdrawl_time_end", end.toString()
                        ));
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to evaluate withdrawal time window, allowing by default: {}", ex.getMessage());
            }
        }

        // decide status: only set Pending when initiator is user and balance would go negative
        if (newBalance < 0 && INITIATOR_USER.equalsIgnoreCase(initiator)) {
            tx.setStatus("Pending");
        }

        // apply balance change (allow negative balance when pending)
        user.setBalance(newBalance);
        userRepository.save(user);

        TransactionEntity saved = transactionRepository.save(tx);
        log.info("Saved transaction id={} mobile={} amount={} newBalance={} status={}", saved.getId(), saved.getMobileNumber(), saved.getAmount(), newBalance, saved.getStatus());
        return ResponseEntity.ok(saved);
    }

    // Update transaction status (approve/reject). Request body must include transaction id.
    @PostMapping("/status")
    @Transactional
    public ResponseEntity<?> updateStatus(@RequestBody StatusUpdateRequest req) {
        if (req == null || req.getStatus() == null || req.getId() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message","Missing id or status in request"));
        }

        Long id = req.getId();
        var txOpt = transactionRepository.findById(id);
        if (txOpt.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of("message","Transaction not found: " + id));
        }
        TransactionEntity tx = txOpt.get();

        String newStatus = req.getStatus().trim();
        String remarks = req.getRemarks();

        // only allow Pending/Approved/Rejected
        if (!newStatus.equals("Approved") && !newStatus.equals("Rejected") && !newStatus.equals("Pending")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message","Invalid status; allowed: Pending, Approved, Rejected"));
        }

        // If changing to Approved: set Processing and kick off payout asynchronously
        if (newStatus.equals("Approved")) {
            tx.setStatus("Processing");
            tx.setRemarks(remarks);
            transactionRepository.save(tx);

            // call payout asynchronously (do not block response). Pass only tx id and reload in worker thread to avoid JPA detached-entity issues.
            try {
                final Long txId = tx.getId();
                new Thread(() -> {
                    try {
                        gatewayPaymentController.createPayOutById(txId);
                    } catch (Exception ex) {
                        log.error("Asynchronous payout failed for tx {}: {}", txId, ex.getMessage());
                        try {
                            var tOpt = transactionRepository.findById(txId);
                            if (tOpt.isPresent()) {
                                var t = tOpt.get();
                                t.setStatus("Fail");
                                transactionRepository.save(t);
                            }
                        } catch (Exception e) { /* ignore */ }
                    }
                }).start();
            } catch (Exception ex) {
                log.error("Failed to start async payout thread for tx {}", tx.getId(), ex);
            }

            return ResponseEntity.ok(java.util.Map.of("message","Transaction approved, processing payment", "transaction", tx));
        }

        // If changing to Rejected: set status, set remarks, and refund user if withdrawal
        if (newStatus.equals("Rejected")) {
            tx.setStatus("Rejected");
            if (remarks != null) tx.setRemarks(remarks);
            transactionRepository.save(tx);

            // refund user if tx.amount is negative (withdrawal)
            if (tx.getAmount() != null && tx.getAmount() < 0) {
                var userOpt2 = userRepository.findByMobileNumber(tx.getMobileNumber());
                if (userOpt2.isPresent()) {
                    var user = userOpt2.get();
                    Integer currentBal = user.getBalance() == null ? 0 : user.getBalance();
                    int refund = -tx.getAmount(); // amount is negative
                    user.setBalance(currentBal + refund);
                    userRepository.save(user);
                    log.info("Refunded user {} amount={} after tx {} rejected", user.getMobileNumber(), refund, tx.getId());
                    return ResponseEntity.ok(java.util.Map.of("message","Transaction rejected and refunded", "transaction", tx, "user", user));
                }
            }

            return ResponseEntity.ok(java.util.Map.of("message","Transaction rejected", "transaction", tx));
        }

        return ResponseEntity.badRequest().body(java.util.Map.of("message","Unhandled status"));
    }

    public static class StatusUpdateRequest {
        private Long id;
        private String status;
        private String remarks;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    // List all transactions
    @GetMapping
    public ResponseEntity<java.util.List<TransactionResponse>> listAll() {
        java.util.List<TransactionEntity> list = transactionRepository.findAll();
        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        if (list != null) for (TransactionEntity t : list) out.add(new TransactionResponse(t));
        return ResponseEntity.ok(out);
    }

    // List transactions for a user (mobile number) — accept JSON body { "mobileNumber": "..." }
    @PostMapping("/by-user")
    public ResponseEntity<java.util.List<TransactionResponse>> listByUser(@RequestBody UserTransactionsRequest req) {
        if (req == null || req.getMobileNumber() == null) {
            return ResponseEntity.badRequest().body(new java.util.ArrayList<>());
        }
        java.util.List<TransactionEntity> list = transactionRepository.findByMobileNumber(req.getMobileNumber());
        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        if (list != null) for (TransactionEntity t : list) out.add(new TransactionResponse(t));
        return ResponseEntity.ok(out);
    }

    // ✅ Withdrawals by user (amount < 0) — ONLY initiator=user + sum
    // sum is returned as a positive number (total withdrawn)
    @PostMapping("/withdrawals/by-user")
    public ResponseEntity<?> listWithdrawalsByUser(@RequestBody UserTransactionsRequest req) {
        if (req == null || req.getMobileNumber() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("sum", 0L, "transactions", new java.util.ArrayList<>()));
        }

        java.util.List<TransactionEntity> list =
                transactionRepository.findByMobileNumberAndAmountLessThanAndInitiatorIgnoreCase(
                        req.getMobileNumber(), 0, INITIATOR_USER
                );

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                out.add(new TransactionResponse(t));
                if (t.getAmount() != null) {
                    sum += (long) (-t.getAmount()); // amount is negative, show positive sum
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "transactions", out));
    }

    // ✅ Deposits by user (amount > 0) — ONLY initiator=user + sum
    @PostMapping("/deposits/by-user")
    public ResponseEntity<?> listDepositsByUser(@RequestBody UserTransactionsRequest req) {
        if (req == null || req.getMobileNumber() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "sum", 0L,
                    "transactions", new java.util.ArrayList<>()
            ));
        }

        java.util.List<TransactionEntity> list =
                transactionRepository.findByMobileNumberAndAmountGreaterThanAndInitiatorIgnoreCase(
                        req.getMobileNumber(), 0, INITIATOR_USER
                );

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                out.add(new TransactionResponse(t));
                if (t.getAmount() != null) {
                    sum += (long) t.getAmount();
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "transactions", out));
    }

    // ✅ List all deposits by admin (amount > 0) — ONLY initiator=admin + sum
    @GetMapping("/deposits/admin")
    public ResponseEntity<?> listDepositsAdmin() {
        java.util.List<TransactionEntity> list =
                transactionRepository.findByAmountGreaterThanAndInitiatorIgnoreCase(0, INITIATOR_ADMIN);

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                out.add(new TransactionResponse(t));
                if (t.getAmount() != null) {
                    sum += (long) t.getAmount();
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "transactions", out));
    }

    // List all pending transactions
    @GetMapping("/pending")
    public ResponseEntity<java.util.List<TransactionResponse>> listPending() {
        java.util.List<TransactionEntity> list = transactionRepository.findByStatus("Pending");
        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        if (list != null) for (TransactionEntity t : list) out.add(new TransactionResponse(t));
        return ResponseEntity.ok(out);
    }

    // ✅ List all withdrawals (amount < 0) — ONLY initiator=user
    @GetMapping("/withdrawals")
    public ResponseEntity<java.util.List<TransactionResponse>> listWithdrawals() {
        java.util.List<TransactionEntity> list =
                transactionRepository.findByAmountLessThanAndInitiatorIgnoreCase(0, INITIATOR_USER);

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        if (list != null) for (TransactionEntity t : list) out.add(new TransactionResponse(t));
        return ResponseEntity.ok(out);
    }

    // ✅ List all deposits (amount > 0) + sum (ONLY initiator=user)
    @GetMapping("/deposits")
    public ResponseEntity<?> listDeposits() {
        java.util.List<TransactionEntity> list =
                transactionRepository.findByAmountGreaterThanAndInitiatorIgnoreCase(0, INITIATOR_USER);

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                out.add(new TransactionResponse(t));
                if (t.getAmount() != null) {
                    sum += (long) t.getAmount();
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "transactions", out));
    }

    public static class UserTransactionsRequest {
        private String mobileNumber;
        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    }
}
