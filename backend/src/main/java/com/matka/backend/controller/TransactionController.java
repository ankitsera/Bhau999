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

@RestController
@RequestMapping("/api/transaction")
public class TransactionController {
    private static final Logger log = LoggerFactory.getLogger(TransactionController.class);

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

    // ---- helpers ----
    private boolean isUserInitiated(TransactionEntity t) {
        if (t == null) return false;
        String init = t.getInitiator();
        return init != null && init.trim().equalsIgnoreCase("user");
    }

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
        // decide status: if this causes negative balance, mark pending
        if (newBalance < 0) {
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

        // If changing to Approved: simply set status
        if (newStatus.equals("Approved")) {
            tx.setStatus("Approved");
            tx.setRemarks(remarks);
            transactionRepository.save(tx);
            return ResponseEntity.ok(java.util.Map.of("message","Transaction approved", "transaction", tx));
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

    // ✅ Withdrawals by user (amount < 0) + sum (ONLY initiator=user)
    // sum is returned as a positive number (total withdrawn)
    @PostMapping("/withdrawals/by-user")
    public ResponseEntity<?> listWithdrawalsByUser(@RequestBody UserTransactionsRequest req) {
        if (req == null || req.getMobileNumber() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("sum", 0L, "transactions", new java.util.ArrayList<>()));
        }

        java.util.List<TransactionEntity> list =
                transactionRepository.findByMobileNumberAndAmountLessThan(req.getMobileNumber(), 0);

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                out.add(new TransactionResponse(t));
                if (isUserInitiated(t) && t.getAmount() != null) {
                    // amount is negative -> add absolute to show total withdrawn as positive
                    sum += (long) (-t.getAmount());
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "transactions", out));
    }

    // ✅ Deposits by user (amount > 0) + sum (ONLY initiator=user)
    @PostMapping("/deposits/by-user")
    public ResponseEntity<?> listDepositsByUser(@RequestBody UserTransactionsRequest req) {
        if (req == null || req.getMobileNumber() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("sum", 0L, "transactions", new java.util.ArrayList<>()));
        }

        java.util.List<TransactionEntity> list =
                transactionRepository.findByMobileNumberAndAmountGreaterThan(req.getMobileNumber(), 0);

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                out.add(new TransactionResponse(t));
                if (isUserInitiated(t) && t.getAmount() != null) {
                    sum += (long) t.getAmount(); // positive
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

    // List all withdrawals (amount < 0)
    @GetMapping("/withdrawals")
    public ResponseEntity<java.util.List<TransactionResponse>> listWithdrawals() {
        java.util.List<TransactionEntity> list = transactionRepository.findByAmountLessThan(0);
        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        if (list != null) for (TransactionEntity t : list) out.add(new TransactionResponse(t));
        return ResponseEntity.ok(out);
    }

    // ✅ List all deposits (amount > 0) + sum (ONLY initiator=user)
    @GetMapping("/deposits")
    public ResponseEntity<?> listDeposits() {
        java.util.List<TransactionEntity> list = transactionRepository.findByAmountGreaterThan(0);

        java.util.List<TransactionResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        if (list != null) {
            for (TransactionEntity t : list) {
                // Only include user-initiated deposits
                if (isUserInitiated(t)) {
                    out.add(new TransactionResponse(t));
                    if (t.getAmount() != null) {
                        sum += (long) t.getAmount();
                    }
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
